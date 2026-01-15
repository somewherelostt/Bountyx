"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Navbar } from "@/components/Navbar";
import { BrutalCard } from "@/components/BrutalCard";
import { BrutalButton } from "@/components/BrutalButton";
import { WalletGate } from "@/components/WalletGate";
import { SocialShare } from "@/components/SocialShare";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bounty, Submission } from "@/lib/supabase";

import { useBrutalNotification } from "@/components/ui/BrutalNotification";
import { UserDisplay } from "@/components/UserDisplay";

// Helper to determine if we can show submissions
function canViewSubmissions(
  bounty: Bounty,
  userAddress: string | undefined,
  submission: Submission
): boolean {
  // Creator can always view
  if (bounty.creator_address.toLowerCase() === userAddress?.toLowerCase())
    return true;
  // Hunter can view their own
  if (submission.hunter_address.toLowerCase() === userAddress?.toLowerCase())
    return true;
  // Public submissions (winners/resolved bounties)
  if (submission.is_public || bounty.status === "PAID") return true;

  return false;
}

export default function BountyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { login, logout, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { notify } = useBrutalNotification();

  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectingWinner, setSelectingWinner] = useState(false);

  // Submission form
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [content, setContent] = useState("");
  const [contact, setContact] = useState("");

  const address = wallets[0]?.address;
  const bountyId = params.id as string;
  const isCreator =
    bounty?.creator_address.toLowerCase() === address?.toLowerCase();

  useEffect(() => {
    async function loadBounty() {
      try {
        // Use API routes to avoid CORS issues
        const [bountyRes, submissionsRes] = await Promise.all([
          fetch(`/api/bounties/${bountyId}`),
          fetch(`/api/submissions?bounty_id=${bountyId}`),
        ]);
        
        const [bountyData, submissionsData] = await Promise.all([
          bountyRes.ok ? bountyRes.json() : null,
          submissionsRes.ok ? submissionsRes.json() : [],
        ]);
        
        setBounty(bountyData);
        setSubmissions(submissionsData);
      } catch (error) {
        console.error("Failed to load bounty:", error);
      } finally {
        setLoading(false);
      }
    }

    if (bountyId) {
      loadBounty();
    }
  }, [bountyId]); // Removed bounty from dependencies to avoid infinite loop

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !content || !contact) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bounty_id: bountyId,
          hunter_address: address,
          content,
          contact,
        }),
      });

      if (response.ok) {
        const newSubmission = await response.json();
        setSubmissions([newSubmission, ...submissions]);
        setShowSubmitForm(false);
        setContent("");
        setContact("");
        notify.success("Submission sent! It remains private until the bounty is resolved.");
      } else {
        const error = await response.json();
        notify.error(error.message || "Failed to submit");
      }
    } catch (error) {
      console.error("Submission failed:", error);
      notify.error("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectWinner = async (
    submissionId: string,
    winnerAddress: string,
    rank: number
  ) => {
    if (!address || !isCreator) return;

    if (!confirm(`Are you sure you want to award Rank #${rank} to this hunter? This pays out real funds.`)) return;

    setSelectingWinner(true);
    try {
      const response = await fetch("/api/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bounty_id: bountyId,
          submission_id: submissionId,
          winner_address: winnerAddress,
          creator_address: address,
          rank: rank,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        notify.success(`Payout executed! TX: ${result.txHash}`);
        // Refresh page data to update UI
        window.location.reload();
      } else {
        const error = await response.json();
        notify.error(error.message || "Payout failed");
      }
    } catch (error) {
      console.error("Payout failed:", error);
      notify.error("Payout failed. Please try again.");
    } finally {
      setSelectingWinner(false);
    }
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get viewable submissions
  const viewableSubmissions = submissions.filter((s) =>
    bounty ? canViewSubmissions(bounty, address, s) : false
  );
  
  // Calculate available prizes
  const getAvailablePrizes = () => {
      if (!bounty) return [];
      if (!bounty.prizes || bounty.prizes.length === 0) {
          // Legacy check
          if (bounty.status === 'OPEN') return [{rank: 1, amount: bounty.prize}];
          return [];
      }
      return bounty.prizes.filter(p => 
          !bounty.winners?.some(w => w.rank === p.rank)
      ).sort((a,b) => a.rank - b.rank);
  };

  const availablePrizes = getAvailablePrizes();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-black uppercase animate-pulse">LOADING...</p>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="min-h-screen p-8 text-center">
        <h1 className="text-2xl font-black">BOUNTY NOT FOUND</h1>
        <BrutalButton onClick={() => router.push("/bounties")}>BACK</BrutalButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar
        address={address}
        isConnected={authenticated}
        onConnect={login}
        onDisconnect={logout}
      />

      <main className="brutal-container py-8">
        <button
          onClick={() => router.push("/bounties")}
          className="font-black uppercase text-sm mb-6 hover:text-brutal-green transition-colors"
        >
          ← BACK TO BOUNTIES
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-6">
            {/* BOUNTY HEADER */}
            <BrutalCard variant="default" padding="lg">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`px-3 py-1 text-sm font-black ${
                    bounty.status === "OPEN"
                      ? "bg-brutal-green"
                      : "bg-brutal-pink"
                  }`}
                >
                  {bounty.status === "OPEN" ? "ACTIVE" : "CLOSED"}
                </span>
                {isCreator && (
                  <span className="px-3 py-1 text-sm font-black bg-brutal-yellow">
                    YOUR BOUNTY
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl font-black uppercase mb-4 break-words">
                {bounty.title}
              </h1>
              <p className="font-bold text-lg whitespace-pre-wrap text-gray-800">
                {bounty.description}
              </p>
            </BrutalCard>

            {/* PRIZE BREAKDOWN */}
            <div className="space-y-4">
               <h2 className="text-2xl font-black bg-black text-white inline-block px-2">PRIZE POOL</h2>
               <div className="grid gap-4">
                   {bounty.prizes && bounty.prizes.length > 0 ? (
                       bounty.prizes.map((p) => {
                           const winner = bounty.winners?.find(w => w.rank === p.rank);
                           return (
                               <BrutalCard key={p.rank} variant={winner ? "green" : "default"} padding="md">
                                   <div className="flex justify-between items-center">
                                       <div className="flex items-center gap-4">
                                           <div className="bg-black text-white text-xl font-black w-10 h-10 flex items-center justify-center rounded-none">
                                               #{p.rank}
                                           </div>
                                           <div>
                                               <p className="font-black text-2xl">${p.amount} USDC</p>
                                               {winner && <div className="text-xs font-bold uppercase flex items-center gap-1">WON BY <UserDisplay address={winner.hunter_address} showLink={true} className="hover:text-brutal-green" /></div>}
                                           </div>
                                       </div>
                                       {winner ? (
                                           <span className="text-2xl">🏆</span>
                                       ) : (
                                           <span className="font-black text-gray-400 uppercase">OPEN</span>
                                       )}
                                   </div>
                               </BrutalCard>
                           );
                       })
                   ) : (
                       // Legacy single prize
                       <BrutalCard variant={bounty.status === "PAID" ? "green" : "default"} padding="md">
                           <div className="flex justify-between items-center">
                               <div>
                                    <p className="font-black text-2xl uppercase">MAIN PRIZE</p>
                                    <p className="text-xl font-bold">{bounty.prize} USDC</p>
                               </div>
                               {bounty.status === "PAID" && <span className="text-2xl">🏆</span>}
                           </div>
                       </BrutalCard>
                   )}
               </div>
            </div>

            {/* SUBMISSIONS */}
            <div>
              <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-black flex items-center gap-2">
                    <span className="bg-brutal-pink px-2">SUBMISSIONS</span>
                    <span className="text-brutal-green">{submissions.length}</span>
                  </h2>
                  <div className="text-xs font-bold uppercase text-gray-500">
                      {isCreator ? "YOU CAN SEE ALL" : bounty.status === "PAID" ? "PUBLIC ARCHIVE" : "PRIVATE UNTIL RESOLVED"}
                  </div>
              </div>

              {submissions.length === 0 ? (
                <BrutalCard variant="default" padding="lg" className="text-center">
                  <p className="text-4xl mb-4">🎯</p>
                  <p className="font-bold uppercase text-gray-600">
                    NO SUBMISSIONS YET.
                  </p>
                </BrutalCard>
              ) : viewableSubmissions.length === 0 ? (
                   <BrutalCard variant="default" padding="lg" className="text-center">
                      <p className="text-4xl mb-4">🔒</p>
                      <p className="font-bold uppercase text-gray-600">
                        SUBMISSIONS ARE HIDDEN UNTIL BOUNTY IS RESOLVED
                      </p>
                      <p className="text-xs font-bold mt-2 text-gray-400">
                          (ONLY CREATOR & YOUR OWN ARE VISIBLE)
                      </p>
                    </BrutalCard>
              ) : (
                <div className="space-y-4">
                  {viewableSubmissions.map((submission) => {
                      const isWinner = bounty.winners?.some(w => w.submission_id === submission.id) || 
                                       (bounty.winner_address?.toLowerCase() === submission.hunter_address.toLowerCase());
                      const winDetails = bounty.winners?.find(w => w.submission_id === submission.id);

                      return (
                        <BrutalCard
                          key={submission.id}
                          variant={isWinner ? "green" : "default"}
                          padding="md"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm bg-black text-white px-2 py-1">
                                    <UserDisplay address={submission.hunter_address} showLink={true} className="text-white hover:text-brutal-green" />
                                </span>
                                {submission.hunter_address.toLowerCase() === address?.toLowerCase() && (
                                    <span className="text-xs font-black bg-brutal-yellow px-1">YOU</span>
                                )}
                            </div>
                            <span className="text-xs font-bold text-gray-500">
                              {formatDate(submission.created_at)}
                            </span>
                          </div>

                          <div className="bg-gray-100 p-3 border-2 border-black mb-3 font-mono text-sm whitespace-pre-wrap">
                             {submission.content}
                          </div>
                          
                          <p className="text-xs font-bold text-gray-600 uppercase">
                            CONTACT: {submission.contact}
                          </p>

                          {/* WINNER BADGE */}
                          {isWinner && (
                              <div className="mt-4 pt-4 border-t-4 border-black">
                                  <div className="bg-brutal-green inline-block px-3 py-1 font-black uppercase text-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                      🏆 WINNER {winDetails ? `#${winDetails.rank} ($${winDetails.amount})` : ""}
                                  </div>
                              </div>
                          )}

                          {/* CREATOR ACTIONS */}
                          {isCreator && availablePrizes.length > 0 && !isWinner && (
                            <div className="mt-4 pt-4 border-t-4 border-gray-200">
                              <p className="text-xs font-black uppercase mb-2">AWARD PRIZE:</p>
                              <div className="flex flex-wrap gap-2">
                                  {availablePrizes.map(p => (
                                      <BrutalButton 
                                        key={p.rank}
                                        size="sm"
                                        variant="success"
                                        disabled={selectingWinner}
                                        onClick={() => handleSelectWinner(submission.id, submission.hunter_address, p.rank)}
                                      >
                                          #{p.rank} (${p.amount})
                                      </BrutalButton>
                                  ))}
                              </div>
                            </div>
                          )}
                        </BrutalCard>
                      );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            <BrutalCard variant="default" padding="md">
               <h3 className="font-black uppercase mb-2">ABOUT CREATOR</h3>
               <div className="font-mono underline text-sm">
                   <UserDisplay address={bounty.creator_address} showLink={true} />
               </div>
            </BrutalCard>

            {/* SUBMIT BUTTON */}
            {bounty.status === "OPEN" && !isCreator && (
              <WalletGate
                isConnected={authenticated}
                onConnect={login}
                title="CONNECT TO SUBMIT"
                description="YOU NEED A WALLET TO HUNT"
              >
                {showSubmitForm ? (
                  <BrutalCard variant="green" padding="lg">
                    <h3 className="text-xl font-black uppercase mb-4">
                      SUBMIT YOUR WORK
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block font-black uppercase text-sm mb-2">
                          WORK / LINK
                        </label>
                        <textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Describe your work..."
                          rows={4}
                          required
                          className="w-full p-2 border-4 border-black focus:ring-4 focus:ring-brutal-green focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-black uppercase text-sm mb-2">
                          CONTACT INFO
                        </label>
                        <input
                          type="text"
                          value={contact}
                          onChange={(e) => setContact(e.target.value)}
                          placeholder="Telegram / Discord / Email"
                          required
                          className="w-full p-2 border-4 border-black focus:ring-4 focus:ring-brutal-green focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <BrutalButton
                          type="submit"
                          variant="primary"
                          fullWidth
                          disabled={submitting}
                        >
                          SUBMIT
                        </BrutalButton>
                        <BrutalButton
                          type="button"
                          variant="secondary"
                          onClick={() => setShowSubmitForm(false)}
                        >
                          CANCEL
                        </BrutalButton>
                      </div>
                    </form>
                  </BrutalCard>
                ) : (
                  <BrutalButton
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => setShowSubmitForm(true)}
                  >
                    SUBMIT WORK
                  </BrutalButton>
                )}
              </WalletGate>
            )}
            
            {bounty.status === "PAID" && (
                <div className="bg-brutal-green p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
                    <p className="font-black uppercase text-xl">BOUNTY RESOLVED</p>
                    <p className="text-sm font-bold">ALL PRIZES AWARDED</p>
                </div>
            )}
            
            <SocialShare
                 bountyTitle={bounty.title}
                 bountyId={bounty.id}
                 status={bounty.status === 'PAID' ? 'PAID' : 'SUBMITTED'}
            />
            
            {/* CLAWBACK / CANCEL ACTION */}
            {isCreator && bounty.status === "OPEN" && (
                <div className="mt-8 border-t-4 border-gray-200 pt-8 text-center">
                    <p className="text-xs font-bold uppercase text-gray-500 mb-2">DANGER ZONE</p>
                    <BrutalButton 
                        variant="danger" 
                        size="sm" 
                        onClick={async () => {
                            if(!confirm("Are you sure? This will cancel the bounty. If it has been over 30 days, you can request a refund.")) return;
                            try {
                                const res = await fetch("/api/bounties/cancel", {
                                    method: "POST",
                                    headers: {"Content-Type": "application/json"},
                                    body: JSON.stringify({ bounty_id: bounty.id, creator_address: address })
                                });
                                const data = await res.json();
                                if(res.ok) {
                                    notify.success(data.message);
                                    window.location.reload();
                                } else {
                                    notify.error(data.message);
                                }
                            } catch(e) {
                                console.error(e);
                                notify.error("Failed to cancel");
                            }
                        }}
                    >
                        CANCEL & REFUND
                    </BrutalButton>
                    <p className="text-[10px] font-mono text-gray-400 mt-2 max-w-xs mx-auto">
                        Requires bounty to be {">"} 30 days old OR have 0 submissions after 1 hour.
                    </p>
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
