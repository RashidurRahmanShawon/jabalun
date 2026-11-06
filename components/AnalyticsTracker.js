"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";
import { readCart } from "@/lib/cart";
import { CART_EVENT } from "@/lib/site";

const SCROLL_MILESTONES = [25, 50, 75, 100];
// Checkout form inputs are recognised by id only — the form code itself is untouched
const CHECKOUT_FIELD = /^(?:inline-)?checkout-(name|address|phone|note)$/;
// Buttons (data-track names) that open a checkout
const CHECKOUT_STARTERS = new Set(["buy-now", "cart-checkout", "collection-checkout"]);

function cartSnapshot() {
  try {
    return new Map(readCart().map((item) => [item.id, item.quantity]));
  } catch {
    return new Map();
  }
}

// Page views, scroll depth, time on page, clicks, checkout field exits and cart changes
export default function AnalyticsTracker() {
  const pathname = usePathname();
  const page = useRef({ path: null, start: 0, milestones: new Set() });

  // page_view + time_on_page for the previous page on every route change
  useEffect(() => {
    try {
      const previous = page.current;
      if (previous.path) {
        track("time_on_page", { path: previous.path, seconds: Math.round((Date.now() - previous.start) / 1000) });
      }
      track("page_view", { path: pathname, referrer: previous.path ?? (document.referrer || null) });
      page.current = { path: pathname, start: Date.now(), milestones: new Set() };
    } catch {
      // ignore
    }
  }, [pathname]);

  useEffect(() => {
    let frame = 0;

    function onScroll() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        try {
          const doc = document.documentElement;
          const scrollable = doc.scrollHeight - window.innerHeight;
          const percent = scrollable <= 0 ? 100 : ((window.scrollY + 1) / scrollable) * 100;
          for (const milestone of SCROLL_MILESTONES) {
            if (percent >= milestone && !page.current.milestones.has(milestone)) {
              page.current.milestones.add(milestone);
              track("scroll_depth", { depth: milestone });
            }
          }
        } catch {
          // ignore
        }
      });
    }

    function onLeave() {
      try {
        if (document.visibilityState === "visible" || !page.current.path) return;
        track(
          "time_on_page",
          { path: page.current.path, seconds: Math.round((Date.now() - page.current.start) / 1000) },
          { beacon: true }
        );
        // Restart the timer in case the visitor comes back to this tab
        page.current.start = Date.now();
      } catch {
        // ignore
      }
    }

    function onClick(event) {
      try {
        const element = event.target instanceof Element ? event.target.closest("[data-track]") : null;
        if (!element) return;
        const name = element.getAttribute("data-track");
        track("click", { name });
        if (CHECKOUT_STARTERS.has(name)) track("cart_event", { action: "checkout_start", source: name });
      } catch {
        // ignore
      }
    }

    function onFocusOut(event) {
      try {
        const match = event.target?.id?.match(CHECKOUT_FIELD);
        if (match) track("form_field_exit", { field: match[1] }); // field name only, never the value
      } catch {
        // ignore
      }
    }

    // Cart add/remove worked out by comparing the cart before and after each change
    let cart = cartSnapshot();
    function onCartChange() {
      try {
        const next = cartSnapshot();
        for (const id of new Set([...cart.keys(), ...next.keys()])) {
          const delta = (next.get(id) ?? 0) - (cart.get(id) ?? 0);
          if (delta !== 0) {
            track("cart_event", { action: delta > 0 ? "add" : "remove", productId: id, quantity: Math.abs(delta) });
          }
        }
        cart = next;
      } catch {
        // ignore
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onLeave);
    document.addEventListener("click", onClick, { capture: true });
    document.addEventListener("focusout", onFocusOut);
    window.addEventListener(CART_EVENT, onCartChange);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onLeave);
      document.removeEventListener("click", onClick, { capture: true });
      document.removeEventListener("focusout", onFocusOut);
      window.removeEventListener(CART_EVENT, onCartChange);
    };
  }, []);

  return null;
}
