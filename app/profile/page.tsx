"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Navbar } from "@/components/Navbar";
import { BrutalCard } from "@/components/BrutalCard";
import { BrutalButton } from "@/components/BrutalButton";
import { WalletGate } from "@/components/WalletGate";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bounty, Submission, Profile } from "@/lib/supabase";
import { useBrutalNotification } from "@/components/ui/BrutalNotification";

export default function ProfilePage() {
  const { login, logout, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { notify } = useBrutalNotification();
  
  const [myBounties, setMyBounties] = useState<Bounty[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  // const [saving, setSaving] = useState(false); // Removing unused state
  const [editForm, setEditForm] = useState({
    username: "",
    bio: "",
    twitter: "",
    discord: ""
  });

  const address = wallets[0]?.address;

  useEffect(() => {
    async function loadData() {
      if (!address) return;

      try {
        // Use API routes to avoid CORS issues
        const [bountiesRes, submissionsRes, profileRes] = await Promise.all([
          fetch(`/api/bounties?creator=${address}`),
          fetch(`/api/submissions?hunter=${address}`),
          fetch(`/api/profiles/${address}`)
        ]);
        
        const [bounties, submissions, profileData] = await Promise.all([
          bountiesRes.ok ? bountiesRes.json() : [],
          submissionsRes.ok ? submissionsRes.json() : [],
          profileRes.ok ? profileRes.json() : null
        ]);
        
        setMyBounties(bounties);
        setMySubmissions(submissions);
        setProfile(profileData);
        
        if (profileData) {
            setEditForm({
                username: profileData.username || "",
                bio: profileData.bio || "",
                twitter: profileData.twitter || "",
                discord: profileData.discord || ""
            });
        }
      } catch (error) {
        console.error("Failed to load profile data:", error);
        notify.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    }

    if (authenticated && address) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [authenticated, address, notify]);

  const handleSaveProfile = async () => {
      if (!address) return;
      
      try {
          // Use API route to bypass RLS policies since we aren't using Supabase Auth
          const response = await fetch("/api/profile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  wallet_address: address,
                  ...editForm
              })
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || "Failed to update");
          }
          
          setIsEditing(false);
          // Optimistic update or reload? We can just use the form data
          setProfile({ ...profile, ...editForm, wallet_address: address, created_at: profile?.created_at || new Date().toISOString() });
          notify.success("Identity updated successfully!");
      } catch (err) {
          console.error(err);
          notify.error("Failed to update profile");
      }
  };

  // Reputation Calculations
  const totalEarnings = mySubmissions.reduce((acc, sub) => acc + (sub.prize_won || 0), 0);
  const totalWins = mySubmissions.filter(s => (s.prize_won || 0) > 0).length;
  const winRate = mySubmissions.length > 0 ? Math.round((totalWins / mySubmissions.length) * 100) : 0;
  
  // Reputation V2: Weighted Score = Total Earnings * (Win Rate %)
  // This penalizes spamming (low win rate) even if you get lucky once.
  const reputationScore = Math.floor(totalEarnings * (winRate / 100));

  return (
    <div className="min-h-screen">
      <Navbar
        address={address}
        isConnected={authenticated}
        onConnect={login}
        onDisconnect={logout}
      />

      <main className="brutal-container py-8">
        <WalletGate
          isConnected={authenticated}
          onConnect={login}
          title="ACCESS DENIED"
          description="CONNECT WALLET TO VIEW YOUR PROFILE"
        >
          {loading ? (
            <div className="text-center py-12">
              <p className="text-xl font-black uppercase animate-pulse">LOADING PROFILE DATA...</p>
            </div>
          ) : (
             <div className="space-y-8">
                 
                 {/* IDENTITY SECTION */}
                 <section className="grid md:grid-cols-3 gap-8">
                     {/* ID CARD */}
                     <div className="md:col-span-2">
                         <BrutalCard variant="default" padding="lg" className="h-full relative overflow-hidden">
                             <div className="flex justify-between items-start mb-6 relative z-10 transition-all">
                                 <div>
                                     <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-1">IDENTITY</h2>
                                     <div className="flex items-center gap-2 text-3xl md:text-5xl font-black uppercase break-all leading-tight">
                                         {profile?.username || "ANONYMOUS"}
                                         {reputationScore > 500 && (
                                             <span className="text-xl md:text-3xl text-brutal-blue" title="Verified Protocol User">✓</span>
                                         )}
                                     </div>
                                     <div className="font-mono text-sm mt-2 opacity-70">
                                         {address}
                                     </div>
                                 </div>
                                 {!isEditing && (
                                     <BrutalButton size="sm" onClick={() => setIsEditing(true)}>EDIT IDENTITY</BrutalButton>
                                 )}
                             </div>

                             {isEditing ? (
                                 <div className="space-y-4 bg-gray-100 p-4 border-2 border-black relative z-10">
                                     <div>
                                         <label className="text-xs font-bold uppercase block mb-1">Username</label>
                                         <input 
                                            className="w-full bg-white border-2 border-black p-2 font-mono"
                                            value={editForm.username}
                                            onChange={e => setEditForm({...editForm, username: e.target.value})}
                                            placeholder="Enter username"
                                         />
                                     </div>
                                     <div>
                                         <label className="text-xs font-bold uppercase block mb-1">Bio</label>
                                         <textarea 
                                            className="w-full bg-white border-2 border-black p-2 font-mono h-24"
                                            value={editForm.bio}
                                            onChange={e => setEditForm({...editForm, bio: e.target.value})}
                                            placeholder="Tell us about yourself..."
                                         />
                                     </div>
                                     <div className="grid grid-cols-2 gap-4">
                                          <div>
                                             <label className="text-xs font-bold uppercase block mb-1">Twitter (Handle)</label>
                                             <input 
                                                className="w-full bg-white border-2 border-black p-2 font-mono"
                                                value={editForm.twitter}
                                                onChange={e => setEditForm({...editForm, twitter: e.target.value})}
                                                placeholder="@handle"
                                             />
                                         </div>
                                         <div>
                                             <label className="text-xs font-bold uppercase block mb-1">Discord (Username)</label>
                                             <input 
                                                className="w-full bg-white border-2 border-black p-2 font-mono"
                                                value={editForm.discord}
                                                onChange={e => setEditForm({...editForm, discord: e.target.value})}
                                                placeholder="username#0000"
                                             />
                                         </div>
                                     </div>
                                     <div className="flex gap-4 mt-4">
                                         <BrutalButton variant="primary" size="sm" onClick={handleSaveProfile}>SAVE CHANGES</BrutalButton>
                                         <BrutalButton variant="secondary" size="sm" onClick={() => setIsEditing(false)}>CANCEL</BrutalButton>
                                     </div>
                                 </div>
                             ) : (
                                 <div className="space-y-4 relative z-10">
                                     {profile?.bio && (
                                         <p className="font-mono text-sm border-l-4 border-brutal-green pl-4 py-2 bg-gray-50">
                                             &quot;{profile.bio}&quot;
                                         </p>
                                     )}
                                     <div className="flex gap-4">
                                         {profile?.twitter && (
                                             <a href={`https://twitter.com/${profile.twitter.replace('@', '')}`} target="_blank" rel="noreferrer" className="bg-black text-white px-3 py-1 font-bold text-xs hover:bg-brutal-green hover:text-black transition-colors">
                                                 TW: @{profile.twitter.replace('@', '')}
                                             </a>
                                         )}
                                          {profile?.discord && (
                                             <span className="bg-[#5865F2] text-white px-3 py-1 font-bold text-xs cursor-help" title="Discord Username">
                                                 DS: {profile.discord}
                                             </span>
                                         )}
                                     </div>
                                 </div>
                             )}
                         </BrutalCard>
                     </div>

                     {/* STATS GRID */}
                     <div className="space-y-4 md:col-span-1">
                         <BrutalCard variant="green" padding="md" className="text-center">
                             <p className="text-xs font-bold uppercase opacity-70 mb-1">TOTAL EARNINGS</p>
                             <p className="text-4xl font-black">${totalEarnings.toLocaleString()}</p>
                         </BrutalCard>
                         
                         <BrutalCard variant="default" padding="sm" className="text-center bg-brutal-pink/20 border-2 border-black">
                             <p className="text-[10px] font-bold uppercase opacity-70 mb-1">REPUTATION SCORE</p>
                             <p className="text-3xl font-black text-brutal-pink">{reputationScore}</p>
                             <p className="text-[10px] font-mono opacity-50">EARNINGS × WIN RATE</p>
                         </BrutalCard>

                         <div className="grid grid-cols-2 gap-4">
                             <BrutalCard variant="default" padding="sm" className="text-center">
                                 <p className="text-[10px] font-bold uppercase opacity-70 mb-1">WINS</p>
                                 <p className="text-2xl font-black">{totalWins}</p>
                             </BrutalCard>
                             <BrutalCard variant="default" padding="sm" className="text-center">
                                 <p className="text-[10px] font-bold uppercase opacity-70 mb-1">WIN RATE</p>
                                 <p className="text-2xl font-black">{winRate}%</p>
                             </BrutalCard>
                         </div>
                     </div>
                 </section>

                 <hr className="border-2 border-black border-dashed opacity-20" />

                 {/* HISTORY SECTION */}
                 <section className="grid md:grid-cols-2 gap-8">
                    {/* CREATED */}
                     <div>
                         <h3 className="bg-brutal-yellow inline-block px-2 text-xl font-black mb-4">
                             CREATED BOUNTIES ({myBounties.length})
                         </h3>
                         <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                             {myBounties.map(b => (
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
                             {myBounties.length === 0 && <p className="text-xs font-mono opacity-50">NO BOUNTIES CREATED YET.</p>}
                         </div>
                     </div>

                     {/* HUNTED */}
                     <div>
                         <h3 className="bg-brutal-pink inline-block px-2 text-xl font-black mb-4">
                             SUBMISSION HISTORY ({mySubmissions.length})
                         </h3>
                         <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                             {mySubmissions.map(s => (
                                 <Link key={s.id} href={`/bounties/${s.bounty_id}`}>
                                     <BrutalCard hover padding="sm" className={`group ${(s.prize_won || 0) > 0 ? "border-brutal-green" : ""}`}>
                                         <div className="flex justify-between items-center mb-1">
                                             <span className="text-[10px] font-bold opacity-50">#{s.bounty_id.slice(0,8)}</span>
                                             {(s.prize_won || 0) > 0 && (
                                                 <span className="bg-brutal-green text-[10px] font-black px-2">WON ${s.prize_won} USDC</span>
                                             )}
                                         </div>
                                         <p className="font-mono text-sm truncate opacity-80 group-hover:opacity-100">
                                             {s.content}
                                         </p>
                                     </BrutalCard>
                                 </Link>
                             ))}
                              {mySubmissions.length === 0 && <p className="text-xs font-mono opacity-50">NO SUBMISSIONS YET.</p>}
                         </div>
                     </div>
                 </section>

             </div>
          )}
        </WalletGate>
      </main>
    </div>
  );
}
