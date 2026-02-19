import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
