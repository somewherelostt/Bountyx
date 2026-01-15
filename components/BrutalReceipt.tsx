"use client";

import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { BrutalButton } from "./BrutalButton";
import { useBrutalNotification } from "./ui/BrutalNotification";

interface BrutalReceiptProps {
  bountyTitle: string;
  bountyId: string;
  amount: string; // ETH amount
  hunterAddress: string;
  txHash: string;
  timestamp?: string;
}

/**
 * Brutal Receipt Component
 * Looks like a physical grocery receipt but NEON
 * Proof of work for completed bounties
 */
export function BrutalReceipt({
  bountyTitle,
  bountyId,
  amount,
  hunterAddress,
  txHash,
  timestamp = new Date().toISOString(),
}: BrutalReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const { notify } = useBrutalNotification();

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
    };
  };

  const handleDownload = async () => {
    if (!receiptRef.current) return;

    setDownloading(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: "#000000",
        scale: 2,
      });

      const link = document.createElement("a");
      link.download = `receipt-${bountyId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      notify.success("Receipt downloaded successfully!");
    } catch (error) {
      console.error("Failed to download receipt:", error);
      notify.error("Failed to download receipt. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const { date, time } = formatDate(timestamp);

  return (
    <div className="space-y-4">
      {/* THE RECEIPT */}
      <div
        ref={receiptRef}
        className="bg-brutal-black text-brutal-green font-mono p-6 border-4 border-brutal-green"
        style={{
          fontFamily: "'Courier New', monospace",
          boxShadow: "0 0 20px rgba(0, 255, 0, 0.3)",
        }}
      >
        {/* HEADER */}
        <div className="text-center mb-4">
          <div className="text-2xl font-bold tracking-widest">BOUNTYX</div>
          <div className="text-xs tracking-wider opacity-70">
            ONCHAIN BOUNTY RECEIPT
          </div>
          <div className="mt-2 border-b-2 border-dashed border-brutal-green opacity-50" />
        </div>

        {/* RECEIPT BODY */}
        <div className="space-y-3 text-sm">
          {/* DATE/TIME */}
          <div className="flex justify-between">
            <span className="opacity-70">DATE:</span>
            <span>{date}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-70">TIME:</span>
            <span>{time}</span>
          </div>

          <div className="border-b border-dashed border-brutal-green opacity-30" />

          {/* BOUNTY INFO */}
          <div>
            <div className="opacity-70 text-xs">BOUNTY:</div>
            <div className="text-brutal-green font-bold uppercase truncate">
              {bountyTitle}
            </div>
          </div>

          <div className="border-b border-dashed border-brutal-green opacity-30" />

          {/* HUNTER */}
          <div className="flex justify-between">
            <span className="opacity-70">HUNTER:</span>
            <span className="text-brutal-green">
              {truncateAddress(hunterAddress)}
            </span>
          </div>

          <div className="border-b border-dashed border-brutal-green opacity-30" />

          {/* AMOUNT - BIG AND BOLD */}
          <div className="py-3 text-center">
            <div className="text-xs opacity-70 mb-1">AMOUNT PAID</div>
            <div
              className="text-4xl font-black"
              style={{
                textShadow: "0 0 10px rgba(0, 255, 0, 0.5)",
              }}
            >
              {amount} ETH
            </div>
          </div>

          <div className="border-b border-dashed border-brutal-green opacity-30" />

          {/* TX HASH */}
          <div>
            <div className="opacity-70 text-xs">TX HASH:</div>
            <div className="text-xs break-all opacity-80">
              {truncateHash(txHash)}
            </div>
          </div>

          <div className="border-b-2 border-dashed border-brutal-green opacity-50" />

          {/* FOOTER */}
          <div className="text-center pt-2">
            <div className="text-xs opacity-70">VERIFIED ON ARBITRUM</div>
            <div className="mt-2 text-lg">★ PROOF OF WORK ★</div>
            <div className="text-xs opacity-50 mt-2">
              @maaztwts • #BuildOnArbitrum
            </div>
          </div>

          {/* BARCODE EFFECT */}
          <div className="mt-4 flex justify-center gap-0.5">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="bg-brutal-green"
                style={{
                  width: Math.random() > 0.5 ? "2px" : "3px",
                  height: "30px",
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* DOWNLOAD BUTTON */}
      <BrutalButton
        variant="primary"
        fullWidth
        onClick={handleDownload}
        disabled={downloading}
      >
        {downloading ? "GENERATING..." : "📥 DOWNLOAD RECEIPT"}
      </BrutalButton>
    </div>
  );
}

/**
 * Mini receipt preview for lists
 */
export function BrutalReceiptMini({
  amount,
  txHash,
}: {
  amount: string;
  txHash: string;
}) {
  return (
    <div
      className="inline-flex items-center gap-2 bg-brutal-black text-brutal-green font-mono text-xs px-3 py-1 border-2 border-brutal-green"
      style={{
        fontFamily: "'Courier New', monospace",
      }}
    >
      <span>💰</span>
      <span className="font-bold">{amount} ETH</span>
      <span className="opacity-50">|</span>
      <span className="opacity-70">{txHash.slice(0, 8)}...</span>
    </div>
  );
}
