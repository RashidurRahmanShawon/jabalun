"use client";

import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, ImageOff, Loader2, Pencil, Plus, Search, Trash2, UploadCloud } from "lucide-react";
import { Badge, Button, Card, EmptyState, Field, TableWrap, Toggle, inputClass, td, th } from "./ui";
import { ConfirmDialog, Modal } from "./Modal";
import { num, taka } from "@/lib/admin/format";
import { upsertProduct, removeProduct, uploadProductImage } from "@/app/admin/products/actions";
import { compressProductImage } from "@/lib/image-compressor";

const EMPTY = {
  name: "",
  designNumber: "",
  price: "",
  category: "instant-ready-hijab",
  stock: "50",
  description: "",
  status: "published",
  image: "",
};

function normalizeProduct(p) {
  const cat = p.category || p.category_slug || p.categories?.[0]?.id || "instant-ready-hijab";
  const st = p.status === "publish" ? "published" : p.status || "draft";
  const img = p.image || p.image_url || p.images?.[0]?.src || "";
  return {
    ...p,
    category: cat,
    status: st,
    image: img,
    price: Number(p.price) || 0,
    stock: p.stock ?? p.stock_quantity ?? 50,
  };
}

function ProductForm({ open, initial, categories, onClose, onSave }) {
  const [form, setForm] = useState(() => normalizeProduct(initial));
  const [pendingFile, setPendingFile] = useState(null);
  const [compressionStats, setCompressionStats] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Clean up object preview URLs
  useEffect(() => () => form.image?.startsWith("blob:") && URL.revokeObjectURL(form.image), [form.image]);

  const set = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  async function handleFilePick(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("দয়া করে ছবি ফাইল সিলেক্ট করুন (JPG, PNG, WebP)।");
      return;
    }

    setError("");
    setIsCompressing(true);

    try {
      // Compress under 250KB without visual quality loss
      const result = await compressProductImage(file, { maxKb: 250, maxDimension: 1600 });
      setPendingFile(result.file);
      setForm((f) => ({ ...f, image: result.previewUrl }));
      setCompressionStats({
        original: result.originalKb,
        compressed: result.compressedKb,
        saved: result.savedPercent,
      });
    } catch (err) {
      setError(`ছবি কম্প্রেস করা যায়নি: ${err.message}`);
    } finally {
      setIsCompressing(false);
    }
  }

  function submit(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.price || !form.category) {
      setError("পণ্যের নাম, দাম ও ক্যাটাগরি দিতে হবে।");
      return;
    }
    setError("");

    startTransition(async () => {
      try {
        let finalImageUrl = form.image;

        // Upload newly compressed image to Supabase Storage if picked
        if (pendingFile) {
          setUploadStatus("ছবি স্টোরেজে আপলোড হচ্ছে...");
          const formData = new FormData();
          formData.append("file", pendingFile);

          const uploadRes = await uploadProductImage(formData);
          if (uploadRes.error) {
            setError(uploadRes.error);
            setUploadStatus("");
            return;
          }
          finalImageUrl = uploadRes.url;
        }

        setUploadStatus("পণ্য ডাটাবেসে সংরক্ষণ হচ্ছে...");
        const res = await onSave({
          ...form,
          image: finalImageUrl,
          price: Number(form.price),
          stock: Number(form.stock) || 0,
        });

        if (res?.error) {
          setError(res.error);
          setUploadStatus("");
        }
      } catch (err) {
        setError(`সংরক্ষণ করা যায়নি: ${err.message}`);
        setUploadStatus("");
      }
    });
  }

  return (
    <Modal open={open} title={initial.id ? "পণ্য সম্পাদনা" : "নতুন পণ্য যোগ করুন"} onClose={onClose} size="lg">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="পণ্যের নাম *" htmlFor="p-name">
            <input
              id="p-name"
              required
              placeholder="যেমন: ইনস্ট্যান্ট রেডি হিজাব - 415"
              className={inputClass}
              value={form.name}
              onChange={set("name")}
            />
          </Field>
        </div>

        <Field label="ডিজাইন নম্বর" htmlFor="p-design">
          <input
            id="p-design"
            placeholder="যেমন: 415"
            className={inputClass}
            value={form.designNumber || ""}
            onChange={set("designNumber")}
          />
        </Field>

        <Field label="দাম (৳) *" htmlFor="p-price">
          <input
            id="p-price"
            type="number"
            min="0"
            required
            placeholder="যেমন: 790"
            className={inputClass}
            value={form.price}
            onChange={set("price")}
          />
        </Field>

        <Field label="ক্যাটাগরি *" htmlFor="p-category">
          <select id="p-category" className={inputClass} value={form.category} onChange={set("category")}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="স্টক পরিমাণ" htmlFor="p-stock">
          <input
            id="p-stock"
            type="number"
            min="0"
            className={inputClass}
            value={form.stock}
            onChange={set("stock")}
          />
        </Field>

        {/* Compressed Image Upload Box */}
        <div className="sm:col-span-2">
          <p className="mb-1 text-sm font-medium text-neutral-800">পণ্যের ছবি (স্বয়ংক্রিয়ভাবে &lt;২৫০KB কম্প্রেস হবে)</p>
          
          <label className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 p-6 text-center hover:border-[#b45309] hover:bg-neutral-50/50 cursor-pointer transition">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFilePick}
              disabled={isCompressing || isPending}
            />

            {isCompressing ? (
              <div className="flex flex-col items-center gap-2 py-4 text-amber-700">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm font-semibold">কোয়ালিটি অক্ষুণ্ণ রেখে ছবি কম্প্রেস করা হচ্ছে (&lt; 250KB)...</span>
              </div>
            ) : form.image ? (
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.image}
                  alt="প্রিভিউ"
                  className="h-28 w-20 rounded-lg border border-neutral-200 object-cover shadow-sm"
                />
                <div className="text-left flex-1">
                  {compressionStats ? (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-xs text-green-800 space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-sm text-green-900">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        সফলভাবে কম্প্রেস করা হয়েছে (কোয়ালিটি অক্ষুণ্ণ)
                      </p>
                      <p>
                        আসল সাইজ: <b>{compressionStats.original} KB</b> ➔ অপ্টিমাইজড সাইজ: <b>{compressionStats.compressed} KB</b>
                        <span className="ml-2 font-semibold text-green-700">(-{compressionStats.saved}%)</span>
                      </p>
                      <p className="text-[11px] text-green-700">সংরক্ষণের পর স্বয়ংক্রিয়ভাবে ডাটাবেসে আপলোড হবে।</p>
                    </div>
                  ) : (
                    <div className="text-sm text-neutral-600">
                      <p className="font-semibold text-neutral-900">বর্তমান ছবি সক্রিয় আছে</p>
                      <p className="text-xs text-neutral-500 mt-0.5">নতুন ছবি পরিবর্তন করতে এখানে ক্লিক করুন</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-3">
                <div className="rounded-full bg-amber-50 p-3 text-[#b45309]">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-neutral-800">ছবি আপলোড করতে ক্লিক করুন</span>
                  <p className="text-xs text-neutral-500 mt-1">
                    হাই-রেজোলিউশন যেকোনো ছবি দিন — সিস্টেম স্বয়ংক্রিয়ভাবে ২৫০KB-এর নিচে নিয়ে আসবে।
                  </p>
                </div>
              </div>
            )}
          </label>
        </div>

        <div className="sm:col-span-2">
          <Field label="বিবরণ" htmlFor="p-desc">
            <textarea
              id="p-desc"
              rows={3}
              placeholder="পণ্য সম্পর্কে বিস্তারিত বিবরণ লিখুন..."
              className={inputClass}
              value={form.description || ""}
              onChange={set("description")}
            />
          </Field>
        </div>

        <div className="flex items-center gap-3 sm:col-span-2">
          <Toggle
            checked={form.status === "published"}
            onChange={(on) => setForm((f) => ({ ...f, status: on ? "published" : "draft" }))}
            label="প্রকাশ করুন"
          />
          <span className="text-sm font-medium text-neutral-700">
            {form.status === "published" ? "প্রকাশিত (ওয়েবসাইটে দেখাবে)" : "ড্রাফট (লুকানো থাকবে)"}
          </span>
        </div>

        {error ? <p role="alert" className="text-sm text-red-600 sm:col-span-2 font-medium">{error}</p> : null}

        <div className="flex items-center justify-between sm:col-span-2 pt-3 border-t border-neutral-100">
          <span className="text-xs text-neutral-500 font-medium">{uploadStatus}</span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isPending || isCompressing}>
              বাতিল
            </Button>
            <Button type="submit" disabled={isPending || isCompressing}>
              {isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  সংরক্ষণ হচ্ছে…
                </span>
              ) : (
                "সংরক্ষণ করুন"
              )}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function ProductsManager({ initialProducts = [], categories = [] }) {
  const [products, setProducts] = useState(() => initialProducts.map(normalizeProduct));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [notice, setNotice] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const categoryName = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const q = query.trim().toLowerCase();
  const visible = products.filter(
    (p) =>
      (!q || p.name.toLowerCase().includes(q) || String(p.designNumber || "").includes(q)) &&
      (!category || p.category === category) &&
      (!status || p.status === status)
  );

  async function handleSave(productData) {
    const res = await upsertProduct(productData);
    if (res?.error) return res;

    const saved = normalizeProduct(res.product || productData);
    setProducts((list) => {
      const idx = list.findIndex((p) => p.id === saved.id);
      if (idx >= 0) {
        const copy = [...list];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...list];
    });

    setEditing(null);
    setNotice("✓ পণ্য সফলভাবে ডাটাবেসে সংরক্ষণ করা হয়েছে।");
    setTimeout(() => setNotice(""), 4000);
    return { success: true };
  }

  async function handleDelete() {
    if (!deleting) return;
    setIsDeleting(true);
    const res = await removeProduct(deleting.id);
    setIsDeleting(false);

    if (res?.error) {
      alert(`মুছে ফেলা যায়নি: ${res.error}`);
      return;
    }

    setProducts((list) => list.filter((p) => p.id !== deleting.id));
    setDeleting(null);
    setNotice("✓ পণ্য ডাটাবেস থেকে মুছে ফেলা হয়েছে।");
    setTimeout(() => setNotice(""), 4000);
  }

  return (
    <>
      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-48 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              placeholder="নাম বা ডিজাইন নম্বর দিয়ে খুঁজুন"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`${inputClass} pl-9`}
              aria-label="পণ্য খুঁজুন"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`${inputClass} w-auto`}
            aria-label="ক্যাটাগরি ফিল্টার"
          >
            <option value="">সব ক্যাটাগরি</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`${inputClass} w-auto`}
            aria-label="স্ট্যাটাস ফিল্টার"
          >
            <option value="">সব স্ট্যাটাস</option>
            <option value="published">প্রকাশিত</option>
            <option value="draft">ড্রাফট</option>
          </select>

          <Button onClick={() => setEditing(EMPTY)}>
            <Plus className="h-4 w-4" /> নতুন পণ্য যোগ করুন
          </Button>
        </div>

        {notice ? (
          <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-800">
            {notice}
          </p>
        ) : null}

        {visible.length > 0 ? (
          <TableWrap>
            <thead>
              <tr>
                <th className={th}>ছবি</th>
                <th className={th}>নাম</th>
                <th className={th}>ডিজাইন</th>
                <th className={th}>দাম</th>
                <th className={th}>স্টক</th>
                <th className={th}>ক্যাটাগরি</th>
                <th className={th}>স্ট্যাটাস</th>
                <th className={`${th} text-right`}>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50 transition">
                  <td className={td}>
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt="" className="h-12 w-9 rounded object-cover border border-neutral-200" />
                    ) : (
                      <span className="flex h-12 w-9 items-center justify-center rounded bg-amber-50 text-[10px] font-bold text-[#b45309]">
                        {p.designNumber || <ImageOff className="h-4 w-4" />}
                      </span>
                    )}
                  </td>
                  <td className={`${td} font-medium text-neutral-900`}>{p.name}</td>
                  <td className={td}>{p.designNumber || "—"}</td>
                  <td className={`${td} font-semibold`}>{taka(p.price)}</td>
                  <td className={td}>
                    <span className={p.stock <= 5 ? "font-semibold text-red-600" : ""}>
                      {num(p.stock)}
                    </span>
                  </td>
                  <td className={td}>{categoryName[p.category] || p.category || "—"}</td>
                  <td className={td}>
                    <Badge tone={p.status === "published" ? "green" : "neutral"}>
                      {p.status === "published" ? "প্রকাশিত" : "ড্রাফট"}
                    </Badge>
                  </td>
                  <td className={`${td} text-right`}>
                    <div className="inline-flex gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing({ ...p, price: String(p.price), stock: String(p.stock) })}
                        aria-label={`${p.name} সম্পাদনা`}
                        className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                        title="সম্পাদনা করুন"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(p)}
                        aria-label={`${p.name} মুছুন`}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        ) : (
          <EmptyState title="কোনো পণ্য পাওয়া যায়নি" description="নতুন পণ্য যোগ করুন বা ফিল্টার পরিবর্তন করুন।" />
        )}
      </Card>

      {editing ? (
        <ProductForm
          key={editing.id ?? "new"}
          open
          initial={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="পণ্যটি মুছে ফেলতে চান?"
        message={deleting ? `"${deleting.name}" ডাটাবেস থেকে স্থায়ীভাবে মুছে যাবে।` : ""}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        confirmText={isDeleting ? "মুছে ফেলা হচ্ছে…" : "হ্যাঁ, মুছুন"}
      />
    </>
  );
}
