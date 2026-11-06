// Small client-side behaviour tracker. Sends only event names, page paths, element
// names (data-track), field names and product IDs — never names, addresses, phones,
// emails or any input values. Nothing is sent unless the visitor accepted analytics.
import { getConsent } from "@/lib/consent";

const ENDPOINT = "/api/analytics";
const SESSION_KEY = "jabalun_sid";

function sessionId() {
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = window.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null; // storage blocked: events go without a session id
  }
}

// beacon: use for page-leave events, which must survive the page closing
export function track(type, data = {}, { beacon = false } = {}) {
  try {
    if (getConsent() !== "accepted") return;
    const body = JSON.stringify({
      type,
      data,
      sid: sessionId(),
      path: window.location.pathname,
      ts: Date.now(),
    });
    if (beacon && navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
      return;
    }
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Tracking must never break the page
  }
}
