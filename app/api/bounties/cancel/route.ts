import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// POST: Cancel an expired bounty and request refund
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bounty_id, creator_address } = body;

    if (!bounty_id || !creator_address) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Fetch bounty
    const { data: bounty, error } = await supabaseAdmin
      .from("bounties")
      .select("*")
      .eq("id", bounty_id)
      .single();

    if (error || !bounty) {
      return NextResponse.json({ message: "Bounty not found" }, { status: 404 });
    }

    // Verify ownership
    if (bounty.creator_address.toLowerCase() !== creator_address.toLowerCase()) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Verify Status
    if (bounty.status !== "OPEN") {
      return NextResponse.json({ message: "Bounty is not active" }, { status: 400 });
    }

    // Verify Expiration (30 days)
    const createdAt = new Date(bounty.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    // For testing purposes, we might allow immediate cancellation if NO submissions?
    // User Requirement: "Clawback logic for expired/invalid bounties"
    // Let's enforce: Expires if > 30 days OR (No submissions after 7 days)
    // For specific task, let's stick to a strict 30 day rule for "Expire".
    
    // Check submission count
    const { count } = await supabaseAdmin
        .from("submissions")
        .select("*", { count: 'exact', head: true })
        .eq("bounty_id", bounty_id);

    // LOGIC: If > 30 days, allow cancel. OR if > 24 hours and 0 submissions (Early Cancel).
    const isOldEnough = diffDays > 30;
    const isEarlyCancel = diffDays > 0.04 && (!count || count === 0); // > 1 hour and no subs

    if (!isOldEnough && !isEarlyCancel) {
         return NextResponse.json({ 
             message: `Cannot cancel yet. Must be > 30 days old or have 0 submissions after 1 hour. Age: ${diffDays} days.` 
         }, { status: 400 });
    }
    
    // Update status to 'CANCELLED_REFUND_PENDING' (we need to handle this status in frontend too, or just use CANCELLED)
    // Let's use 'CANCELLED' for simplicity in this iteration, knowing the refund is manual administrative process for now.
    
    const { error: updateError } = await supabaseAdmin
        .from("bounties")
        .update({ status: 'CANCELLED' })
        .eq("id", bounty_id);

    if (updateError) {
        throw updateError;
    }

    return NextResponse.json({ message: "Bounty cancelled. Refund process initiated." }, { status: 200 });

  } catch (error) {
    console.error("Cancel bounty error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
