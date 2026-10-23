"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Sends PageView on client-side page changes. The first load is already tracked by
// the base code, and query-only changes (e.g. shop ?category=) are ignored.
export default function PixelPageView() {
  const pathname = usePathname();
  const previous = useRef(pathname);

  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    // fbq is missing when blocked (ad blocker) — then the event is simply skipped
    if (typeof window.fbq === "function") window.fbq("track", "PageView");
  }, [pathname]);

  return null;
}
