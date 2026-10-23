"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export default function CartCount() {
  const items = useCart();
  const count = (items ?? []).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      href="/cart"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-neutral-800 hover:bg-neutral-100"
      aria-label={`কার্ট — ${count.toLocaleString("bn-BD")}টি পণ্য`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 7h12l-1 13H7L6 7Z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
      <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#b45309] px-1 text-xs font-bold text-white">
        {count.toLocaleString("bn-BD")}
      </span>
    </Link>
  );
}
