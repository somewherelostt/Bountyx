import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Supabase configuration - lazy initialization
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

// Public client (for client-side operations)
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Validate URL format
    try {
      const url = new URL(supabaseUrl);
      if (!url.hostname.includes("supabase.co")) {
        console.warn(
          `Warning: Supabase URL hostname "${url.hostname}" doesn't look like a valid Supabase URL`
        );
      }
    } catch {
      throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`);
    }

    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      fetch: (url, options = {}) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        return fetch(url, {
          ...options,
          signal: controller.signal,
        })
          .catch((error) => {
            clearTimeout(timeoutId);
            if (error.name === "AbortError" || error.name === "TimeoutError") {
              throw new Error(`Supabase request timeout: ${url}`);
            }
            if (
              error.code === "ENOTFOUND" ||
              error.message?.includes("getaddrinfo")
            ) {
              throw new Error(
                `DNS resolution failed for Supabase URL: ${url}. Check your network connection and verify the Supabase project URL is correct.`
              );
            }
            throw error;
          })
          .finally(() => {
            clearTimeout(timeoutId);
          });
      },
    });
  }
  return _supabase;
}

// Admin client (for server-side operations with service role)
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase admin environment variables");
    }

    // Validate URL format
    try {
      const url = new URL(supabaseUrl);
      if (!url.hostname.includes("supabase.co")) {
        console.warn(
          `Warning: Supabase URL hostname "${url.hostname}" doesn't look like a valid Supabase URL`
        );
      }
    } catch {
      throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`);
    }

    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      fetch: (url, options = {}) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        return fetch(url, {
          ...options,
          signal: controller.signal,
        })
          .catch((error) => {
            clearTimeout(timeoutId);
            if (error.name === "AbortError" || error.name === "TimeoutError") {
              throw new Error(`Supabase request timeout: ${url}`);
            }
            if (
              error.code === "ENOTFOUND" ||
              error.message?.includes("getaddrinfo")
            ) {
              throw new Error(
                `DNS resolution failed for Supabase URL: ${url}. Check your network connection and verify the Supabase project URL is correct.`
              );
            }
            throw error;
          })
          .finally(() => {
            clearTimeout(timeoutId);
          });
      },
    });
  }
  return _supabaseAdmin;
}

// Legacy exports for compatibility
export const supabase = {
  get client() {
    return getSupabase();
  },
  from: (table: string) => getSupabase().from(table),
};

export const supabaseAdmin = {
  get client() {
    return getSupabaseAdmin();
  },
  from: (table: string) => getSupabaseAdmin().from(table),
};

// Types for database tables
export type BountyStatus = "OPEN" | "PAID";

export interface Bounty {
  id: string;
  title: string;
  description: string;
  prize: string; // ETH amount as string
  creator_address: string;
  status: BountyStatus;
  winner_address: string | null;
  created_at: string;
  tx_hash?: string; // Creation payment TX
  prizes: PrizeTier[]; // Array of prize tiers
  winners: Winner[]; // Array of selected winners
}

export interface PrizeTier {
  rank: number; // 1, 2, 3...
  amount: string; // Amount in USDC/ETH
}

export interface Winner {
  rank: number;
  submission_id: string;
  hunter_address: string;
  amount: string;
}

export interface Submission {
  id: string;
  bounty_id: string;
  hunter_address: string;
  content: string;
  contact: string;
  created_at: string;
  ai_score?: number;
  ai_notes?: string;
  is_public?: boolean;
  prize_won?: number;
  rank?: number;
  content_hash?: string;
  block_number?: number;
}

// Profile Interface
export interface Profile {
  wallet_address: string;
  username?: string;
  bio?: string;
  twitter?: string;
  discord?: string;
  created_at: string;
}

// Database operations
export const db = {
  // PROFILES
  profiles: {
    async get(address: string): Promise<Profile | null> {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("wallet_address", address.toLowerCase())
        .maybeSingle();

      if (error) return null;
      return data;
    },

    async upsert(profile: Partial<Profile>) {
      return await supabase.from("profiles").upsert(profile);
    },
  },

  // BOUNTIES
  bounties: {
    async getAll(): Promise<Bounty[]> {
      const { data, error } = await supabase
        .from("bounties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },

    async getById(id: string): Promise<Bounty | null> {
      const { data, error } = await supabase
        .from("bounties")
        .select("*")
        .eq("id", id)
        .single();

      if (error) return null;
      return data;
    },

    async getByCreator(address: string): Promise<Bounty[]> {
      const { data, error } = await supabase
        .from("bounties")
        .select("*")
        .eq("creator_address", address.toLowerCase())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },

    async getOpen(): Promise<Bounty[]> {
      const { data, error } = await supabase
        .from("bounties")
        .select("*")
        .eq("status", "OPEN")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  },

  // SUBMISSIONS
  submissions: {
    async getByBounty(bountyId: string): Promise<Submission[]> {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("bounty_id", bountyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },

    async getByHunter(address: string): Promise<Submission[]> {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("hunter_address", address.toLowerCase())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  },
};
