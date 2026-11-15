// Order source attribution (like WooCommerce "Origin"), shared by the browser and the server.
// Browser: remembers how the visitor arrived (UTM tags, ad click ids, referrer) for 30 days.
// Server: turns that into one channel name stored on the order.
// Only the arrival info is kept — never anything the visitor types.

export const SOURCE_STORAGE_KEY = "jabalun_order_source";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "ttclid", "gclid"];

// Channels shown in the admin (id -> label, colour tone)
export const SOURCES = {
  facebook: { label: "Facebook", tone: "blue" },
  instagram: { label: "Instagram", tone: "violet" },
  tiktok: { label: "TikTok", tone: "neutral" },
  google: { label: "Google", tone: "green" },
  youtube: { label: "YouTube", tone: "red" },
  whatsapp: { label: "WhatsApp", tone: "green" },
  messenger: { label: "Messenger", tone: "blue" },
  other: { label: "অন্যান্য সাইট", tone: "amber" },
  direct: { label: "Direct", tone: "neutral" },
  unknown: { label: "Unknown", tone: "neutral" },
};

export function sourceInfo(id) {
  return SOURCES[id] ?? SOURCES.unknown;
}

// ---------- Browser side ----------

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// Call on every page load. A visit that carries campaign info or comes from another
// site replaces the stored source; a plain direct visit keeps the earlier one.
export function captureSource() {
  try {
    const params = new URLSearchParams(window.location.search);
    const found = {};
    for (const key of FIELDS) {
      const value = params.get(key);
      if (value) found[key] = value.slice(0, 120);
    }
    const referrer = hostOf(document.referrer);
    const external = referrer && referrer !== window.location.hostname.replace(/^www\./, "");
    if (external) found.referrer = referrer;
    if (Object.keys(found).length === 0) return;

    found.landing = window.location.pathname.slice(0, 200);
    found.at = Date.now();
    window.localStorage.setItem(SOURCE_STORAGE_KEY, JSON.stringify(found));
  } catch {
    // storage blocked: the order is simply saved as "direct"
  }
}

export function readSource() {
  try {
    const data = JSON.parse(window.localStorage.getItem(SOURCE_STORAGE_KEY) || "null");
    if (!data || Date.now() - Number(data.at) > MAX_AGE_MS) return null;
    return data;
  } catch {
    return null;
  }
}

// ---------- Server side ----------

const clean = (value, max = 120) =>
  typeof value === "string" ? value.trim().replace(/[^\p{L}\p{N}._\-+/:{}| ]/gu, "").slice(0, max) : "";

// Untrusted browser payload -> safe { ...fields } (or {})
export function sanitizeSource(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const key of [...FIELDS, "referrer", "landing"]) {
    const value = clean(raw[key], key === "landing" ? 200 : 120);
    if (value) out[key] = value;
  }
  return out;
}

const RULES = [
  ["facebook", /(^|[^a-z])(fb|facebook|meta)([^a-z]|$)|facebook\.com|fb\.com|fb\.me/],
  ["instagram", /(^|[^a-z])(ig|insta|instagram)([^a-z]|$)|instagram\.com/],
  ["messenger", /messenger/],
  ["tiktok", /tiktok|(^|[^a-z])tt([^a-z]|$)/],
  ["youtube", /youtube|youtu\.be/],
  ["google", /google/],
  ["whatsapp", /whatsapp|wa\.me/],
];

// -> { source: channel id, paid: boolean }
export function classifySource(detail = {}) {
  const tagged = (detail.utm_source || "").toLowerCase();
  const referrer = (detail.referrer || "").toLowerCase();
  const medium = (detail.utm_medium || "").toLowerCase();
  const paid = /cpc|ppc|paid|ads?$|ads?[_-]|sponsored|boost/.test(medium) || Boolean(detail.gclid);

  for (const [id, pattern] of RULES) {
    if (tagged && pattern.test(tagged)) return { source: id, paid };
  }
  if (detail.ttclid) return { source: "tiktok", paid: true };
  if (detail.fbclid) return { source: "facebook", paid };
  if (detail.gclid) return { source: "google", paid: true };
  for (const [id, pattern] of RULES) {
    if (referrer && pattern.test(referrer)) return { source: id, paid };
  }
  if (tagged || referrer) return { source: "other", paid };
  return { source: "direct", paid: false };
}
