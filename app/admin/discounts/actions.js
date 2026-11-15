"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/session";
import { getSupabaseServer } from "@/lib/supabase-server";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Create (isNew) or update a category. Slug is fixed once created (products link to it).
export async function saveCategory({ slug, name, description, isNew }) {
  await requireAdmin();
  const supabase = getSupabaseServer();
  if (!supabase) return { error: "ডাটাবেস সংযুক্ত নেই।" };

  const cleanSlug = String(slug || "").trim().toLowerCase();
  const cleanName = String(name || "").trim().replace(/\s+/g, " ");
  const cleanDescription = String(description || "").trim().slice(0, 500);
  if (!cleanName || cleanName.length > 80) return { error: "নাম দিন (৮০ অক্ষরের মধ্যে)।" };
  if (!SLUG.test(cleanSlug) || cleanSlug.length > 60) {
    return { error: "slug-এ শুধু ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও - ব্যবহার করুন (যেমন borkha)।" };
  }

  if (isNew) {
    const { error } = await supabase
      .from("categories")
      .insert({ slug: cleanSlug, name: cleanName, description: cleanDescription });
    if (error) {
      console.error("Category insert failed:", error.message);
      return { error: error.code === "23505" ? "এই slug আগে থেকেই আছে, অন্য slug দিন।" : "ক্যাটাগরি সংরক্ষণ করা যায়নি।" };
    }
  } else {
    const { error } = await supabase
      .from("categories")
      .update({ name: cleanName, description: cleanDescription })
      .eq("slug", cleanSlug);
    if (error) {
      console.error("Category update failed:", error.message);
      return { error: "ক্যাটাগরি সংরক্ষণ করা যায়নি।" };
    }
  }

  revalidatePath("/admin/discounts");
  revalidatePath("/admin/products");
  revalidatePath("/admin");
  return { success: true, category: { id: cleanSlug, name: cleanName, description: cleanDescription } };
}
