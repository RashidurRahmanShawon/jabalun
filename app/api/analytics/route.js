// Receives behaviour events from lib/analytics.js.
// For now nothing is stored or logged (no IP either) — a database comes later.

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

  try {
    const event = JSON.parse(text);
    if (!event || typeof event !== "object" || !TYPES.has(event.type)) {
      return new Response(null, { status: 400 });
    }
  } catch {
    return new Response(null, { status: 400 });
  }

  return new Response(null, { status: 204 });
}
