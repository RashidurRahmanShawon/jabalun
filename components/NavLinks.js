"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "হোম" },
  { href: "/shop", label: "শপ" },
  { href: "/about", label: "এবাউট" },
  { href: "/contact", label: "কন্টাক্ট" },
];

function isActive(pathname, href) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="প্রধান মেনু" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={isActive(pathname, link.href) ? "page" : undefined}
              className="rounded-full px-4 py-2 font-medium text-neutral-700 transition hover:text-[#b45309] aria-[current=page]:bg-amber-50 aria-[current=page]:text-[#b45309]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function MobileMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);

  // Close the menu after navigating to another page
  if (open && openedAt !== pathname) {
    setOpen(false);
  }

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => {
          setOpenedAt(pathname);
          setOpen((current) => !current);
        }}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-neutral-800 hover:bg-neutral-100"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      <nav
        id="mobile-menu"
        aria-label="প্রধান মেনু"
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-neutral-200 bg-white shadow-sm"
      >
        <ul className="mx-auto max-w-7xl px-4 py-2">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(pathname, link.href) ? "page" : undefined}
                className="block rounded-lg px-3 py-3 font-medium text-neutral-800 hover:bg-neutral-50 aria-[current=page]:text-[#b45309]"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
