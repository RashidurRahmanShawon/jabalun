"use client";

import { usePathname } from "next/navigation";

// Public-site wrapper: header, footer and extras (Meta Pixel, consent, analytics)
// are left out on /admin, which has its own layout.
export default function SiteChrome({ header, footer, extras, children }) {
  const pathname = usePathname() ?? "";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return children;

  return (
    <>
      {header}
      {children}
      {footer}
      {extras}
    </>
  );
}
