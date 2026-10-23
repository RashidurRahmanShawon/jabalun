import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "আমাদের সম্পর্কে | জাবালুন",
  description:
    "জাবালুন — আত্মবিশ্বাসী, পর্দাশীল নারীর বিশ্বস্ত ঠিকানা। মানসম্পন্ন খিমার ও হিজাব, যা তৈরি হয়েছে আরাম, শালীনতা এবং আত্মবিশ্বাসের কথা মাথায় রেখে।",
};

const GOLD = "text-[#c9a227]";

const REASONS = [
  {
    icon: "🧵",
    title: "উন্নতমানের ফেব্রিক",
    text: "সফট, হালকা লিলেন কাপড়ে তৈরি — যা সব ঋতুতে পরিধানের জন্য আরামদায়ক ও উপযোগী।",
  },
  {
    icon: "📏",
    title: "ঝামেলাহীন সাইজ",
    text: "কোমড়ে ইলাস্টিক ডিজাইনের কারণে বেশিরভাগ শরীরের গঠনেই সহজে ও আরামে মানিয়ে যায়।",
  },
  {
    icon: "🚚",
    title: "সম্পূর্ণ বাংলাদেশ ডেলিভারি",
    text: "দেশের প্রতিটি প্রান্তে দ্রুত ও নিরাপদ হোম ডেলিভারি ব্যবস্থা।",
  },
  {
    icon: "🤝",
    title: "ক্যাশ অন ডেলিভারি",
    text: "পণ্য হাতে পেয়ে, যাচাই করে তারপর মূল্য পরিশোধ — সম্পূর্ণ নিরাপদ ও বিশ্বাসযোগ্য কেনাকাটা।",
  },
];

