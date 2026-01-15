import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

// Create a lightweight Supabase client for edge runtime
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Support both direct params and bountyId lookup
    const bountyId = searchParams.get("bountyId");
    let title = searchParams.get("title") || "BOUNTY";
    let prize = searchParams.get("prize") || "0.1";
    let status = searchParams.get("status") || "OPEN";

    // If bountyId is provided, fetch from database
    if (bountyId && supabaseUrl && supabaseAnonKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data: bounty } = await supabase
          .from("bounties")
          .select("title, prize, status")
          .eq("id", bountyId)
          .single();

        if (bounty) {
          title = bounty.title;
          prize = bounty.prize;
          status = bounty.status;
        }
      } catch (dbError) {
        console.error("Failed to fetch bounty for OG:", dbError);
      }
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#FFFFFF",
            padding: "60px",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {/* BORDER FRAME */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              border: "8px solid #000000",
              boxShadow: "12px 12px 0px 0px #000000",
              padding: "40px",
            }}
          >
            {/* HEADER */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "40px",
              }}
            >
              <div
                style={{
                  fontSize: "48px",
                  fontWeight: 900,
                  letterSpacing: "-2px",
                  textTransform: "uppercase",
                }}
              >
                BOUNTYX
              </div>
              <div
                style={{
                  display: "flex",
                  backgroundColor: status === "PAID" ? "#FF00FF" : "#00FF00",
                  color: "#000000",
                  padding: "12px 24px",
                  fontSize: "24px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  border: "4px solid #000000",
                }}
              >
                {status}
              </div>
            </div>

            {/* BOUNTY TITLE */}
            <div
              style={{
                display: "flex",
                flex: 1,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontSize: "72px",
                  fontWeight: 900,
                  letterSpacing: "-3px",
                  textTransform: "uppercase",
                  lineHeight: 1.1,
                  maxWidth: "100%",
                  overflow: "hidden",
                }}
              >
                {title.length > 50 ? title.slice(0, 50) + "..." : title}
              </div>
            </div>

            {/* PRIZE SECTION */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    opacity: 0.6,
                  }}
                >
                  BOUNTY PRIZE
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "96px",
                      fontWeight: 900,
                      letterSpacing: "-4px",
                      color: "#00FF00",
                      textShadow: "4px 4px 0px #000000",
                    }}
                  >
                    {prize}
                  </span>
                  <span
                    style={{
                      fontSize: "48px",
                      fontWeight: 900,
                    }}
                  >
                    ETH
                  </span>
                </div>
              </div>

              {/* BASE LOGO / BRANDING */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                }}
              >
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    opacity: 0.5,
                  }}
                >
                  Built on
                </div>
                <div
                  style={{
                    fontSize: "36px",
                    fontWeight: 900,
                    backgroundColor: "#0052FF",
                    color: "#FFFFFF",
                    padding: "8px 20px",
                    textTransform: "uppercase",
                  }}
                >
                  ARBITRUM
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("OG Image generation error:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
