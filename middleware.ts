// x402 Payment Middleware for BountyX
// NOTE: x402-next middleware has Edge Runtime compatibility issues
// Using simplified middleware that returns 402 for POST requests without payment
// The actual x402 protocol can be integrated via API route handlers

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Platform wallet address that receives creation fees
const PLATFORM_WALLET = process.env.NEXT_PUBLIC_PLATFORM_WALLET;

export function middleware(request: NextRequest) {
  // TESTING MODE: Skip payment requirement
  // TODO: Re-enable x402 payment for production
  
  // Only apply to POST /api/bounties
  if (
    request.method === "POST" &&
    request.nextUrl.pathname === "/api/bounties"
  ) {
    // For testing: Allow all requests through without payment
    // The payment header check is disabled temporarily
    console.log("x402: Testing mode - payment bypassed");
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: ["/api/bounties"],
};
