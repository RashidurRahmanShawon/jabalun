import Link from "next/link";
import { SITE, hasValue } from "@/lib/site";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-black text-neutral-300">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="mb-3 text-2xl font-bold text-[#d97706]">{SITE.siteName}</p>
          <p className="text-sm leading-relaxed">
            আত্মবিশ্বাসী পর্দাশীল নারীর জন্য আধুনিক খিমার ও হিজাব।
          </p>
        </div>
        <div>
          <h3 className="mb-4 text-lg font-semibold text-white">কুইক লিংক</h3>
          <ul className="space-y-2">
            <li><Link href="/" className="hover:text-white">হোম</Link></li>
            <li><Link href="/shop" className="hover:text-white">শপ</Link></li>
            <li><Link href="/about" className="hover:text-white">এবাউট</Link></li>
            <li><Link href="/contact" className="hover:text-white">কন্টাক্ট</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-lg font-semibold text-white">কাস্টমার সার্ভিস</h3>
          <ul className="space-y-2">
            <li><Link href="/privacy" className="hover:text-white">গোপনীয়তা নীতি</Link></li>
            <li><Link href="/terms" className="hover:text-white">শর্তাবলী</Link></li>
            <li><Link href="/return" className="hover:text-white">রিটার্ন ও রিফান্ড পলিসি</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-lg font-semibold text-white">যোগাযোগ</h3>
          <ul className="space-y-2">
            {hasValue(SITE.email) ? (
              <li>
                ইমেইল:{" "}
                <a href={`mailto:${SITE.email}`} className="hover:text-white">
                  {SITE.email}
                </a>
              </li>
            ) : null}
            {hasValue(SITE.phone) ? (
              <li>
                ফোন:{" "}
                <a href={`tel:${SITE.phone.replace(/[^\d+]/g, "")}`} className="hover:text-white">
                  {SITE.phone}
                </a>
              </li>
            ) : null}
            {hasValue(SITE.address) ? <li>ঠিকানা: {SITE.address}</li> : null}
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-800 px-4 py-5 text-center text-sm text-neutral-500">
        Copyright © {year} Jabalun. All rights reserved.
      </div>
    </footer>
  );
}
