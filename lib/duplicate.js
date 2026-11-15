import "server-only";
import { createHash } from "node:crypto";
import { getSupabaseServer } from "@/lib/supabase-server";
import { normalizePhone } from "@/lib/phone";
import { decodeEntities } from "@/lib/text";

// Duplicate-order check: has this phone ordered in the last 60 minutes?
// Phone is the main signal; a salted hash of the IP decides whether order details may be shown.
// The raw IP is never stored or logged — only its hash, and only when ORDER_HASH_SALT is set.

export const DUPLICATE_WINDOW_MINUTES = 60;

const ACTIVE = new Set(["processing", "pending", "on-hold", "completed"]);
const INACTIVE = new Set(["cancelled", "failed", "refunded"]);

// First x-forwarded-for value, else x-real-ip. Returns null without a salt (IP check off).
export function hashClientIp(headers) {
  const salt = process.env.ORDER_HASH_SALT;
  if (!salt) return null;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || headers.get("x-real-ip")?.trim();
  if (!ip) return null;
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

// Only what the customer's own popup needs: no name, address or phone
function summarize(row) {
  const items = (row.items || []).map((item) => ({
    name: decodeEntities(item.name || "পণ্য"),
    image: item.image || null,
    quantity: Number(item.quantity) || 1,
    price: Number(item.price) || 0,
  }));
  const itemSum = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = Number(row.total) || Math.max(0, itemSum - Number(row.discount || 0) + Number(row.delivery_fee || 0));
  return {
    number: row.number ?? row.id,
    date: row.created_at,
    items: items.map(({ name, image, quantity }) => ({ name, image, quantity })),
    total,
  };
}

// -> { activeMatches, recentInactiveMatches }, each [{ ipMatch, summary }].
// Never throws: on any problem it returns no matches so ordering keeps working.
export async function findRecentDuplicates({ phone, ipHash }) {
  const empty = { activeMatches: [], recentInactiveMatches: [] };
  const wanted = normalizePhone(phone);
  const supabase = getSupabaseServer();
  if (!wanted || !supabase) return empty;

  try {
    const after = new Date(Date.now() - DUPLICATE_WINDOW_MINUTES * 60 * 1000).toISOString();
    // select("*") so this works before and after the source_detail migration
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", after)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      console.error("Duplicate check failed:", error.message);
      return empty;
    }

    const result = { activeMatches: [], recentInactiveMatches: [] };
    for (const row of data || []) {
      if (normalizePhone(row.phone || "") !== wanted) continue;
      const match = {
        ipMatch: Boolean(ipHash && row.source_detail?.ip_hash === ipHash),
        summary: summarize(row),
      };
      if (ACTIVE.has(row.status)) result.activeMatches.push(match);
      else if (INACTIVE.has(row.status)) result.recentInactiveMatches.push(match);
    }
    return result;
  } catch (error) {
    console.error("Duplicate check failed:", error.message);
    return empty;
  }
}
