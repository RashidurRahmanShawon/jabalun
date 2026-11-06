// Visitor's choice about our own behaviour analytics (not Meta Pixel), kept in localStorage.
// "accepted" | "declined" | "" (not answered yet — nothing is tracked until accepted)
import { useSyncExternalStore } from "react";

const CONSENT_KEY = "jabalun_analytics_consent";
const CONSENT_EVENT = "jabalun:consent-updated";

export function getConsent() {
  try {
    return window.localStorage.getItem(CONSENT_KEY) || "";
  } catch {
    return "";
  }
}

export function setConsent(value) {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Storage blocked: the choice simply isn't remembered
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

function subscribe(onChange) {
  window.addEventListener(CONSENT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CONSENT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// null during server render / hydration (choice not known yet)
export function useConsent() {
  return useSyncExternalStore(subscribe, getConsent, () => null);
}
