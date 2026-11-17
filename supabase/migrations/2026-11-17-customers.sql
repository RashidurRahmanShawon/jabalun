-- Run once: Supabase Dashboard -> SQL Editor -> New query -> paste all -> Run. Safe to run again.
-- Customer profiles for the admin "গ্রাহক" page.
-- Customers themselves come from orders (grouped by phone); this table only stores what the
-- admin edits: name/address overrides, status, a note, and "deleted" (hidden from the list).
-- Orders are never changed or deleted by it.

CREATE TABLE IF NOT EXISTS public.customers (
  phone       TEXT PRIMARY KEY,                      -- 01XXXXXXXXX
  name        TEXT,
  address     TEXT,
  status      TEXT NOT NULL DEFAULT 'regular',       -- regular | vip | followup | blocked
  note        TEXT,
  deleted_at  TIMESTAMPTZ,                           -- set = hidden until they order again
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only the server (service role) reads/writes this table; the public anon key gets nothing
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
