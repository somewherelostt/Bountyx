import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET: Get bounty by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { message: "Bounty ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("bounties")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Supabase query error:", error);

      // Provide more helpful error messages
      let errorMessage = "Failed to fetch bounty";
      if (
        error.message?.includes("DNS") ||
        error.message?.includes("getaddrinfo") ||
        error.message?.includes("ENOTFOUND")
      ) {
        errorMessage =
          "Database connection failed. Please check your network connection and verify your Supabase configuration.";
      } else if (error.message?.includes("timeout")) {
        errorMessage = "Database request timed out. Please try again.";
      } else if (error.code === "PGRST116") {
        // No rows returned
        return NextResponse.json(
          { message: "Bounty not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          message: errorMessage,
          error:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Get bounty error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
