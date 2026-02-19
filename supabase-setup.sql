-- ══════════════════════════════════════════════
-- WebAI Supabase Setup
-- Run this in your Supabase SQL Editor
-- Fully idempotent — safe to run multiple times
-- ══════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- Table: user_bots
-- Tracks which bots each browser/user has created
-- ─────────────────────────────────────────────
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

-- Add columns that may be missing if table was created by an earlier version
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_bots' AND column_name = 'slug') THEN
    ALTER TABLE user_bots ADD COLUMN slug TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_bots' AND column_name = 'repo_name') THEN
    ALTER TABLE user_bots ADD COLUMN repo_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_bots' AND column_name = 'description') THEN
    ALTER TABLE user_bots ADD COLUMN description TEXT DEFAULT '';
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_bots_browser_id ON user_bots(browser_id);
CREATE INDEX IF NOT EXISTS idx_user_bots_url ON user_bots(url);

-- Enable Row Level Security
ALTER TABLE user_bots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (idempotent)
DROP POLICY IF EXISTS "Anyone can read user_bots" ON user_bots;
DROP POLICY IF EXISTS "Anyone can insert user_bots" ON user_bots;
DROP POLICY IF EXISTS "Users can delete own bots" ON user_bots;

-- Policy: anyone can read all bots (for all_bots page)
CREATE POLICY "Anyone can read user_bots"
  ON user_bots FOR SELECT
  USING (true);

-- Policy: anyone can insert (browser_id is self-managed)
CREATE POLICY "Anyone can insert user_bots"
  ON user_bots FOR INSERT
  WITH CHECK (true);

-- Policy: can delete any bot (browser_id checked in app code)
CREATE POLICY "Users can delete own bots"
  ON user_bots FOR DELETE
  USING (true);

-- ─────────────────────────────────────────────
-- Table: bots (for published WebAI bots)
-- ─────────────────────────────────────────────
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

-- Add columns that may be missing if table was created by an earlier version
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bots' AND column_name = 'slug') THEN
    ALTER TABLE bots ADD COLUMN slug TEXT UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bots' AND column_name = 'browser_id') THEN
    ALTER TABLE bots ADD COLUMN browser_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bots' AND column_name = 'system_prompt') THEN
    ALTER TABLE bots ADD COLUMN system_prompt TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bots' AND column_name = 'template') THEN
    ALTER TABLE bots ADD COLUMN template TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bots' AND column_name = 'avatar') THEN
    ALTER TABLE bots ADD COLUMN avatar TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bots' AND column_name = 'wallet_address') THEN
    ALTER TABLE bots ADD COLUMN wallet_address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bots' AND column_name = 'is_public') THEN
    ALTER TABLE bots ADD COLUMN is_public BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bots' AND column_name = 'message_count') THEN
    ALTER TABLE bots ADD COLUMN message_count INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bots' AND column_name = 'updated_at') THEN
    ALTER TABLE bots ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bots_browser_id ON bots(browser_id);
CREATE INDEX IF NOT EXISTS idx_bots_slug ON bots(slug);

-- Enable Row Level Security
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (idempotent)
DROP POLICY IF EXISTS "Anyone can read public bots" ON bots;
DROP POLICY IF EXISTS "Anyone can insert bots" ON bots;
DROP POLICY IF EXISTS "Anyone can update bots" ON bots;
DROP POLICY IF EXISTS "Anyone can delete bots" ON bots;

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
