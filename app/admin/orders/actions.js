"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/session";
import { deleteOrders, updateOrderStatus } from "@/lib/woo";

const ALLOWED = new Set(["pending", "processing", "on-hold", "completed", "cancelled", "refunded", "failed"]);

export async function changeOrderStatus(orderId, status) {
  await requireAdmin();
  const id = Number(orderId);
  if (!Number.isInteger(id) || id <= 0) return { error: "অর্ডার নম্বর সঠিক নয়।" };
  if (!ALLOWED.has(status)) return { error: "স্ট্যাটাসটি সঠিক নয়।" };

  const ok = await updateOrderStatus(id, status);
  if (!ok) return { error: "স্ট্যাটাস সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।" };

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin");
  return { success: true };
}

const MAX_DELETE = 200;

// Permanently deletes the selected orders (admin only)
export async function deleteOrdersAction(orderIds) {
  await requireAdmin();
  const ids = [...new Set((Array.isArray(orderIds) ? orderIds : []).map(Number))];
  if (ids.length === 0 || ids.length > MAX_DELETE || !ids.every((id) => Number.isInteger(id) && id > 0)) {
    return { error: "অর্ডার নির্বাচন সঠিক নয়।" };
  }

  const deleted = await deleteOrders(ids);
  if (deleted === null) return { error: "অর্ডার মোছা যায়নি। আবার চেষ্টা করুন।" };

  revalidatePath("/admin", "layout"); // orders, overview, customers, analytics all use orders
  return { success: true, deleted };
}
