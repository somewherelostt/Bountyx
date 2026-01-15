import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address, username, bio, twitter, discord } = body;

    if (!wallet_address) {
      return NextResponse.json(
        { message: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Upsert profile using Admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .upsert({
        wallet_address: wallet_address.toLowerCase(),
        username,
        bio,
        twitter,
        discord,
        // created_at will be preserved or default if new? 
        // upsert with primary key should just update other fields.
      })
      .select()
      .single();

    if (error) {
      console.error("Profile update error:", error);
      
      // Provide more helpful error messages
      let errorMessage = "Failed to update profile";
      if (error.message?.includes("DNS") || error.message?.includes("getaddrinfo") || error.message?.includes("ENOTFOUND")) {
        errorMessage = "Database connection failed. Please check your network connection and verify your Supabase configuration.";
      } else if (error.message?.includes("timeout")) {
        errorMessage = "Database request timed out. Please try again.";
      }
      
      return NextResponse.json(
        { 
          message: errorMessage,
          details: process.env.NODE_ENV === "development" ? error.message : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Internal error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
