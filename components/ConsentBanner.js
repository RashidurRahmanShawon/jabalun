"use client";

import { setConsent, useConsent } from "@/lib/consent";

// Shown until the visitor chooses. Controls only our own analytics; Meta Pixel is separate.
export default function ConsentBanner() {
  const consent = useConsent();
  if (consent === null || consent) return null;

  return (
    <div
      role="region"
      aria-label="তথ্য সংগ্রহের সম্মতি"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-neutral-700">
          আমরা আপনার অভিজ্ঞতা উন্নত করতে আচরণ-সংক্রান্ত তথ্য সংগ্রহ করি।{" "}
          <span className="text-neutral-500">
            &quot;বন্ধ করুন&quot; চাপলে আমাদের নিজস্ব আচরণ-বিশ্লেষণ বন্ধ হবে। বিজ্ঞাপন পরিমাপের জন্য Meta Pixel চালু থাকতে পারে।
          </span>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setConsent("declined")}
            className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
          >
            বন্ধ করুন
          </button>
          <button
            type="button"
            onClick={() => setConsent("accepted")}
            className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            মেনে নিন
          </button>
        </div>
      </div>
    </div>
  );
}
