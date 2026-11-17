import { DISCOUNT_CATEGORY_SLUG } from "@/lib/discount";
import CollectionPage from "../ready-hijab-all-collection/collection";

// Static route: takes priority over app/product/[slug]
export const revalidate = 300;

export const metadata = {
  title: "খিমার প্লাজু সেট — সব ডিজাইন | জাবালুন",
  description: "খিমার ও প্লাজুর মানানসই সেট — সব ডিজাইন এক পেজে। ডেলিভারি চার্জ ফ্রি, পণ্য হাতে পেয়ে মূল্য পরিশোধ।",
};

const CONFIG = {
  slug: "khimar-plazu-set",
  tag: "খিমার প্লাজু সেট",
  titleWithPrice: (price) => `খিমার প্লাজু সেট। মূল্য ${price} টাকা। ডেলিভারী চার্জ ফ্রি।`,
  titleNoPrice: "খিমার প্লাজু সেট। ডেলিভারী চার্জ ফ্রি।",
  hijab: false, // the 10% offer is for ready hijab only
  more: { slug: DISCOUNT_CATEGORY_SLUG, title: "আরও রেডি হিজাব" },
};

export default function KhimarPlazuCollectionPage() {
  return <CollectionPage config={CONFIG} />;
}
