"use client";

import { BrutalButton } from "./BrutalButton";

interface SocialShareProps {
  bountyTitle: string;
  bountyId: string;
  status?: "SUBMITTED" | "PAID";
  className?: string;
}

/**
 * The "Maaz Loop" - Viral Social Share Component
 * Every submission turns into a Twitter promo
 */
export function SocialShare({
  bountyTitle,
  bountyId,
  status = "SUBMITTED",
  className = "",
}: SocialShareProps) {
  const handleShare = () => {
    const statusText = status === "PAID" ? "GOT PAID 💰" : "WAITING FOR REVIEW";

    const tweetText = `Just shipped code on BountyX 🟢

Bounty: ${bountyTitle}
Status: ${statusText}

Platform built by @maaztwts. #BuildOnArbitrum #BountyX`;

    // Include the bounty URL for the OG image preview
    const bountyUrl = `${window.location.origin}/bounties/${bountyId}`;

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      tweetText
    )}&url=${encodeURIComponent(bountyUrl)}`;

    window.open(
      twitterUrl,
      "_blank",
      "noopener,noreferrer,width=600,height=400"
    );
  };

  return (
    <button
      onClick={handleShare}
      className={`
        w-full
        bg-brutal-green text-brutal-black
        border-4 border-brutal-black
        shadow-[6px_6px_0px_0px_#000000]
        font-black uppercase text-lg md:text-xl
        px-8 py-5
        transition-all duration-100 ease-in-out
        hover:shadow-[8px_8px_0px_0px_#000000] hover:-translate-x-1 hover:-translate-y-1
        active:shadow-[2px_2px_0px_0px_#000000] active:translate-x-1 active:translate-y-1
        cursor-pointer
        ${className}
      `}
    >
      <span className="flex items-center justify-center gap-3">
        <span className="text-2xl">📢</span>
        <span>TELL THE WORLD</span>
      </span>
    </button>
  );
}

/**
 * Compact version for inline use
 */
export function SocialShareCompact({
  bountyTitle,
  bountyId,
  status = "SUBMITTED",
}: SocialShareProps) {
  const handleShare = () => {
    const statusText = status === "PAID" ? "GOT PAID 💰" : "WAITING FOR REVIEW";

    const tweetText = `Just shipped code on BountyX 🟢

Bounty: ${bountyTitle}
Status: ${statusText}

Platform built by @maaztwts. #BuildOnArbitrum #BountyX`;

    const bountyUrl = `${window.location.origin}/bounties/${bountyId}`;

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      tweetText
    )}&url=${encodeURIComponent(bountyUrl)}`;

    window.open(
      twitterUrl,
      "_blank",
      "noopener,noreferrer,width=600,height=400"
    );
  };

  return (
    <BrutalButton variant="primary" size="sm" onClick={handleShare}>
      📢 SHARE
    </BrutalButton>
  );
}
