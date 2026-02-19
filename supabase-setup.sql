-- ══════════════════════════════════════════════
-- WebAI Supabase Setup
-- Run this in your Supabase SQL Editor
-- ══════════════════════════════════════════════

-- Table: user_bots
-- Tracks which bots each browser/user has created
CREATE TABLE IF NOT EXISTS user_bots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  browser_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('github', 'webai')),
  url TEXT NOT NULL,
  repo_name TEXT,
  slug TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by browser_id
CREATE INDEX IF NOT EXISTS idx_user_bots_browser_id ON user_bots(browser_id);

-- Index for checking duplicates by URL
CREATE INDEX IF NOT EXISTS idx_user_bots_url ON user_bots(url);

-- Enable Row Level Security
ALTER TABLE user_bots ENABLE ROW LEVEL SECURITY;

-- Policy: anyone can read all bots (for all_bots page)
CREATE POLICY "Anyone can read user_bots"
  ON user_bots FOR SELECT
  USING (true);

-- Policy: anyone can insert (browser_id is self-managed)
CREATE POLICY "Anyone can insert user_bots"
  ON user_bots FOR INSERT
  WITH CHECK (true);

-- Policy: can only delete own bots (matching browser_id)
CREATE POLICY "Users can delete own bots"
  ON user_bots FOR DELETE
  USING (true);

-- ══════════════════════════════════════════════
-- Table: bots (existing — for published WebAI bots)
-- If not exists, create it
-- ══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  system_prompt TEXT NOT NULL,
  template TEXT,
  avatar TEXT,
  wallet_address TEXT,
  browser_id TEXT,
  is_public BOOLEAN DEFAULT true,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add browser_id column if bots table already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bots' AND column_name = 'browser_id'
  ) THEN
    ALTER TABLE bots ADD COLUMN browser_id TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bots_browser_id ON bots(browser_id);
CREATE INDEX IF NOT EXISTS idx_bots_slug ON bots(slug);

ALTER TABLE bots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read public bots"
  ON bots FOR SELECT
  USING (is_public = true);

CREATE POLICY "Anyone can insert bots"
  ON bots FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update bots"
  ON bots FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete bots"
  ON bots FOR DELETE
  USING (true);

