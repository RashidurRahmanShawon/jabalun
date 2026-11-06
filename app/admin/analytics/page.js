import { Clock, Eye, LogOut, Users } from "lucide-react";
import { Card, KpiCard, MockBadge, PageHeader } from "@/components/admin/ui";
import { BarList, ColumnChart, Funnel } from "@/components/admin/charts";
import { ANALYTICS } from "@/lib/admin/mock-data";
import { duration, num, percent } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "বিশ্লেষণ" };

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const { kpis, funnel, topClicks, fieldDropoff, scrollDepth, pageTime } = ANALYTICS;
  const dropTotal = fieldDropoff.reduce((sum, f) => sum + f.value, 0);

  return (
    <>
      <PageHeader
        title="বিশ্লেষণ"
        description="ক্রেতারা সাইটে কী করছেন — গত ৩০ দিন"
        actions={<MockBadge />}
      />
      <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <b>নমুনা ডেটা:</b> এই পেজের সব সংখ্যা উদাহরণ মাত্র। সাইটের ট্র্যাকার এখন ইভেন্ট পাঠায়, কিন্তু ডেটাবেস যুক্ত না হওয়া পর্যন্ত সেগুলো সংরক্ষণ বা এখানে দেখানো হয় না।
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="পেজ ভিউ" value={num(kpis.pageViews)} icon={Eye} />
        <KpiCard label="অনন্য দর্শক" value={num(kpis.uniqueVisitors)} hint="সেশন অনুযায়ী" icon={Users} />
        <KpiCard label="গড় সেশন সময়" value={duration(kpis.avgSessionSeconds)} icon={Clock} />
        <KpiCard label="বাউন্স রেট" value={percent(kpis.bounceRate)} hint="এক পেজ দেখে চলে গেছেন" icon={LogOut} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="কার্ট ফানেল">
          <Funnel steps={funnel} />
        </Card>

        <Card title="সবচেয়ে বেশি ক্লিক করা উপাদান">
          <BarList rows={topClicks.map((c) => ({ label: c.label, value: c.value }))} />
          <p className="mt-3 text-xs text-neutral-500">শুধু data-track নাম গোনা হয় — কোনো লেখা বা ইনপুটের মান নয়।</p>
        </Card>

        <Card title="চেকআউট ফর্ম ড্রপ-অফ">
          <BarList
            rows={fieldDropoff.map((f) => ({ label: f.label, value: f.value }))}
            formatValue={(v) => `${num(v)} (${percent((v / dropTotal) * 100, 0)})`}
            color="#dc2626"
          />
          <p className="mt-3 text-xs text-neutral-500">
            কোন ঘর পূরণের পর ক্রেতা অর্ডার না দিয়ে চলে গেছেন। শুধু ঘরের নাম রাখা হয়, কখনো লেখা মান নয়।
          </p>
        </Card>

        <Card title="স্ক্রল গভীরতা">
          <ColumnChart bars={scrollDepth.map((s) => ({ label: `${s.depth}%`, value: s.value }))} />
          <p className="mt-3 text-xs text-neutral-500">কত শতাংশ ভিজিটর পেজের ২৫/৫০/৭৫/১০০% পর্যন্ত দেখেছেন</p>
        </Card>

        <Card title="পেজভিত্তিক গড় সময়" className="xl:col-span-2">
          <BarList rows={pageTime.map((p) => ({ label: `${p.label} (${p.path})`, value: p.seconds }))} formatValue={duration} />
        </Card>
      </div>
    </>
  );
}
