-- Run once: Supabase Dashboard -> SQL Editor -> New query -> paste all -> Run. Safe to run again.

-- 1) Order source tracking (Facebook / TikTok / Google …)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source_detail JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_orders_source ON public.orders(source);

-- 2) Old orders were saved with subtotal/total 0 (a bug, now fixed).
--    Fill them in from the products' current prices. Only touches orders whose total is 0.
UPDATE public.orders AS o
SET subtotal = s.amount,
    total = GREATEST(0, s.amount - o.discount + o.delivery_fee),
    updated_at = o.updated_at
FROM (
  SELECT o2.id, SUM(p.price * COALESCE((it->>'quantity')::int, 1)) AS amount
  FROM public.orders o2
  CROSS JOIN LATERAL jsonb_array_elements(o2.items) AS it
  JOIN public.products p ON p.id = COALESCE(it->>'product_id', it->>'productId')::int
  WHERE o2.total = 0
  GROUP BY o2.id
) AS s
WHERE o.id = s.id AND s.amount > 0;

-- 3) Tell the API about the new columns right away
NOTIFY pgrst, 'reload schema';
