import { getSupabaseServer } from "@/lib/supabase-server";

// Receives behaviour events from lib/analytics.js.
const MAX_BYTES = 4096;
const TYPES = new Set([
  "page_view",
  "click",
  "scroll_depth",
  "time_on_page",
  "form_field_exit",
  "cart_event",
]);

export async function POST(request) {
  let text;
  try {
    text = await request.text();
  } catch {
    return new Response(null, { status: 400 });
  }
  if (text.length > MAX_BYTES) return new Response(null, { status: 413 });

  let event;
  try {
    event = JSON.parse(text);
    if (!event || typeof event !== "object" || !TYPES.has(event.type)) {
      return new Response(null, { status: 400 });
    }
  } catch {
    return new Response(null, { status: 400 });
  }

  // Persist to Supabase if configured (fails silently if unconfigured or error)
  const supabase = getSupabaseServer();
  if (supabase) {
    try {
      await supabase.from("analytics_events").insert({
        type: event.type,
        sid: event.sid || null,
        path: event.path || "/",
        data: event.data || {},
      });
    } catch (err) {
      console.error("Supabase analytics insert error:", err.message);
    }
  }

  return new Response(null, { status: 204 });
}
