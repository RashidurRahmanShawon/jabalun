"use client";

import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, ImageOff, Loader2, Plus, Search, UploadCloud } from "lucide-react";
import { Badge, Button, Card, EmptyState, Field, TableWrap, Toggle, inputClass, td, th } from "./ui";
import { ConfirmDialog, Modal } from "./Modal";
import { num, taka } from "@/lib/admin/format";
import {
  duplicateProduct,
  removeProduct,
  restoreProduct,
  trashProduct,
  upsertProduct,
  uploadProductImage,
} from "@/app/admin/products/actions";
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
  const price = Number(p.price) || 0;
  return {
    ...p,
    category: cat,
    status: st,
    image: img,
    designNumber: p.designNumber ?? p.design_number ?? "",
    price,
    // Keep the original (crossed-out) price instead of overwriting it with the sale price on save
    regularPrice: Number(p.regularPrice ?? p.regular_price) || price,
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

const STATUS_TABS = [
  { id: "", label: "সব" },
  { id: "published", label: "প্রকাশিত" },
  { id: "draft", label: "ড্রাফট" },
  { id: "trash", label: "ট্র্যাশ" },
];

const STATUS_BADGE = {
  published: { tone: "green", label: "প্রকাশিত" },
  draft: { tone: "neutral", label: "ড্রাফট" },
  trash: { tone: "red", label: "ট্র্যাশে" },
};

// WooCommerce-style row links under the product name
function RowLink({ children, onClick, href, danger = false, disabled = false }) {
  const cls = `font-medium hover:underline disabled:cursor-wait disabled:opacity-50 ${danger ? "text-red-600" : "text-[#b45309]"}`;
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {children}
    </a>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

// Shown on row hover on desktop (always visible on touch screens)
function RowActions({ items }) {
  const shown = items.filter(Boolean);
  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-neutral-400 md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:focus-within:opacity-100">
      {shown.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          {i > 0 ? <span aria-hidden="true">|</span> : null}
          {item}
        </span>
      ))}
    </div>
  );
}

// Inline quick edit (name, design, prices, stock, category, status) without opening the full form
function QuickEditRow({ product, categories, onCancel, onSave }) {
  const [form, setForm] = useState({
    name: product.name,
    designNumber: product.designNumber || "",
    price: String(product.price),
    regularPrice: String(product.regularPrice || product.price),
    stock: String(product.stock),
    category: product.category,
    status: product.status === "published" ? "published" : "draft",
  });
  const [error, setError] = useState("");
  const [saving, startSaving] = useTransition();
  const set = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  function save(event) {
    event.preventDefault();
    if (!form.name.trim() || !(Number(form.price) > 0)) {
      setError("নাম আর দাম দিন।");
      return;
    }
    if (!(Number(form.stock) >= 0)) {
      setError("স্টক ০ বা তার বেশি দিন।");
      return;
    }
    setError("");
    startSaving(async () => {
      const result = await onSave({ ...product, ...form });
      if (result?.error) setError(result.error);
    });
  }

  const small = `${inputClass} py-1.5`;
  const id = (field) => `qe-${field}-${product.id}`;
  return (
    <tr className="bg-amber-50/60">
      <td colSpan={8} className="px-3 py-4">
        <form onSubmit={save}>
          <p className="mb-3 text-sm font-bold text-neutral-900">কুইক এডিট — ID {product.id}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="নাম" htmlFor={id("name")}>
              <input id={id("name")} className={small} value={form.name} onChange={set("name")} />
            </Field>
            <Field label="ডিজাইন নম্বর" htmlFor={id("design")}>
              <input id={id("design")} className={small} value={form.designNumber} onChange={set("designNumber")} />
            </Field>
            <Field label="বিক্রয় মূল্য (৳)" htmlFor={id("price")}>
              <input id={id("price")} type="number" min="0" className={small} value={form.price} onChange={set("price")} />
            </Field>
            <Field label="আসল মূল্য (৳, কাটা দাম)" htmlFor={id("regular")}>
              <input id={id("regular")} type="number" min="0" className={small} value={form.regularPrice} onChange={set("regularPrice")} />
            </Field>
            <Field label="স্টক" htmlFor={id("stock")}>
              <input id={id("stock")} type="number" min="0" className={small} value={form.stock} onChange={set("stock")} />
            </Field>
            <Field label="ক্যাটাগরি" htmlFor={id("cat")}>
              <select id={id("cat")} className={small} value={form.category} onChange={set("category")}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="স্ট্যাটাস" htmlFor={id("status")}>
              <select id={id("status")} className={small} value={form.status} onChange={set("status")}>
                <option value="published">প্রকাশিত</option>
                <option value="draft">ড্রাফট</option>
              </select>
            </Field>
          </div>
          {error ? <p role="alert" className="mt-3 text-sm text-red-600">{error}</p> : null}
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? "সংরক্ষণ হচ্ছে…" : "আপডেট"}</Button>
            <Button variant="secondary" onClick={onCancel} disabled={saving}>বাতিল</Button>
          </div>
        </form>
      </td>
    </tr>
  );
}

