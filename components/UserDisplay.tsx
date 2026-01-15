"use client";

import { useEffect, useState } from "react";
import { Profile } from "@/lib/supabase";
import Link from "next/link";

interface UserDisplayProps {
  address: string;
  className?: string;
  showLink?: boolean;
  prefix?: string;
}

export function UserDisplay({ 
  address, 
  className = "", 
  showLink = true,
  prefix = ""
}: UserDisplayProps) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchProfile() {
      if (!address) return;
      try {
        // Use API route instead of direct Supabase call to avoid CORS issues
        const response = await fetch(`/api/profiles/${address}`);
        if (response.ok) {
          const data = await response.json();
          if (mounted) {
            setProfile(data);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    }

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [address]);

  const displayName = profile?.username || `${address.slice(0, 6)}...${address.slice(-4)}`;
  
  const content = (
    <span className={`font-mono font-bold ${className}`}>
      {prefix}{displayName}
    </span>
  );

  if (showLink) {
    return (
      <Link
        href={`/profile/${address}`}
        className="hover:text-brutal-green transition-colors inline-flex items-center gap-1"
      >
        {content}
        {profile?.username && (
             <span className="text-[10px] opacity-50 bg-black text-white px-1 rounded-sm hidden sm:inline-block">
                 VERIFIED
             </span>
        )}
      </Link>
    );
  }

  return content;
}
