-- TattoFlow - Migration: add grupo to kits and color to nodos
-- Run in Supabase SQL Editor

ALTER TABLE kits ADD COLUMN IF NOT EXISTS grupo text DEFAULT 'General';
ALTER TABLE nodos ADD COLUMN IF NOT EXISTS color text;
