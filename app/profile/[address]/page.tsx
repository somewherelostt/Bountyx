"use client";

import { Navbar } from "@/components/Navbar";
import { BrutalCard } from "@/components/BrutalCard";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bounty, Submission, Profile } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { useWallets } from "@privy-io/react-auth";
import { usePrivy } from "@privy-io/react-auth";

export default function PublicProfilePage() {
  const params = useParams();
  const targetAddress = params.address as string;
  
  const { login, logout, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const currentAddress = wallets[0]?.address;

  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!targetAddress) return;

      try {
        // Use API routes to avoid CORS issues
        const [bountiesRes, submissionsRes, profileRes] = await Promise.all([
          fetch(`/api/bounties?creator=${targetAddress}`),
          fetch(`/api/submissions?hunter=${targetAddress}`),
          fetch(`/api/profiles/${targetAddress}`)
        ]);
        
        const [bountiesData, submissionsData, profileData] = await Promise.all([
          bountiesRes.ok ? bountiesRes.json() : [],
          submissionsRes.ok ? submissionsRes.json() : [],
          profileRes.ok ? profileRes.json() : null
        ]);
        
        setBounties(bountiesData);
        setSubmissions(submissionsData);
        setProfile(profileData);
      } catch (error) {
        console.error("Failed to load profile data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [targetAddress]);

  // Reputation Calculations
  const totalEarnings = submissions.reduce((acc, sub) => acc + (sub.prize_won || 0), 0);
  const totalWins = submissions.filter(sub => (sub.prize_won || 0) > 0).length;
  const winRate = submissions.length > 0 ? Math.round((totalWins / submissions.length) * 100) : 0;

  const isOwnProfile = currentAddress?.toLowerCase() === targetAddress?.toLowerCase();

  return (
    <div className="min-h-screen">
      <Navbar
        address={currentAddress}
        isConnected={authenticated}
        onConnect={login}
        onDisconnect={logout}
      />

      <main className="brutal-container py-8">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-xl font-black uppercase animate-pulse">LOADING PROFILE...</p>
            </div>
          ) : (
             <div className="space-y-8">
                 
                 {/* IDENTITY SECTION */}
                 <section className="grid md:grid-cols-3 gap-8">
                     {/* ID CARD */}
                     <div className="md:col-span-2">
                         <BrutalCard variant="default" padding="lg" className="h-full">
                             <div className="flex justify-between items-start mb-6">
                                 <div>
                                     <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-1">PUBLIC PROFILE</h2>
                                     <div className="text-3xl md:text-5xl font-black uppercase break-all leading-tight">
                                         {profile?.username || "ANONYMOUS"}
                                     </div>
                                     <div className="font-mono text-sm mt-2 opacity-70">
                                         {targetAddress}
                                     </div>
                                 </div>
                                 {isOwnProfile && (
                                     <Link href="/profile">
                                         <span className="bg-black text-white px-3 py-1 font-bold text-xs hover:bg-brutal-green hover:text-black transition-colors">
                                             EDIT MY PROFILE
                                         </span>
                                     </Link>
                                 )}
                             </div>

                             <div className="space-y-4">
                                 {profile?.bio ? (
                                     <p className="font-mono text-sm border-l-4 border-brutal-green pl-4 py-2 bg-gray-50">
                                         &quot;{profile.bio}&quot;
                                     </p>
                                 ) : (
                                     <p className="text-sm text-gray-400 font-mono italic">No bio data available.</p>
                                 )}
                                 <div className="flex gap-4">
                                     {profile?.twitter && (
                                         <span className="bg-black text-white px-2 py-1 font-bold text-xs">TW: @{profile.twitter.replace('@', '')}</span>
                                     )}
                                      {profile?.discord && (
                                         <span className="bg-[#5865F2] text-white px-2 py-1 font-bold text-xs">DS: {profile.discord}</span>
                                     )}
                                 </div>
                             </div>
                         </BrutalCard>
                     </div>

                     {/* STATS GRID */}
                     <div className="space-y-4">
                         <BrutalCard variant="default" padding="md" className="text-center border-brutal-green">
                             <p className="text-xs font-bold uppercase opacity-70 mb-1">TOTAL EARNINGS</p>
                             <p className="text-4xl font-black text-brutal-green">${totalEarnings.toLocaleString()}</p>
                         </BrutalCard>
                         <div className="grid grid-cols-2 gap-4">
                             <BrutalCard variant="default" padding="sm" className="text-center">
                                 <p className="text-[10px] font-bold uppercase opacity-70 mb-1">BOUNTIES WON</p>
                                 <p className="text-2xl font-black">{totalWins}</p>
                             </BrutalCard>
                             <BrutalCard variant="default" padding="sm" className="text-center">
                                 <p className="text-[10px] font-bold uppercase opacity-70 mb-1">WIN RATE</p>
                                 <p className="text-2xl font-black">{winRate}%</p>
                             </BrutalCard>
                         </div>
                         <BrutalCard variant="default" padding="sm" className="text-center">
                             <p className="text-[10px] font-bold uppercase opacity-70 mb-1">REPUTATION SCORE</p>
                             <p className="text-2xl font-black text-brutal-pink"> LEVEL {Math.floor(totalEarnings / 1000) + 1}</p>
                         </BrutalCard>
                     </div>
                 </section>

                 <hr className="border-2 border-black border-dashed opacity-20" />

                 {/* HISTORY SECTION */}
                 <section className="grid md:grid-cols-2 gap-8">
                    {/* CREATED */}
                     <div>
                         <h3 className="bg-gray-200 inline-block px-2 text-xl font-black mb-4">
                             CREATED BOUNTIES ({bounties.length})
                         </h3>
                         <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                             {bounties.map(b => (
                                 <Link key={b.id} href={`/bounties/${b.id}`}>
                                    <BrutalCard hover padding="sm" className="group">
                                        <div className="flex justify-between">
                                            <span className="font-bold truncate pr-4 group-hover:underline">{b.title}</span>
                                            <span className={`text-xs font-black px-2 py-0.5 h-fit ${b.status === 'PAID' ? 'bg-brutal-green' : 'bg-brutal-pink'}`}>
                                                {b.status}
                                            </span>
                                        </div>
                                    </BrutalCard>
                                 </Link>
                             ))}
                             {bounties.length === 0 && <p className="text-xs font-mono opacity-50">NO BOUNTIES CREATED.</p>}
                         </div>
                     </div>

                     {/* HUNTED */}
                     <div>
                         <h3 className="bg-gray-200 inline-block px-2 text-xl font-black mb-4">
                             SUBMISSION HISTORY ({submissions.length})
                         </h3>
                         <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                             {submissions.map(s => (
                                 <Link key={s.id} href={`/bounties/${s.bounty_id}`}>
                                     <BrutalCard hover padding="sm" className={`group ${(s.prize_won || 0) > 0 ? "border-brutal-green" : ""}`}>
                                         <div className="flex justify-between items-center mb-1">
                                             <span className="text-[10px] font-bold opacity-50">#{s.bounty_id.slice(0,8)}</span>
                                             {(s.prize_won || 0) > 0 && (
                                                 <span className="bg-brutal-green text-[10px] font-black px-2">WON ${s.prize_won}</span>
                                             )}
                                         </div>
                                         <p className="font-mono text-sm truncate opacity-80 group-hover:opacity-100">
                                            {/* Only show content if public or won */}
                                            {s.is_public || (s.prize_won || 0) > 0 ? s.content : "PRIVATE SUBMISSION"}
                                         </p>
                                     </BrutalCard>
                                 </Link>
                             ))}
                              {submissions.length === 0 && <p className="text-xs font-mono opacity-50">NO SUBMISSIONS.</p>}
                         </div>
                     </div>
                 </section>

             </div>
          )}
      </main>
    </div>
  );
}
