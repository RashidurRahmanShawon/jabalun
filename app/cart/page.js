import CartView from "./CartView";

export const metadata = {
  title: "কার্ট | জাবালুন",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-bold text-neutral-900">আপনার কার্ট</h1>
        <CartView />
      </div>
    </main>
  );
}
