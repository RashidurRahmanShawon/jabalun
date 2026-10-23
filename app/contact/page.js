import { SITE, hasValue } from "@/lib/site";

export const metadata = {
  title: "যোগাযোগ করুন | জাবালুন",
  description: "জাবালুনের সঙ্গে যোগাযোগ করুন — অর্ডার, পণ্য বা ডেলিভারি নিয়ে যেকোনো প্রশ্নে।",
};

export default function ContactPage() {
  const whatsappDigits = hasValue(SITE.whatsapp) ? SITE.whatsapp.replace(/\D/g, "") : "";

  const email = hasValue(SITE.contactEmail) ? SITE.contactEmail : SITE.email;

  const rows = [
    hasValue(SITE.address) && { label: "ঠিকানা", value: SITE.address },
    hasValue(SITE.phone) && {
      label: "ফোন",
      value: SITE.phone,
      href: `tel:${SITE.phone.replace(/[^\d+]/g, "")}`,
    },
    hasValue(email) && {
      label: "ইমেইল",
      value: email,
      href: `mailto:${email}`,
    },
  ].filter(Boolean);

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">যোগাযোগ করুন</h1>
        <p className="mt-3 text-neutral-600">
          অর্ডার, পণ্য বা ডেলিভারি নিয়ে যেকোনো প্রশ্নে আমাদের জানান।
        </p>

        <dl className="mt-8 divide-y divide-neutral-200 rounded-2xl border border-neutral-200">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:gap-6">
              <dt className="w-20 shrink-0 font-semibold text-neutral-900">{row.label}</dt>
              <dd className="break-words text-neutral-700">
                {row.href ? (
                  <a href={row.href} className="underline-offset-4 hover:underline">
                    {row.value}
                  </a>
                ) : (
                  row.value
                )}
              </dd>
            </div>
          ))}
        </dl>

        {whatsappDigits ? (
          <a
            href={`https://wa.me/${whatsappDigits}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-8 py-3 font-semibold text-white transition hover:brightness-95"
          >
            হোয়াটসঅ্যাপে মেসেজ দিন
          </a>
        ) : null}
      </div>
    </main>
  );
}
