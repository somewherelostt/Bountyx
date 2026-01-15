import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "@/lib/arbitrum";

// Custodial platform wallet for payouts
const PLATFORM_PRIVATE_KEY = process.env
  .PLATFORM_WALLET_PRIVATE_KEY as `0x${string}`;

// POST: Execute payout to winner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bounty_id, submission_id, winner_address, creator_address, rank } = body;

    // Validate required fields
    if (!bounty_id || !submission_id || !winner_address || !creator_address) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch the bounty
    const { data: bounty, error: bountyError } = await supabaseAdmin
      .from("bounties")
      .select("*")
      .eq("id", bounty_id)
      .single();

    if (bountyError || !bounty) {
      return NextResponse.json(
        { message: "Bounty not found" },
        { status: 404 }
      );
    }

    // Verify creator ownership
    if (
      bounty.creator_address.toLowerCase() !== creator_address.toLowerCase()
    ) {
      return NextResponse.json(
        { message: "Only the bounty creator can select a winner" },
        { status: 403 }
      );
    }

    // Determine payload amount and logic based on Multi-Prize vs Legacy
    let amountToPay = "0";
    let isMultiPrize = false;
    const prizeRank = rank || 1;

    if (bounty.prizes && Array.isArray(bounty.prizes) && bounty.prizes.length > 0) {
        // Multi-Prize Logic
        isMultiPrize = true;
        
        if (!rank) {
             return NextResponse.json({ message: "Rank is required for multi-prize bounties" }, { status: 400 });
        }

        const prizeTier = bounty.prizes.find((p: { rank: number; amount: string }) => p.rank === rank);
        if (!prizeTier) {
            return NextResponse.json({ message: "Invalid prize rank" }, { status: 400 });
        }

        // Check if this rank is already awarded
        const winners = bounty.winners || [];
        if (winners.some((w: { rank: number }) => w.rank === rank)) {
            return NextResponse.json({ message: "This prize rank has already been awarded" }, { status: 400 });
        }

        amountToPay = prizeTier.amount;
    } else {
        // Legacy Logic
        if (bounty.status !== "OPEN") {
             return NextResponse.json({ message: "Bounty has already been paid out" }, { status: 400 });
        }
        amountToPay = bounty.prize;
    }

    // Verify submission exists and belongs to this bounty
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from("submissions")
      .select("*")
      .eq("id", submission_id)
      .eq("bounty_id", bounty_id)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { message: "Submission not found" },
        { status: 404 }
      );
    }

    // Verify winner address matches submission
    if (
      submission.hunter_address.toLowerCase() !== winner_address.toLowerCase()
    ) {
      return NextResponse.json(
        { message: "Winner address does not match submission" },
        { status: 400 }
      );
    }

    // Execute payout from custodial wallet (USDC)
    if (!PLATFORM_PRIVATE_KEY) {
      console.error("Platform wallet private key not configured");
      return NextResponse.json(
        { message: "Payout system not configured" },
        { status: 500 }
      );
    }

    try {
      const account = privateKeyToAccount(PLATFORM_PRIVATE_KEY);
      const walletClient = createWalletClient({
        account,
        chain: arbitrumSepolia,
        transport: http(),
      });

      // USDC Implementation
      const usdcAddress = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"; // USDC on Arbitrum Sepolia
      const usdcAbi = [
          {
            constant: false,
            inputs: [
              { name: "_to", type: "address" },
              { name: "_value", type: "uint256" },
            ],
            name: "transfer",
            outputs: [{ name: "", type: "bool" }],
            type: "function",
          },
      ] as const;

       // Parse amount (assume 6 decimals for USDC)
      const amountUnits = BigInt(Math.round(parseFloat(amountToPay) * 1_000_000));

      console.log(`Sending ${amountUnits} USDC to ${winner_address}`);

      const hash = await walletClient.writeContract({
        address: usdcAddress,
        abi: usdcAbi,
        functionName: 'transfer',
        args: [winner_address, amountUnits],
      });

      console.log("Payout TX:", hash);

      // Update Database
      if (isMultiPrize) {
          const currentWinners = bounty.winners || [];
          const newWinner = {
              rank: prizeRank,
              submission_id: submission_id,
              hunter_address: winner_address,
              amount: amountToPay
          };
          const updatedWinners = [...currentWinners, newWinner];

          // Check if all prizes are awarded
          const allAwarded = bounty.prizes.every((p: { rank: number }) => updatedWinners.some((w: { rank: number }) => w.rank === p.rank));
          const newStatus = allAwarded ? "PAID" : "OPEN";

          await supabaseAdmin
            .from("bounties")
            .update({
                winners: updatedWinners,
                status: newStatus,
                // If it's the last one, maybe set winner_address to the first one or leave it?
                // Legacy field winner_address might be used for display. Let's set it to the primary winner (rank 1) if available.
                winner_address: prizeRank === 1 ? winner_address : bounty.winner_address
            })
            .eq("id", bounty_id);

      } else {
          // Legacy Update
          await supabaseAdmin
            .from("bounties")
            .update({
              status: "PAID",
              winner_address: winner_address.toLowerCase(),
            })
            .eq("id", bounty_id);
      }

      // Update Submission Transparency
      await supabaseAdmin.from("submissions")
        .update({
            is_public: true, // Winner is always public? Or all submissions become public? Prompt says "After bounty resolution, all submissions are made public". 
            // We should probably trigger a batch update if the bounty is fully resolved.
            // For now, let's mark the winner as public and having won.
            prize_won: parseFloat(amountToPay),
            rank: prizeRank
        })
        .eq("id", submission_id);


      // If bounty is fully resolved, mark ALL submissions as public
      // We can check the `newStatus` from above logic, but for simplicity, let's just do it if isLegacy or if allAwarded logic passed.
      // Re-evaluating:
      // If legacy -> fully resolved.
      // If multi -> need to check if all prizes awarded.
      
      let fullyResolved = !isMultiPrize;
      if (isMultiPrize) {
          const winners = (bounty.winners || []).concat([{ rank: prizeRank }]); // simplistic check
          if (winners.length >= bounty.prizes.length) {
              fullyResolved = true;
          }
      }

      if (fullyResolved) {
          await supabaseAdmin
            .from("submissions")
            .update({ is_public: true })
            .eq("bounty_id", bounty_id);
      }

      return NextResponse.json({
        success: true,
        txHash: hash,
        winner: winner_address,
        prize: amountToPay,
      });
    } catch (txError) {
      console.error("Transaction failed:", txError);
      return NextResponse.json(
        {
          message:
            "Payout transaction failed. Platform wallet may have insufficient funds or gas.",
          error: txError instanceof Error ? txError.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Payout error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
