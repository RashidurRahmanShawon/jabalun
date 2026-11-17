"use client";

import { useRouter } from "next/navigation";

// Table row that opens `href` when clicked anywhere. Keep a real <Link> in the row too,
// so keyboard and screen-reader users (and "open in new tab") still work.
export default function ClickableRow({ href, className = "", children }) {
  const router = useRouter();

  function onClick(event) {
    // Let links, buttons and form controls inside the row do their own thing
    if (event.target.closest("a, button, input, select, textarea, label")) return;
    // Don't navigate when the admin is selecting text (e.g. copying a phone number)
    if (window.getSelection()?.toString()) return;
    if (event.ctrlKey || event.metaKey) {
      window.open(href, "_blank", "noopener");
      return;
    }
    router.push(href);
  }

  return (
    <tr onClick={onClick} className={`cursor-pointer transition-colors hover:bg-amber-50/60 ${className}`}>
      {children}
    </tr>
  );
}
