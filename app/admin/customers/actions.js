"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/session";
import { getSupabaseServer } from "@/lib/supabase-server";
import { normalizePhone, PHONE_PATTERN } from "@/lib/phone";
import { CUSTOMER_STATUSES } from "@/lib/admin/customer-status";

const NEEDS_MIGRATION =
  "গ্রাহকের তথ্য সংরক্ষণের জন্য আগে Supabase-এ একবার migration (2026-11-17-customers.sql) চালাতে হবে।";

function missingTable(error) {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

const clean = (value, max) => String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);

function refresh(phone) {
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${phone}`);
}

// Create or update a customer's profile (orders are not touched)
export async function saveCustomer({ phone, name, address, status, note }) {
  await requireAdmin();
  const supabase = getSupabaseServer();
  if (!supabase) return { error: "ডাটাবেস সংযুক্ত নেই।" };

  const cleanPhone = normalizePhone(clean(phone, 30));
  if (!PHONE_PATTERN.test(cleanPhone)) return { error: "সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)।" };
  const cleanName = clean(name, 100);
  if (!cleanName) return { error: "নাম দিন।" };
  if (!CUSTOMER_STATUSES[status]) return { error: "স্ট্যাটাসটি সঠিক নয়।" };

  const { error } = await supabase.from("customers").upsert(
    {
      phone: cleanPhone,
      name: cleanName,
      address: clean(address, 300),
      status,
      note: String(note ?? "").trim().slice(0, 1000),
      deleted_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "phone" }
  );
  if (error) {
    console.error("Customer save failed:", error.message);
    return { error: missingTable(error) ? NEEDS_MIGRATION : "গ্রাহকের তথ্য সংরক্ষণ করা যায়নি।" };
  }
  refresh(cleanPhone);
  return { success: true, phone: cleanPhone };
}

// Hides the customer from the list. Their orders stay; a new order brings them back.
export async function deleteCustomer(phone) {
  await requireAdmin();
  const supabase = getSupabaseServer();
  if (!supabase) return { error: "ডাটাবেস সংযুক্ত নেই।" };

  const cleanPhone = normalizePhone(clean(phone, 30));
  if (!PHONE_PATTERN.test(cleanPhone)) return { error: "মোবাইল নম্বর সঠিক নয়।" };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("customers")
    .upsert({ phone: cleanPhone, deleted_at: now, updated_at: now }, { onConflict: "phone" });
  if (error) {
    console.error("Customer delete failed:", error.message);
    return { error: missingTable(error) ? NEEDS_MIGRATION : "গ্রাহক মুছে ফেলা যায়নি।" };
  }
  refresh(cleanPhone);
  return { success: true };
}
