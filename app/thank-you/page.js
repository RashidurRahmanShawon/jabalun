import { timingSafeEqual } from "node:crypto";
import Link from "next/link";
import { getOrder } from "@/lib/woo";
import { decodeEntities, formatTaka } from "@/lib/text";

export const metadata = {
  title: "অর্ডার সম্পন্ন — জাবালুন",
  robots: { index: false, follow: false },
};

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function keysMatch(expected, given) {
  const a = Buffer.from(String(expected ?? ""));
  const b = Buffer.from(String(given ?? ""));
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

async function findOrder(id, key) {
  if (!id || !/^\d+$/.test(id) || !key) return null;

  try {
    const order = await getOrder(id);
    return order && keysMatch(order.order_key, key) ? order : null;
  } catch (error) {
    console.error("Failed to load order:", error.message);
    return null;
  }
}

export default async function ThankYouPage({ searchParams }) {
  const params = await searchParams;
  const order = await findOrder(firstValue(params.order), firstValue(params.key));

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm sm:p-8">
        {order ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
              ✓
            </div>
            <h1 className="mt-4 text-2xl font-bold text-neutral-900">
              ধন্যবাদ! আপনার অর্ডারটি গ্রহণ করা হয়েছে।
            </h1>
            <p className="mt-2 text-neutral-600">
              শীঘ্রই আমরা আপনার সঙ্গে যোগাযোগ করে অর্ডারটি নিশ্চিত করব।
            </p>

            <dl className="mt-6 divide-y divide-neutral-200 rounded-xl bg-neutral-50 text-left text-sm">
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-neutral-500">অর্ডার নম্বর</dt>
                <dd className="font-semibold text-neutral-900">#{order.number}</dd>
              </div>
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-neutral-500">পণ্য</dt>
                <dd className="text-right font-medium text-neutral-900">
                  {order.line_items.map((item) => (
                    <span key={item.id} className="block">
                      {decodeEntities(item.name)}
                      {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                    </span>
                  ))}
                </dd>
              </div>
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-neutral-500">মোট দাম</dt>
                <dd className="font-semibold text-neutral-900">{formatTaka(order.total)}</dd>
              </div>
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-neutral-500">পেমেন্ট</dt>
                <dd className="font-medium text-neutral-900">ক্যাশ অন ডেলিভারি</dd>
              </div>
            </dl>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-neutral-900">অর্ডারটি পাওয়া যায়নি</h1>
            <p className="mt-2 text-neutral-600">
              লিংকটি সঠিক কিনা দেখুন, অথবা support@jabalun.com-এ যোগাযোগ করুন।
            </p>
          </>
        )}

        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-black px-8 py-3 font-semibold text-white transition hover:bg-neutral-800"
        >
          হোমে ফিরে যান
        </Link>
      </div>
    </main>
  );
}
