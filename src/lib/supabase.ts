import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Create client only if credentials are available (avoids build-time crash)
export const supabase: SupabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (new Proxy({} as SupabaseClient, {
      get: () => () => {
        throw new Error("Supabase not configured — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
      },
    }));

/* ── Types ── */

export interface BotRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  system_prompt: string;
  template: string | null;
  avatar: string | null;
  wallet_address: string | null;
  is_public: boolean;
  message_count: number;
  created_at: string;
  updated_at: string;
}
