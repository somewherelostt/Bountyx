"use client";

import Link from "next/link";
import { BrutalButton } from "@/components/BrutalButton";
import Scene3DWrapper from "@/components/Scene3DWrapper";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { formatUSDC } from "@/lib/format";
import { Bounty, PrizeTier } from "@/lib/supabase";

interface BountyStats {
  totalBounties: number;
  totalPrize: string;
  huntersPaid: number;
}

export default function Home() {
  const [stats, setStats] = useState<BountyStats>({
    totalBounties: 0,
    totalPrize: "0",
    huntersPaid: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/bounties");
        const bounties: Bounty[] = await response.json();

        const totalBounties = bounties.length;
        const totalPrize = bounties.reduce((sum: number, b: Bounty) => {
          let bountyAmount = 0;
          if (b.prizes && Array.isArray(b.prizes) && b.prizes.length > 0) {
              // Sum up all prize tiers
              bountyAmount = b.prizes.reduce((pSum: number, p: PrizeTier) => pSum + (parseFloat(p.amount) || 0), 0);
          } else if (b.prize && b.prize !== "MULTI") {
              bountyAmount = parseFloat(b.prize) || 0;
          }
          return sum + bountyAmount;
        }, 0).toString();
        const huntersPaid = bounties.filter((b: { status?: string }) => b.status === "PAID").length;

        setStats({
          totalBounties,
          totalPrize,
          huntersPaid,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const features = [
    {
      icon: "⛓️",
      title: "x402 PAYMENTS",
      desc: "Instant USDC payouts on Arbitrum Sepolia.",
    },
    {
      icon: "🤖",
      title: "AI AUTO-REVIEW",
      desc: "Powered by Gemini 2.0 Flash. Get instant code grading.",
    },
    {
      icon: "⚡",
      title: "TELEGRAM ALERTS",
      desc: "Native bot integration. Never miss a submission.",
    },
  ];

  const marqueeItems = ["ARBITRUM", "x402", "ONCHAIN", "BUILDERS", "USDC", "BOUNTIES"];

  return (
    <main className="min-h-screen">
      {/* 3D BACKGROUND SCENE */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Scene3DWrapper />
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
      </div>

      {/* HERO SECTION */}
      <section className="relative z-10 px-4 py-8 md:px-8 md:py-16 lg:px-12">
        {/* BADGES */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="px-3 py-1 border-2 border-brutal-green bg-black/60 text-brutal-green text-xs font-black uppercase backdrop-blur-sm">
            ⛓️ x402 POWERED
          </div>
          <div className="px-3 py-1 border-2 border-brutal-white bg-black/60 text-brutal-white text-xs font-black uppercase backdrop-blur-sm">
            🤖 GEMINI 2.0 REVIEW
          </div>
          <div className="px-3 py-1 border-2 border-brutal-white bg-black/60 text-brutal-white text-xs font-black uppercase backdrop-blur-sm">
            🏗️ BOUNTY$$
          </div>
        </div>

        {/* HERO CONTENT */}
        <div className="brutal-grid items-center gap-8 md:gap-12 mb-12">
          <div className="order-2 md:order-1">
            {/* STATS BOX */}
            <div className="border-4 border-brutal-black bg-brutal-yellow/90 p-4 md:p-6 mb-4 backdrop-blur-sm" style={{ boxShadow: "3px 3px 0px 0px #000000" }}>
              <p className="text-xs font-bold uppercase mb-2">TOTAL PRIZE POOL</p>
              <p className="text-2xl md:text-4xl font-black truncate">
                {loading ? "..." : formatUSDC(stats.totalPrize)}
              </p>
            </div>
            <div className="border-4 border-brutal-black bg-brutal-pink/90 p-4 md:p-6 backdrop-blur-sm" style={{ boxShadow: "3px 3px 0px 0px #000000" }}>
              <p className="text-xs font-bold uppercase mb-2">BOUNTIES POSTED</p>
              <p className="text-2xl md:text-4xl font-black">
                {loading ? "..." : stats.totalBounties}
              </p>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <h1 className="text-3xl md:text-5xl lg:text-7xl font-black leading-tight md:leading-none mb-4 md:mb-6 text-brutal-white drop-shadow-lg">
              BUILD.
              <br />
              <span className="text-brutal-green drop-shadow-lg">EARN.</span>
              <br />
              SHIP.
            </h1>
            <p className="text-sm md:text-base lg:text-lg font-bold mb-6 max-w-md text-brutal-white drop-shadow-lg">
              THE ONCHAIN BOUNTY BOARD FOR ARBITRUM BUILDERS.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/create">
                <BrutalButton variant="primary" size="md">
                  POST A BOUNTY
                </BrutalButton>
              </Link>
              <Link href="/bounties">
                <BrutalButton variant="secondary" size="md">
                  HUNT BOUNTIES
                </BrutalButton>
              </Link>
            </div>
          </div>
        </div>

        {/* MARQUEE */}
        <div className="overflow-hidden border-4 border-brutal-green bg-black/80 py-4 mb-12 backdrop-blur-sm">
          <motion.div
            className="flex gap-8 whitespace-nowrap"
            animate={{ x: [0, -1500] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          >
            {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
              <span
                key={i}
                className="text-brutal-green font-black text-2xl md:text-3xl drop-shadow-lg"
              >
                {item}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="relative z-10 bg-brutal-black text-brutal-white py-8 md:py-16 px-4 md:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black mb-6 md:mb-8 text-center">
            WHY <span className="text-brutal-green">BOUNTYX</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                className="border-4 border-brutal-white p-5"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                style={{ boxShadow: "3px 3px 0px 0px #00FF00" }}
              >
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-black mb-2">{feature.title}</h3>
                <p className="font-semibold text-sm text-gray-300">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative z-10 bg-brutal-black py-12 md:py-20 px-4 md:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black mb-12 md:mb-16 text-center text-brutal-white">
            HOW IT <span className="text-brutal-green">WORKS</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* STEP 1 */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0 }}
            >
              <div className="border-4 border-brutal-black p-6 md:p-8 h-full" style={{ 
                background: "linear-gradient(135deg, #ffffff 0%, #f0fff4 100%)",
                boxShadow: "4px 4px 0px 0px #000000" 
              }}>
                {/* Step Number */}
                <div className="mb-6">
                  <div className="inline-block">
                    <div className="text-5xl md:text-6xl font-black text-brutal-green" style={{ 
                      WebkitTextStroke: "2px #000000",
                      paintOrder: "stroke fill"
                    }}>
                      01
                    </div>
                  </div>
                </div>
                
                {/* Icon */}
                <div className="text-4xl mb-4">📝</div>
                
                {/* Title */}
                <h3 className="text-xl md:text-2xl font-black mb-3 uppercase">POST</h3>
                
                {/* Description */}
                <p className="font-semibold text-sm md:text-base text-brutal-black leading-relaxed break-words">
                  Pay 0.001 USDC to post your bounty. Describe the work. Set the prize.
                </p>
              </div>
              
              {/* Connector Line (hidden on mobile) */}
              <div className="hidden md:block absolute -right-4 top-1/2 w-8 h-1 bg-brutal-black transform -translate-y-1/2" style={{ boxShadow: "2px 2px 0px 0px #00FF00" }}></div>
            </motion.div>

            {/* STEP 2 */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <div className="border-4 border-brutal-black p-6 md:p-8 h-full" style={{ 
                background: "linear-gradient(135deg, #ffffff 0%, #fdf2f8 100%)",
                boxShadow: "4px 4px 0px 0px #000000" 
              }}>
                {/* Step Number */}
                <div className="mb-6">
                  <div className="inline-block">
                    <div className="text-5xl md:text-6xl font-black text-brutal-pink" style={{ 
                      WebkitTextStroke: "2px #000000",
                      paintOrder: "stroke fill"
                    }}>
                      02
                    </div>
                  </div>
                </div>
                
                {/* Icon */}
                <div className="text-4xl mb-4">🎯</div>
                
                {/* Title */}
                <h3 className="text-xl md:text-2xl font-black mb-3 uppercase">HUNT</h3>
                
                {/* Description */}
                <p className="font-semibold text-sm md:text-base text-brutal-black leading-relaxed break-words">
                  Hunters submit their work for free. Prove your skills. Claim the bag.
                </p>
              </div>
              
              {/* Connector Line (hidden on mobile) */}
              <div className="hidden md:block absolute -right-4 top-1/2 w-8 h-1 bg-brutal-black transform -translate-y-1/2" style={{ boxShadow: "2px 2px 0px 0px #FF00FF" }}></div>
            </motion.div>

            {/* STEP 3 */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="border-4 border-brutal-black p-6 md:p-8 h-full" style={{ 
                background: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)",
                boxShadow: "4px 4px 0px 0px #000000" 
              }}>
                {/* Step Number */}
                <div className="mb-6">
                  <div className="inline-block">
                    <div className="text-5xl md:text-6xl font-black text-brutal-yellow" style={{ 
                      WebkitTextStroke: "2px #000000",
                      paintOrder: "stroke fill"
                    }}>
                      03
                    </div>
                  </div>
                </div>
                
                {/* Icon */}
                <div className="text-4xl mb-4">💰</div>
                
                {/* Title */}
                <h3 className="text-xl md:text-2xl font-black mb-3 uppercase">PAYOUT</h3>
                
                {/* Description */}
                <p className="font-semibold text-sm md:text-base text-brutal-black leading-relaxed break-words">
                  Creator picks winner. Platform executes payout. USDC hits your wallet.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* BRUTAL FOOTER */}
      <footer className="relative z-10 border-t-4 border-brutal-green bg-brutal-black py-8 md:py-12 px-4 md:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-8">
            {/* BRANDING */}
            <div>
              <p className="text-2xl md:text-3xl font-black text-brutal-white mb-2">
                BOUNTY<span className="text-brutal-green">X</span>
              </p>
              <p className="text-xs font-bold text-brutal-green uppercase">
                ONCHAIN BOUNTY BOARD
              </p>
            </div>

            {/* LINKS */}
            <div>
              <p className="text-xs font-black text-brutal-green uppercase mb-3">LINKS</p>
              <div className="space-y-2 flex flex-col">
                <a 
                  href="https://twitter.com/maaztwts" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-brutal-white hover:text-brutal-green transition-colors duration-200 block"
                >
                  TWITTER
                </a>
                <a 
                  href="https://github.com/somewherelostt/bountyx" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-brutal-white hover:text-brutal-green transition-colors duration-200 block"
                >
                  GITHUB
                </a>
                <a 
                  href="https://sepolia.arbiscan.io/address/0x6730d29d8473f758893e454c247dfddffe927bdb" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-brutal-white hover:text-brutal-green transition-colors duration-200 block"
                >
                  CONTRACT
                </a>
              </div>
            </div>

            {/* BUILT BY */}
            <div>
              <p className="text-xs font-black text-brutal-green uppercase mb-3">BUILT BY</p>
              <a 
                href="https://twitter.com/maaztwts" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-bold text-brutal-white hover:text-brutal-green transition-colors duration-200"
              >
                @MAAZTWTS
              </a>
              <p className="text-xs font-bold text-brutal-green uppercase mt-2">
                ARBITRUM SEPOLIA TESTNET
              </p>
            </div>
          </div>

          {/* BOTTOM DIVIDER */}
          <div className="border-t-2 border-brutal-green pt-4">
            <p className="text-xs font-bold text-brutal-green uppercase text-center">
              BUILT FOR <span className="text-brutal-white">Bounty Hunter</span> • x402 POWERED
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
