-- TattoFlow — Migration: handle IDs for connections (bidirectional support)
-- Run in Supabase SQL Editor

ALTER TABLE conexiones ADD COLUMN IF NOT EXISTS source_handle text;
ALTER TABLE conexiones ADD COLUMN IF NOT EXISTS target_handle text;

-- Backfill existing rows with default handles (right-source → left-target)
UPDATE conexiones SET source_handle = 'rs' WHERE source_handle IS NULL;
UPDATE conexiones SET target_handle = 'lt' WHERE target_handle IS NULL;
