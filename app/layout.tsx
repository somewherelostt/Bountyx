import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { BrutalNotificationProvider } from "@/components/ui/BrutalNotification";

// Force dynamic rendering for all pages (Privy needs client-side)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "BOUNTYX | ONCHAIN BOUNTIES",
  description: "Post bounties. Hunt rewards. Get paid onchain.",
  keywords: ["bounty", "web3", "arbitrum", "crypto", "onchain"],
  other: {
    "base:app_id": "69422f91d19763ca26ddc37d",
  },
  icons: {
    icon: "/basepad-icon-32.png",
    shortcut: "/basepad-icon-64.png",
    apple: "/basepad-icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="brutal-mesh-bg text-brutal-black min-h-screen">
        <div className="brutal-grain" />
        <Providers>
            <BrutalNotificationProvider>
                {children}
            </BrutalNotificationProvider>
        </Providers>
      </body>
    </html>
  );
}
