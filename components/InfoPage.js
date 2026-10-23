// Simple placeholder layout shared by the policy pages
export default function InfoPage({ title }) {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">{title}</h1>
        <p className="mt-5 text-lg text-neutral-600">এই অংশটি শীঘ্রই আপডেট করা হবে।</p>
      </div>
    </main>
  );
}
