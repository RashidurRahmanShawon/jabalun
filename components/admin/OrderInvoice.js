// Print-only invoice (hidden on screen). Layout follows the old Jabalun WooCommerce invoice PDF.
import { SITE } from "@/lib/site";
import { normalizePhone } from "@/lib/phone";

const GREEN = "#1fa84f";

const money = (value) => `৳${new Intl.NumberFormat("en-IN").format(Math.round(Number(value) || 0))}`;

function invoiceDate(raw) {
  const ms = Date.parse(raw || "");
  if (Number.isNaN(ms)) return "—";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Dhaka",
    })
      .formatToParts(new Date(ms))
      .map((p) => [p.type, p.value])
  );
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute} ${String(parts.dayPeriod).toUpperCase()}`;
}

// Date under the signatures, written like the signature sheet: 11/15/2026 (Dhaka time)
function signatureDate(raw) {
  const ms = Date.parse(raw || "");
  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(Number.isNaN(ms) ? new Date() : new Date(ms));
}

const SIGNERS = [
  { key: "yasin", name: "Yasin", title: "Founder & CEO", width: 150 },
  { key: "rajib", name: "Rajib", title: "Co-Founder & Managing Director", width: 125 },
];

const ASSET = "/admin/invoice-asset";
const SIGNATURE_FONT = "'La Boutier', cursive";

// Round rubber-stamp seal, drawn in SVG so it prints sharp at any size
function AuthorizedStamp() {
  const ink = "#166534";
  return (
    <svg viewBox="0 0 200 200" width="150" height="150" aria-hidden="true">
      <defs>
        <path id="stamp-top" d="M 30 100 A 70 70 0 0 1 170 100" />
        <path id="stamp-bottom" d="M 22 100 A 78 78 0 0 0 178 100" />
      </defs>
      <circle cx="100" cy="100" r="94" fill="none" stroke={ink} strokeWidth="5" />
      <circle cx="100" cy="100" r="84" fill="none" stroke={ink} strokeWidth="1.5" />
      <circle cx="100" cy="100" r="56" fill="none" stroke={ink} strokeWidth="1.5" />
      <text fill={ink} fontSize="19" fontWeight="800" letterSpacing="3" fontFamily="Arial, sans-serif">
        <textPath href="#stamp-top" startOffset="50%" textAnchor="middle">JABALUN</textPath>
      </text>
      <text fill={ink} fontSize="13" fontWeight="700" letterSpacing="2" fontFamily="Arial, sans-serif">
        <textPath href="#stamp-bottom" startOffset="50%" textAnchor="middle">★ JABALUN.COM ★</textPath>
      </text>
      <rect x="22" y="84" width="156" height="32" fill="#fff" stroke={ink} strokeWidth="3" />
      <text x="100" y="107" fill={ink} fontSize="19" fontWeight="900" letterSpacing="2" textAnchor="middle" fontFamily="Arial, sans-serif">
        AUTHORIZED
      </text>
      <text x="100" y="74" fill={ink} fontSize="16" textAnchor="middle">★</text>
      <text x="100" y="138" fill={ink} fontSize="11" fontWeight="700" letterSpacing="1.5" textAnchor="middle" fontFamily="Arial, sans-serif">
        PAID IN FULL
      </text>
    </svg>
  );
}

export default function OrderInvoice({ order, name, phone, address, statusLabel }) {
  const items = order.line_items ?? [];
  const discount = Number(order.discount) || 0;
  const deliveryFee = Number(order.delivery_fee) || 0;
  const shopPhone = normalizePhone(SITE.phone);
  const completed = order.status === "completed";
  // Completed orders: the day it was completed; otherwise the day it is printed
  const signedOn = signatureDate(completed ? order.updated_at || order.created_at : null);

  return (
    <>
    {/* Loads the signature font on screen (invisibly) so it is ready when the print dialog opens */}
    <span aria-hidden="true" className="pointer-events-none absolute h-0 overflow-hidden opacity-0 print:hidden" style={{ fontFamily: SIGNATURE_FONT }}>
      0123456789/
    </span>
    <div className="hidden bg-white px-[12mm] pt-[14mm] text-[13px] leading-snug text-neutral-900 print:block">
      <style>{`@font-face { font-family: 'La Boutier'; src: url('${ASSET}/LaBoutier.ttf') format('truetype'); font-display: block; }
        @page { size: A4; margin: 0; } /* margin 0 = browser prints no header/footer (title, date, URL) */
        @media print { html, body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>

      {/* Header */}
      <div className="flex items-start justify-between pb-4" style={{ borderBottom: `1.5px solid ${GREEN}` }}>
        <div>
          <p className="text-4xl font-bold" style={{ color: GREEN }}>Jabalun</p>
          <p className="mt-1 text-neutral-600">jabalun.com · {shopPhone}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">অর্ডার ইনভয়েস</p>
          <p className="mt-1">অর্ডার নং: <b>#{order.number}</b></p>
          <p className="text-neutral-600">তারিখ: {invoiceDate(order.created_at)}</p>
          <p className="text-neutral-600">স্ট্যাটাস: {statusLabel}</p>
        </div>
      </div>

      {/* Customer + payment boxes */}
      <div className="mt-5 grid grid-cols-2 gap-5">
        <div className="border border-neutral-300 p-3">
          <p className="text-base font-bold" style={{ color: GREEN }}>গ্রাহকের তথ্য</p>
          <p><b>নাম:</b> {name}</p>
          <p><b>মোবাইল:</b> {phone || "—"}</p>
          <p><b>ঠিকানা:</b> {address}</p>
        </div>
        <div className="border border-neutral-300 p-3">
          <p className="text-base font-bold" style={{ color: GREEN }}>পেমেন্ট ও ডেলিভারি</p>
          <p><b>পেমেন্ট:</b> {order.payment_method_title || "ক্যাশ অন ডেলিভারি"}</p>
          <p><b>ডেলিভারি:</b> {deliveryFee > 0 ? `ডেলিভারি চার্জ ${money(deliveryFee)}` : "ফ্রি ডেলিভারি"}</p>
        </div>
      </div>

      {/* Items */}
      <table className="mt-8 w-full border-collapse">
        <thead>
          <tr className="text-left text-white" style={{ backgroundColor: GREEN }}>
            <th className="w-12 border border-neutral-300 px-3 py-2 font-bold">#</th>
            <th className="border border-neutral-300 px-3 py-2 font-bold">প্রোডাক্ট</th>
            <th className="w-24 border border-neutral-300 px-3 py-2 font-bold">পরিমাণ</th>
            <th className="w-32 border border-neutral-300 px-3 py-2 font-bold">একক মূল্য</th>
            <th className="w-32 border border-neutral-300 px-3 py-2 font-bold">মোট</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id}>
              <td className="border border-neutral-300 px-3 py-1.5 text-center">{index + 1}</td>
              <td className="border border-neutral-300 px-3 py-1.5">{item.name}</td>
              <td className="border border-neutral-300 px-3 py-1.5 text-center">{item.quantity}</td>
              <td className="border border-neutral-300 px-3 py-1.5 text-right">{money(item.price)}</td>
              <td className="border border-neutral-300 px-3 py-1.5 text-right">{money(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="ml-auto mt-8 w-[45%] text-[14px]">
        <div className="flex justify-between px-2 py-1">
          <span>সাবটোটাল:</span>
          <span>{money(order.subtotal)}</span>
        </div>
        {discount > 0 ? (
          <div className="flex justify-between px-2 py-1">
            <span>ছাড়:</span>
            <span>−{money(discount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between px-2 py-1">
          <span>ডেলিভারি চার্জ:</span>
          <span>{deliveryFee > 0 ? money(deliveryFee) : "ফ্রি"}</span>
        </div>
        <div className="mt-1 flex justify-between px-2 pt-2 text-lg font-bold" style={{ borderTop: `2px solid ${GREEN}` }}>
          <span>সর্বমোট:</span>
          <span>{money(order.total)}</span>
        </div>
      </div>

      <p className="mt-12 text-center text-neutral-600">আমাদের সাথে কেনাকাটার জন্য ধন্যবাদ।</p>

      {/* Page frame matching the content margins; PAID, stamp and signatures are placed inside it */}
      <div className="pointer-events-none fixed bottom-[16mm] left-[12mm] right-[12mm] top-[14mm]">
      {completed ? (
        <>
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2 -rotate-[30deg] select-none rounded-2xl px-10 py-2 text-[110px] font-black leading-none tracking-[0.15em]"
            style={{ color: GREEN, border: `10px solid ${GREEN}`, opacity: 0.18 }}
          >
            PAID
          </div>
          <div className="absolute left-[22%] top-[66%] -rotate-12 opacity-85">
            <AuthorizedStamp />
          </div>
        </>
      ) : null}

      {/* Signatures */}
      <div className="absolute inset-x-0 bottom-8 flex items-end justify-between">
        {SIGNERS.map((signer) => (
          <div key={signer.key} className="w-56 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${ASSET}/signature-${signer.key}.png`} alt={`${signer.name} signature`} className="mx-auto h-auto" style={{ width: signer.width }} />
            <p className="mt-1 text-[15px] leading-none tracking-wide text-neutral-800" style={{ fontFamily: SIGNATURE_FONT }}>{signedOn}</p>
            <div className="mt-1 border-t border-neutral-400 pt-1">
              <p className="text-[13px] font-bold">{signer.name}</p>
              <p className="text-[11px] text-neutral-600">{signer.title}, Jabalun</p>
            </div>
          </div>
        ))}
      </div>

      <p className="absolute inset-x-0 bottom-0 text-center text-xs text-neutral-500">Jabalun · jabalun.com</p>
      </div>
    </div>
    </>
  );
}
