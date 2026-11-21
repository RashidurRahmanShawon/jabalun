import Link from "next/link";

export const metadata = {
  title: "পেজটি পাওয়া যায়নি — জাবালুন",
  robots: { index: false, follow: true },
};

// Shown for any unknown address: send the visitor straight to the products instead of a dead end
export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-neutral-900">দুঃখিত, এই পেজটি পাওয়া যায়নি</h1>
        <p className="mt-2 text-neutral-600">পণ্যটি হয়তো সরানো হয়েছে। নিচে আমাদের সব ডিজাইন দেখুন।</p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/product/ready-hijab-all-collection"
            className="rounded-full bg-black px-6 py-3 font-semibold text-white transition hover:bg-neutral-800"
          >
            সব রেডি হিজাব দেখুন
          </Link>
          <Link
            href="/product/khimar-plazu-all-collection"
            className="rounded-full bg-black px-6 py-3 font-semibold text-white transition hover:bg-neutral-800"
          >
            সব খিমার প্লাজু সেট দেখুন
          </Link>
          <Link href="/" className="mt-2 text-sm text-neutral-500 underline hover:text-neutral-900">
            হোমে ফিরে যান
          </Link>
        </div>
      </div>
    </main>
  );
}