// Two columns, read top-to-bottom like the original page
const PROMISES = [
  [
    "প্রতিটি পণ্য মান-যাচাই করে তারপর প্যাকেজিং করা হয়",
    "১০০% অথেন্টিক পণ্যের নিশ্চয়তা",
    "দ্রুত ও বন্ধুত্বপূর্ণ গ্রাহক সেবা",
  ],
  [
    "স্বচ্ছ মূল্য — কোনো লুকানো চার্জ নেই",
    "সহজ রিটার্ন ও রিফান্ড পলিসি",
    "গ্রাহকের সন্তুষ্টিই আমাদের কাছে সবচেয়ে বড় অগ্রাধিকার",
  ],
];

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0">
      <circle cx="10" cy="10" r="10" fill="#16a34a" />
      <path d="M6 10.5l2.5 2.5L14 7.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GoldDivider() {
  return (
    <div aria-hidden="true" className="mt-8 flex items-center justify-center gap-3">
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-[#c9a227]" />
      <span className="h-2 w-2 rotate-45 bg-[#c9a227]" />
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-[#c9a227]" />
    </div>
  );
}

export default function AboutPage() {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl space-y-14 px-4 py-10 sm:space-y-20 sm:py-14">
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-[#141217] px-6 py-14 text-center text-white sm:px-10 sm:py-20">
          <span aria-hidden="true" className="absolute -left-24 -top-24 -z-10 h-64 w-64 rounded-full border border-[#c9a227]/20" />
          <span aria-hidden="true" className="absolute -bottom-32 -right-16 -z-10 h-80 w-80 rounded-full border border-[#c9a227]/20" />
          <p className={`text-sm font-semibold ${GOLD}`}>আমাদের সম্পর্কে</p>
          <h1 className="mx-auto mt-4 max-w-4xl text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
            জাবালুন — আত্মবিশ্বাসী, পর্দাশীল নারীর বিশ্বস্ত ঠিকানা
          </h1>
          <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-neutral-300 sm:text-lg">
            মানসম্পন্ন খিমার ও হিজাব, যা তৈরি হয়েছে আরাম, শালীনতা এবং আত্মবিশ্বাসের কথা মাথায় রেখে।
          </p>
          <GoldDivider />
        </section>

        {/* Our journey */}
        <section className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">আমাদের যাত্রা</h2>
          <div className="mt-6 space-y-4 leading-loose text-neutral-600">
            <p>
              জাবালুন শুরু হয়েছে একটি সাধারণ কিন্তু গুরুত্বপূর্ণ বিশ্বাস থেকে — পর্দা মানে শুধু আবরণ নয়, এটি একজন নারীর আত্মবিশ্বাস, রুচি এবং স্বাচ্ছন্দ্যের প্রতিচ্ছবি। আমরা মনে করি, প্রতিটি নারীর অধিকার আছে এমন খিমার ও হিজাব পরার, যা দেখতে যেমন সুন্দর, পরে থাকতেও ঠিক ততটাই আরামদায়ক।
            </p>
            <p>
              এই ভাবনা থেকেই জাবালুনের পথচলা — বাংলাদেশের প্রতিটি প্রান্তের নারীদের কাছে উন্নতমানের, আরামদায়ক এবং সাশ্রয়ী মূল্যের পর্দা-পোশাক সরাসরি পৌঁছে দেওয়ার লক্ষ্য নিয়ে। প্রতিটি পণ্য বাছাই ও তৈরির ক্ষেত্রে আমরা গুরুত্ব দিই কাপড়ের মান, ফিনিশিং এবং দৈনন্দিন ব্যবহারের উপযোগিতার দিকে — যেন আমাদের গ্রাহকরা শুধু একটি পোশাক নয়, বরং স্বস্তি ও আত্মবিশ্বাস নিয়ে ঘর থেকে বের হতে পারেন।
            </p>
          </div>
        </section>

        {/* Why choose us */}
        <section className="bg-[#eef6ee] px-4 py-12 sm:px-10 sm:py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">কেন জাবালুন বেছে নেবেন</h2>
            <p className="mt-3 text-neutral-600">আমাদের প্রতিশ্রুতি — মান, আরাম এবং বিশ্বাসের নিশ্চয়তা</p>
          </div>
          <ul className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {REASONS.map((reason) => (
              <li key={reason.title} className="rounded-xl bg-white p-6 text-center shadow-sm">
                <span
                  aria-hidden="true"
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#c9a227] bg-[#fdf8ec] text-2xl"
                >
                  {reason.icon}
                </span>
                <h3 className="mt-4 font-bold text-neutral-900">{reason.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{reason.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Our promise */}
        <section className="mx-auto max-w-5xl rounded-2xl border border-[#d6ead6] bg-[#f1f8f1] px-6 py-10 sm:px-10">
          <h2 className="text-center text-2xl font-bold text-neutral-900 sm:text-3xl">আমাদের অঙ্গীকার</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 md:gap-x-12">
            {PROMISES.map((column, i) => (
              <ul key={i} className="space-y-4">
                {column.map((item) => (
                  <li key={item} className="flex gap-3 text-neutral-700">
                    <CheckIcon />
                    {item}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </section>

        {/* Call to action */}
        <section className="bg-[#141217] px-6 py-14 text-center text-white sm:py-16">
          <h2 className="mx-auto max-w-2xl text-2xl font-bold leading-snug sm:text-3xl">
            আত্মবিশ্বাস আর আরামের নতুন সংজ্ঞা খুঁজে নিন জাবালুনের সাথে
          </h2>
          <p className="mt-4 text-neutral-300">আমাদের সম্পূর্ণ খিমার ও হিজাব কালেকশন ঘুরে দেখুন আজই</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/shop"
              className="rounded-full bg-[#eef6ee] px-8 py-3 font-semibold text-neutral-900 transition hover:bg-white"
            >
              কালেকশন দেখুন
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-white/60 px-8 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              যোগাযোগ করুন
            </Link>
          </div>
          <p className="mt-6 text-sm text-neutral-400">
            ইমেইল:{" "}
            <a href={`mailto:${SITE.email}`} className={`${GOLD} hover:underline`}>
              {SITE.email}
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
