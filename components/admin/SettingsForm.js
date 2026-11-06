"use client";

import { useState } from "react";
import { Button, Card, Field, Toggle, inputClass } from "./ui";

export default function SettingsForm({ store }) {
  const [shop, setShop] = useState(store);
  const [profile, setProfile] = useState({ name: "অ্যাডমিন", email: "" });
  const [tracking, setTracking] = useState({ consentBanner: true, analytics: true, metaPixel: true });
  const [saved, setSaved] = useState(false);

  const setShopField = (field) => (e) => {
    setShop({ ...shop, [field]: e.target.value });
    setSaved(false);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(true);
      }}
      className="grid gap-6 lg:grid-cols-2"
    >
      <Card title="দোকানের তথ্য">
        <div className="space-y-4">
          <Field label="দোকানের নাম" htmlFor="s-name">
            <input id="s-name" className={inputClass} value={shop.name} onChange={setShopField("name")} />
          </Field>
          <Field label="ইমেইল" htmlFor="s-email">
            <input id="s-email" type="email" className={inputClass} value={shop.email} onChange={setShopField("email")} />
          </Field>
          <Field label="ফোন" htmlFor="s-phone">
            <input id="s-phone" className={inputClass} value={shop.phone} onChange={setShopField("phone")} />
          </Field>
          <Field label="ঠিকানা" htmlFor="s-address">
            <textarea id="s-address" rows={2} className={inputClass} value={shop.address} onChange={setShopField("address")} />
          </Field>
        </div>
      </Card>

      <div className="space-y-6">
        <Card title="অ্যাডমিন প্রোফাইল">
          <div className="space-y-4">
            <Field label="নাম" htmlFor="a-name">
              <input id="a-name" className={inputClass} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </Field>
            <Field label="লগইন ইমেইল" htmlFor="a-email" hint="লগইন সুরক্ষা যোগ হলে এটি ব্যবহার হবে">
              <input id="a-email" type="email" className={inputClass} value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            </Field>
          </div>
        </Card>

        <Card title="কুকি ও ট্র্যাকিং সম্মতি">
          <ul className="space-y-4">
            {[
              { key: "consentBanner", label: "সম্মতি বার্তা দেখান", hint: "পাবলিক সাইটের নিচে" },
              { key: "analytics", label: "নিজস্ব আচরণ-বিশ্লেষণ", hint: "ক্রেতা 'মেনে নিন' চাপলে তবেই চলে" },
              { key: "metaPixel", label: "Meta Pixel", hint: "বিজ্ঞাপন পরিমাপ — NEXT_PUBLIC_META_PIXEL_ID দিয়ে নিয়ন্ত্রিত" },
            ].map((item) => (
              <li key={item.key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-neutral-800">{item.label}</p>
                  <p className="text-xs text-neutral-500">{item.hint}</p>
                </div>
                <Toggle
                  checked={tracking[item.key]}
                  onChange={(on) => {
                    setTracking({ ...tracking, [item.key]: on });
                    setSaved(false);
                  }}
                  label={item.label}
                />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
        <Button type="submit">সংরক্ষণ করুন</Button>
        {saved ? (
          <span role="status" className="text-sm text-amber-800">
            নমুনা — এই সেটিংস এখনো কোথাও সংরক্ষণ হয় না, আর সাইটের আচরণ বদলায় না।
          </span>
        ) : null}
      </div>
    </form>
  );
}
