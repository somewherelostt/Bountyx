import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { triggerAsyncAIReview } from "@/lib/ai-review";
import { notifyNewSubmission } from "@/lib/telegram";

// POST: Create a new submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bounty_id, hunter_address, content, contact } = body;

    // Validate required fields
    if (!bounty_id || !hunter_address || !content || !contact) {
      return NextResponse.json(
        {
          message:
            "Missing required fields: bounty_id, hunter_address, content, contact",
        },
        { status: 400 }
      );
    }

    // Check if bounty exists and is open
    const { data: bounty, error: bountyError } = await supabaseAdmin
      .from("bounties")
      .select("*")
      .eq("id", bounty_id)
      .single();

    if (bountyError) {
      console.error("Supabase query error (bounty):", bountyError);
      let errorMessage = "Failed to fetch bounty";
      if (bountyError.message?.includes("DNS") || bountyError.message?.includes("getaddrinfo") || bountyError.message?.includes("ENOTFOUND")) {
        errorMessage = "Database connection failed. Please check your network connection and verify your Supabase configuration.";
      }
      return NextResponse.json(
        { 
          message: errorMessage,
          error: process.env.NODE_ENV === "development" ? bountyError.message : undefined
        },
        { status: 500 }
      );
    }
    
    if (!bounty) {
      return NextResponse.json(
        { message: "Bounty not found" },
        { status: 404 }
      );
    }

    if (bounty.status !== "OPEN") {
      return NextResponse.json(
        { message: "Bounty is not open for submissions" },
        { status: 400 }
      );
    }

    // Prevent creator from submitting to their own bounty
    if (bounty.creator_address.toLowerCase() === hunter_address.toLowerCase()) {
      return NextResponse.json(
        { message: "You cannot submit to your own bounty" },
        { status: 400 }
      );
    }

    // Check for duplicate submission
    const { data: existingSubmission } = await supabaseAdmin
      .from("submissions")
      .select("id")
      .eq("bounty_id", bounty_id)
      .eq("hunter_address", hunter_address.toLowerCase())
      .single();

    if (existingSubmission) {
      return NextResponse.json(
        { message: "You have already submitted to this bounty" },
        { status: 400 }
      );
    }

    // --- INTEGRITY: ANCHORING ---
    // 1. Calculate Content Hash (SHA-256) to prevent unnoticed edits
    const { createHash } = await import("crypto");
    const hashInput = JSON.stringify({ content, contact }); // Anchor both content and contact
    const content_hash = createHash("sha256").update(hashInput).digest("hex");

    // 2. Fetch Current Block Number (Arbitrum Sepolia) for timestamp ordering
    let block_number = 0;
    try {
        const { JsonRpcProvider } = await import("ethers");
        const provider = new JsonRpcProvider("https://sepolia-rollup.arbitrum.io/rpc");
        block_number = await provider.getBlockNumber();
    } catch (err) {
        console.warn("Failed to fetch block number for anchoring:", err);
        // We continue without block number rather than failing the submission, 
        // but robust system would retry or fail. For now, 0 or null.
    }

    // Create the submission
    const { data, error } = await supabaseAdmin
      .from("submissions")
      .insert({
        bounty_id,
        hunter_address: hunter_address.toLowerCase(),
        content,
        contact,
        content_hash, 
        block_number,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      
      // Provide more helpful error messages
      let errorMessage = "Failed to create submission";
      if (error.message?.includes("DNS") || error.message?.includes("getaddrinfo") || error.message?.includes("ENOTFOUND")) {
        errorMessage = "Database connection failed. Please check your network connection and verify your Supabase configuration.";
      } else if (error.message?.includes("timeout")) {
        errorMessage = "Database request timed out. Please try again.";
      }
      
      return NextResponse.json(
        { 
          message: errorMessage,
          error: process.env.NODE_ENV === "development" ? error.message : undefined
        },
        { status: 500 }
      );
    }

    // Trigger async AI review (non-blocking)
    triggerAsyncAIReview(data.id, bounty_id, content, bounty.title, bounty.description);

    // Send Telegram notification (non-blocking)
    notifyNewSubmission(
      bounty.title,
      bounty_id,
      hunter_address.toLowerCase(),
      bounty.prize
    ).catch(console.error);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Create submission error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: List submissions (by bounty or hunter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bountyId = searchParams.get("bounty_id");
    const hunter = searchParams.get("hunter");

    if (!bountyId && !hunter) {
      return NextResponse.json(
        { message: "Provide bounty_id or hunter address" },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (bountyId) {
      query = query.eq("bounty_id", bountyId);
    }

    if (hunter) {
      query = query.eq("hunter_address", hunter.toLowerCase());
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase query error:", error);
      
      // Provide more helpful error messages
      let errorMessage = "Failed to fetch submissions";
      if (error.message?.includes("DNS") || error.message?.includes("getaddrinfo") || error.message?.includes("ENOTFOUND")) {
        errorMessage = "Database connection failed. Please check your network connection and verify your Supabase configuration.";
      } else if (error.message?.includes("timeout")) {
        errorMessage = "Database request timed out. Please try again.";
      }
      
      return NextResponse.json(
        { 
          message: errorMessage,
          error: process.env.NODE_ENV === "development" ? error.message : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Get submissions error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
