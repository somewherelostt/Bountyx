"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Navbar } from "@/components/Navbar";
import { BrutalButton } from "@/components/BrutalButton";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bounty, PrizeTier } from "@/lib/supabase";
import { motion } from "framer-motion";
import { formatUSDC } from "@/lib/format";

export default function BountiesPage() {
  const { login, logout, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "OPEN" | "PAID">("ALL");

  const address = wallets[0]?.address;

  useEffect(() => {
    async function loadBounties() {
      try {
        // Use API route to avoid CORS issues
        const response = await fetch("/api/bounties");
        if (response.ok) {
          const data = await response.json();
          setBounties(data);
        }
      } catch (error) {
        console.error("Failed to load bounties:", error);
      } finally {
        setLoading(false);
      }
    }

    loadBounties();
  }, []);

  const filteredBounties = bounties.filter((b) => {
    if (filter === "ALL") return true;
    return b.status === filter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen">
      <Navbar
        address={address}
        isConnected={authenticated}
        onConnect={login}
        onDisconnect={logout}
      />

      <main className="px-4 py-6 md:px-8 md:py-12 lg:px-12 max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black">
              BOUNTIES <span className="text-brutal-green">({filteredBounties.length})</span>
            </h1>
          </div>
          <Link href="/create" className="w-full md:w-auto">
            <BrutalButton variant="primary" size="md" fullWidth>
              + POST BOUNTY
            </BrutalButton>
          </Link>
        </div>

        {/* FILTERS - SIMPLIFIED TEXT LINKS */}
        <div className="flex gap-4 md:gap-6 mb-6 md:mb-8 text-xs md:text-sm font-black uppercase">
          {(["ALL", "OPEN", "PAID"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`
                transition-all duration-100 relative pb-1
                ${
                  filter === status
                    ? "text-brutal-black border-b-4 border-brutal-green"
                    : "text-gray-400 hover:text-brutal-black"
                }
              `}
            >
              {status}
            </button>
          ))}
        </div>

        {/* BOUNTIES LIST */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-xl font-black uppercase animate-pulse">
              LOADING BOUNTIES...
            </p>
          </div>
        ) : filteredBounties.length === 0 ? (
          <div className="border-4 border-brutal-black bg-brutal-white p-8 md:p-12 text-center" style={{ boxShadow: "6px 6px 0px 0px #000000" }}>
            <div className="py-4 md:py-8">
              <p className="text-6xl md:text-7xl mb-4 font-black text-brutal-green">
                {filter === "PAID" ? "🔒" : "$$$"}
              </p>
              <h2 className="text-2xl md:text-3xl font-black uppercase mb-3 break-words">
                {filter === "PAID" ? "THE BAG IS SECURE." : "NO BOUNTIES FOUND"}
              </h2>
              <p className="font-bold text-gray-600 uppercase mb-6 text-sm md:text-base break-words">
                {filter === "PAID" 
                  ? "No paid bounties right now. The alpha is in the 'OPEN' tab."
                  : "BE THE FIRST TO POST A BOUNTY"}
              </p>
              <Link href={filter === "PAID" ? "/bounties" : "/create"} className="w-full md:w-auto inline-block">
                <BrutalButton variant="primary" size="lg" fullWidth>
                  {filter === "PAID" ? "HUNT BOUNTIES" : "CREATE FIRST BOUNTY"}
                </BrutalButton>
              </Link>
            </div>
          </div>
        ) : (
          <motion.div
            className="grid gap-4 md:gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.1,
                },
              },
            }}
          >
            {filteredBounties.map((bounty) => (
              <motion.div
                key={bounty.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.3, ease: "easeOut" },
                  },
                }}
              >
                <Link href={`/bounties/${bounty.id}`}>
                  <div className="border-4 border-brutal-black p-4 md:p-6 hover:bg-gray-50 transition-colors" style={{ boxShadow: "3px 3px 0px 0px #000000" }}>
                    <div className="flex flex-col md:flex-row justify-between gap-4 md:gap-6">
                      {/* LEFT SIDE */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-3 mb-3 flex-wrap">
                          <span
                            className={`px-2 py-1 text-xs font-black border-2 border-brutal-black flex-shrink-0 ${
                              bounty.status === "OPEN"
                                ? "bg-brutal-green text-brutal-black"
                                : "bg-brutal-pink text-brutal-black"
                            }`}
                          >
                            {bounty.status}
                          </span>
                          <span className="text-xs font-bold text-gray-500 uppercase">
                            {formatDate(bounty.created_at)}
                          </span>
                        </div>
                        <h2 className="text-lg md:text-xl font-black uppercase mb-2 leading-tight line-clamp-2">
                          {bounty.title}
                        </h2>
                        <p className="font-semibold text-sm md:text-base text-gray-600 line-clamp-2">
                          {bounty.description}
                        </p>
                      </div>

                      {/* RIGHT SIDE - PRIZE */}
                      <div className="flex-shrink-0 md:mt-0">
                        <div className="bg-brutal-black text-brutal-white p-3 md:p-4 text-center border-3 border-brutal-black">
                          <p className="text-xs font-bold uppercase mb-1 tracking-wide">
                            PRIZE
                          </p>
                          <p className="text-2xl md:text-3xl font-black text-brutal-green max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                            {(() => {
                                let displayPrize = bounty.prize;
                                if ((!bounty.prize || bounty.prize === "MULTI") && bounty.prizes) {
                                    const total = bounty.prizes.reduce((acc: number, p: PrizeTier) => acc + (parseFloat(p.amount) || 0), 0);
                                    displayPrize = total.toString();
                                }
                                return formatUSDC(displayPrize); 
                            })().replace(" USDC", "")}
                          </p>
                          <p className="text-xs font-bold uppercase">USDC</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
