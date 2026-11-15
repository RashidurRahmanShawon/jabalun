"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin/session";

export async function uploadProductImage(formData) {
  await requireAdmin();
  const supabase = getSupabaseServer();
  if (!supabase) return { error: "ডাটাবেস সংযুক্ত নেই।" };

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return { error: "কোনো ছবি ফাইল পাওয়া যায়নি।" };
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.type === "image/jpeg" ? "jpg" : "webp";
    const filename = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(filename, buffer, {
        contentType: file.type || "image/webp",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      return { error: `ছবি আপলোড ব্যর্থ হয়েছে: ${uploadError.message}` };
    }

    const { data: publicUrlData } = supabase.storage
      .from("products")
      .getPublicUrl(filename);

    return { success: true, url: publicUrlData.publicUrl };
  } catch (err) {
    console.error("Storage upload exception:", err);
    return { error: `ছবি আপলোড করা যায়নি: ${err.message}` };
  }
}

export async function upsertProduct(product) {
  await requireAdmin();
  const supabase = getSupabaseServer();
  if (!supabase) return { error: "ডাটাবেস সংযুক্ত নেই।" };

  const slug =
    product.slug ||
    product.name
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, "-")
      .replace(/[^\w\u0980-\u09FF-]+/g, "") + `-${Date.now().toString().slice(-4)}`;

  const isPublish = product.status === "published" || product.status === "publish";

  const payload = {
    name: product.name.trim(),
    slug,
    design_number: product.designNumber ? String(product.designNumber) : null,
    price: Number(product.price) || 0,
    regular_price: Number(product.regularPrice || product.price) || 0,
    category_slug: product.category,
    stock: Number(product.stock) || 0,
    description: product.description || "",
    image_url: product.image || null,
    status: isPublish ? "publish" : "draft",
  };

  try {
    if (product.id) {
      const { data, error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", product.id)
        .select()
        .single();

      if (error) return { error: error.message };
      revalidatePath("/admin/products");
      revalidatePath("/");
      revalidatePath("/shop");
      revalidatePath(`/product/${slug}`);
      return { success: true, product: data };
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert(payload)
        .select()
        .single();

      if (error) return { error: error.message };
      revalidatePath("/admin/products");
      revalidatePath("/");
      revalidatePath("/shop");
      return { success: true, product: data };
    }
  } catch (err) {
    return { error: err.message };
  }
}

export async function removeProduct(productId) {
  await requireAdmin();
  const supabase = getSupabaseServer();
  if (!supabase) return { error: "ডাটাবেস সংযুক্ত নেই।" };

  try {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) return { error: error.message };
    revalidatePath("/admin/products");
    revalidatePath("/");
    revalidatePath("/shop");
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

function revalidateProductPages(slug) {
  revalidatePath("/admin/products");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/shop");
  if (slug) revalidatePath(`/product/${slug}`);
}

// Trash (WooCommerce style): hidden from the shop, restorable. status "trash".
export async function trashProduct(productId) {
  await requireAdmin();
  const supabase = getSupabaseServer();
  if (!supabase) return { error: "ডাটাবেস সংযুক্ত নেই।" };
  const { data, error } = await supabase
    .from("products")
    .update({ status: "trash" })
    .eq("id", productId)
    .select()
    .single();
  if (error) return { error: error.message };
  revalidateProductPages(data.slug);
  return { success: true, product: data };
}

// Restore from trash: comes back as a draft (like WordPress) so it is not published by accident
export async function restoreProduct(productId) {
  await requireAdmin();
  const supabase = getSupabaseServer();
  if (!supabase) return { error: "ডাটাবেস সংযুক্ত নেই।" };
  const { data, error } = await supabase
    .from("products")
    .update({ status: "draft" })
    .eq("id", productId)
    .select()
    .single();
  if (error) return { error: error.message };
  revalidateProductPages(data.slug);
  return { success: true, product: data };
}

// Duplicate: same details, new slug, saved as a draft
export async function duplicateProduct(productId) {
  await requireAdmin();
  const supabase = getSupabaseServer();
  if (!supabase) return { error: "ডাটাবেস সংযুক্ত নেই।" };
  const { data: source, error: readError } = await supabase.from("products").select("*").eq("id", productId).single();
  if (readError || !source) return { error: readError?.message || "পণ্যটি পাওয়া যায়নি।" };

  const copy = {
    name: `${source.name} (কপি)`,
    slug: `${source.slug}-copy-${Date.now().toString(36)}`,
    design_number: source.design_number,
    price: source.price,
    regular_price: source.regular_price,
    image_url: source.image_url,
    description: source.description,
    short_description: source.short_description,
    category_slug: source.category_slug,
    stock: source.stock,
    status: "draft",
  };
  const { data, error } = await supabase.from("products").insert(copy).select().single();
  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  return { success: true, product: data };
}
