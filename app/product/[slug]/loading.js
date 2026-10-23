export default function ProductLoading() {
  return (
    <main className="flex-1" aria-busy="true" aria-label="পণ্য লোড হচ্ছে">
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-6 sm:py-10">
        <div className="h-4 w-28 rounded bg-neutral-200" />

        <div className="mt-4 grid gap-8 md:grid-cols-2 md:gap-12">
          <div className="aspect-[3/4] rounded-2xl bg-neutral-200" />

          <div>
            <div className="h-8 w-3/4 rounded bg-neutral-200" />
            <div className="mt-4 h-7 w-40 rounded bg-neutral-200" />
            <div className="mt-6 space-y-2">
              <div className="h-4 w-full rounded bg-neutral-200" />
              <div className="h-4 w-11/12 rounded bg-neutral-200" />
              <div className="h-4 w-2/3 rounded bg-neutral-200" />
            </div>
            <div className="mt-6 h-11 w-full rounded-lg bg-neutral-100" />
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <div className="h-12 flex-1 rounded-full bg-neutral-200" />
              <div className="h-12 flex-1 rounded-full bg-neutral-300" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
