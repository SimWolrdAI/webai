-- ═══════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════

-- Bots table
CREATE TABLE IF NOT EXISTS bots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  system_prompt TEXT NOT NULL,
  template TEXT,
  avatar TEXT,
  wallet_address TEXT,
  is_public BOOLEAN DEFAULT true,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bots_slug ON bots (slug);
CREATE INDEX IF NOT EXISTS idx_bots_wallet ON bots (wallet_address);
CREATE INDEX IF NOT EXISTS idx_bots_created ON bots (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bots_public ON bots (is_public) WHERE is_public = true;

ALTER TABLE bots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read bots" ON bots
  FOR SELECT USING (true);

CREATE POLICY "Public insert bots" ON bots
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update bots" ON bots
  FOR UPDATE USING (true);

CREATE POLICY "Public delete bots" ON bots
  FOR DELETE USING (true);

