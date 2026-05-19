-- TattoFlow — Migration: add ancho/alto to nodos
-- Run in Supabase SQL Editor

ALTER TABLE nodos ADD COLUMN IF NOT EXISTS ancho integer DEFAULT 200;
ALTER TABLE nodos ADD COLUMN IF NOT EXISTS alto  integer DEFAULT 80;
