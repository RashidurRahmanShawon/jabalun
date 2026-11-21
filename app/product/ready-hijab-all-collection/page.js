import { DISCOUNT_CATEGORY_SLUG } from "@/lib/discount";
import CollectionPage from "./collection";

// Static route: takes priority over app/product/[slug]
export const revalidate = 300;

export const metadata = {
  title: "সুতি হিজাব — সব ডিজাইন | জাবালুন",
  description:
    "ভিসকস কটন ফেব্রিকের ইনস্ট্যান্ট রেডি হিজাব — সব ডিজাইন এক পেজে। ৩টি বা তার বেশি নিলে ১০% ছাড়, ডেলিভারি চার্জ ফ্রি।",
};

const CONFIG = {
  slug: DISCOUNT_CATEGORY_SLUG,
  tag: "রেডি হিজাব",
  titleWithPrice: (price) => `সুতি হিজাব। মূল্য ${price} টাকা। ডেলিভারী চার্জ ফ্রি।`,
  titleNoPrice: "সুতি হিজাব। ডেলিভারী চার্জ ফ্রি।",
  hijab: true, // counts toward the 3+ = 10% off offer
  more: { slug: DISCOUNT_CATEGORY_SLUG, title: "আরও রেডি হিজাব" }, // same category as this page
};

export default function ReadyHijabCollectionPage() {
  return <CollectionPage config={CONFIG} />;
}
