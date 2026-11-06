import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin/session";
import { MIN_PASSWORD_LENGTH, passwordStatus } from "@/lib/admin/token";
import LoginForm from "./LoginForm";

export const metadata = { title: "লগইন" };

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");

  const status = passwordStatus();
  const notice =
    status === "missing"
      ? "অ্যাডমিন পাসওয়ার্ড সেট করা হয়নি। সার্ভারে ADMIN_PASSWORD যোগ করুন।"
      : status === "short"
        ? `ADMIN_PASSWORD অন্তত ${MIN_PASSWORD_LENGTH} অক্ষরের হতে হবে। লগইন বন্ধ আছে।`
        : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-center text-2xl font-bold text-[#b45309]">জাবালুন অ্যাডমিন</p>
        <p className="mb-6 mt-1 text-center text-sm text-neutral-500">চালিয়ে যেতে পাসওয়ার্ড দিন</p>
        <LoginForm notice={notice} />
      </div>
    </div>
  );
}