export default function ProductsManager({ initialProducts = [], categories = [] }) {
  const [products, setProducts] = useState(() => initialProducts.map(normalizeProduct));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState(null);
  const [quickEdit, setQuickEdit] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(null); // id of the row an action is running on
  const [notice, setNotice] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const categoryName = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const q = query.trim().toLowerCase();
  const counts = {
    "": products.filter((p) => p.status !== "trash").length,
    published: products.filter((p) => p.status === "published").length,
    draft: products.filter((p) => p.status === "draft").length,
    trash: products.filter((p) => p.status === "trash").length,
  };
  const visible = products.filter(
    (p) =>
      (!q || p.name.toLowerCase().includes(q) || String(p.designNumber || "").includes(q) || String(p.id) === q) &&
      (!category || p.category === category) &&
      (status ? p.status === status : p.status !== "trash")
  );

  const openEditor = (p) => setEditing({ ...p, price: String(p.price), stock: String(p.stock) });

  function flash(message) {
    setNotice(message);
    setTimeout(() => setNotice(""), 4000);
  }

  function replaceProduct(row) {
    const saved = normalizeProduct(row);
    setProducts((list) => {
      const idx = list.findIndex((p) => p.id === saved.id);
      if (idx < 0) return [saved, ...list];
      const copy = [...list];
      copy[idx] = saved;
      return copy;
    });
    return saved;
  }

  async function handleSave(productData) {
    const res = await upsertProduct(productData);
    if (res?.error) return res;
    replaceProduct(res.product || productData);
    setEditing(null);
    setQuickEdit(null);
    flash("✓ পণ্য সফলভাবে ডাটাবেসে সংরক্ষণ করা হয়েছে।");
    return { success: true };
  }

  async function runRowAction(product, action, message) {
    setBusy(product.id);
    const res = await action(product.id);
    setBusy(null);
    if (res?.error) {
      alert(`কাজটি করা যায়নি: ${res.error}`);
      return null;
    }
    const saved = replaceProduct(res.product);
    flash(message);
    return saved;
  }

  async function handleDuplicate(product) {
    const copy = await runRowAction(product, duplicateProduct, `✓ "${product.name}"-এর কপি ড্রাফট হিসেবে তৈরি হয়েছে।`);
    // Like WooCommerce: open the copy for editing straight away
    if (copy) openEditor(copy);
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
    flash("✓ পণ্য স্থায়ীভাবে মুছে ফেলা হয়েছে।");
  }

  return (
    <>
      <Card>
        {/* Status tabs, WooCommerce style: All | Published | Draft | Trash */}
        <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" role="navigation" aria-label="স্ট্যাটাস ফিল্টার">
          {STATUS_TABS.filter((t) => t.id !== "trash" || counts.trash > 0).map((t, i) => (
            <span key={t.id || "all"} className="inline-flex items-center gap-2">
              {i > 0 ? <span className="text-neutral-300" aria-hidden="true">|</span> : null}
              <button
                type="button"
                onClick={() => {
                  setStatus(t.id);
                  setQuickEdit(null);
                }}
                aria-pressed={status === t.id}
                className={status === t.id ? "font-bold text-neutral-900" : "text-[#b45309] hover:underline"}
              >
                {t.label} <span className="font-normal text-neutral-500">({num(counts[t.id])})</span>
              </button>
            </span>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-48 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              placeholder="নাম, ডিজাইন নম্বর বা ID দিয়ে খুঁজুন"
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

          <Button onClick={() => setEditing({ ...EMPTY, category: categories[0]?.id || EMPTY.category })}>
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
                <th className={th}>ID</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) =>
                quickEdit === p.id ? (
                  <QuickEditRow
                    key={p.id}
                    product={p}
                    categories={categories}
                    onCancel={() => setQuickEdit(null)}
                    onSave={handleSave}
                  />
                ) : (
                  <tr key={p.id} className="group transition hover:bg-neutral-50">
                    <td className={td}>
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt="" className="h-12 w-9 rounded border border-neutral-200 object-cover" />
                      ) : (
                        <span className="flex h-12 w-9 items-center justify-center rounded bg-amber-50 text-[10px] font-bold text-[#b45309]">
                          {p.designNumber || <ImageOff className="h-4 w-4" />}
                        </span>
                      )}
                    </td>
                    <td className={td}>
                      {p.status === "trash" ? (
                        <span className="font-semibold text-neutral-500">{p.name}</span>
                      ) : (
                        <button type="button" onClick={() => openEditor(p)} className="text-left font-semibold text-[#b45309] hover:underline">
                          {p.name}
                          {p.status === "draft" ? <span className="font-normal text-neutral-500"> — ড্রাফট</span> : null}
                        </button>
                      )}
                      {p.status === "trash" ? (
                        <RowActions
                          items={[
                            <span key="id" className="text-neutral-500">ID: {p.id}</span>,
                            <RowLink
                              key="restore"
                              disabled={busy === p.id}
                              onClick={() => runRowAction(p, restoreProduct, `✓ "${p.name}" ফেরত আনা হয়েছে (ড্রাফট হিসেবে)।`)}
                            >
                              Restore
                            </RowLink>,
                            <RowLink key="delete" danger disabled={busy === p.id} onClick={() => setDeleting(p)}>
                              Delete Permanently
                            </RowLink>,
                          ]}
                        />
                      ) : (
                        <RowActions
                          items={[
                            <span key="id" className="text-neutral-500">ID: {p.id}</span>,
                            <RowLink key="edit" onClick={() => openEditor(p)}>Edit</RowLink>,
                            <RowLink key="quick" onClick={() => setQuickEdit(p.id)}>Quick Edit</RowLink>,
                            <RowLink
                              key="trash"
                              danger
                              disabled={busy === p.id}
                              onClick={() => runRowAction(p, trashProduct, `"${p.name}" ট্র্যাশে সরানো হয়েছে। "ট্র্যাশ" ট্যাব থেকে ফেরত আনতে পারবেন।`)}
                            >
                              Trash
                            </RowLink>,
                            p.status === "published" && p.slug ? (
                              <RowLink key="view" href={`/product/${p.slug}`}>View</RowLink>
                            ) : null,
                            <RowLink key="dup" disabled={busy === p.id} onClick={() => handleDuplicate(p)}>
                              Duplicate
                            </RowLink>,
                          ]}
                        />
                      )}
                    </td>
                    <td className={td}>{p.designNumber || "—"}</td>
                    <td className={`${td} font-semibold`}>
                      {taka(p.price)}
                      {p.regularPrice > p.price ? (
                        <span className="ml-1 text-xs font-normal text-neutral-400 line-through">{taka(p.regularPrice)}</span>
                      ) : null}
                    </td>
                    <td className={td}>
                      <span className={p.stock <= 5 ? "font-semibold text-red-600" : ""}>{num(p.stock)}</span>
                    </td>
                    <td className={td}>{categoryName[p.category] || p.category || "—"}</td>
                    <td className={td}>
                      <Badge tone={STATUS_BADGE[p.status]?.tone ?? "neutral"}>{STATUS_BADGE[p.status]?.label ?? p.status}</Badge>
                    </td>
                    <td className={`${td} text-neutral-500`}>{p.id}</td>
                  </tr>
                )
              )}
            </tbody>
          </TableWrap>
        ) : (
          <EmptyState
            title={status === "trash" ? "ট্র্যাশ খালি" : "কোনো পণ্য পাওয়া যায়নি"}
            description={status === "trash" ? undefined : "নতুন পণ্য যোগ করুন বা ফিল্টার পরিবর্তন করুন।"}
          />
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
        title="পণ্যটি স্থায়ীভাবে মুছে ফেলতে চান?"
        message={deleting ? `"${deleting.name}" ডাটাবেস থেকে চিরতরে মুছে যাবে, আর ফেরত আনা যাবে না।` : ""}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        confirmText={isDeleting ? "মুছে ফেলা হচ্ছে…" : "হ্যাঁ, স্থায়ীভাবে মুছুন"}
      />
    </>
  );
}
