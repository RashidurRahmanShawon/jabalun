"use client";

import { useEffect } from "react";
import { captureSource } from "@/lib/order-source";

// Remembers where the visitor came from (Facebook ad, TikTok, Google…) so the order can show it.
// Runs once per page load: the landing URL and referrer belong to the first page only.
export default function SourceCapture() {
  useEffect(() => {
    captureSource();
  }, []);
  return null;
}
