"use client";

import { useEffect, useState } from "react";
import { ImageOff, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { Badge, Button, Card, EmptyState, Field, TableWrap, Toggle, inputClass, td, th } from "./ui";
import { ConfirmDialog, Modal } from "./Modal";
import { num, taka } from "@/lib/admin/format";

const EMPTY = { name: "", designNumber: "", price: "", category: "", stock: "", description: "", status: "draft", image: null };

function ProductForm({ open, initial, categories, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");

  // Revoke object URLs created for the local preview
  useEffect(() => () => form.image?.startsWith("blob:") && URL.revokeObjectURL(form.image), [form.image]);

  const set = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  function pickImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("শুধু ছবি ফাইল দিন।");
      return;
    }
    setError("");
    setForm((f) => ({ ...f, image: URL.createObjectURL(file) }));
  }

  function submit(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.price || !form.category) {
      setError("নাম, দাম ও ক্যাটাগরি দিতে হবে।");
      return;
    }
    onSave({ ...form, price: Number(form.price), stock: Number(form.stock) || 0 });
  }

  return (
    <Modal open={open} title={initial.id ? "পণ্য সম্পাদনা" : "নতুন পণ্য"} onClose={onClose} size="lg">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="নাম *" htmlFor="p-name">
            <input id="p-name" className={inputClass} value={form.name} onChange={set("name")} />
          </Field>
        </div>
        <Field label="ডিজাইন নম্বর" htmlFor="p-design">
          <input id="p-design" className={inputClass} value={form.designNumber} onChange={set("designNumber")} />
        </Field>
        <Field label="দাম (৳) *" htmlFor="p-price">
          <input id="p-price" type="number" min="0" className={inputClass} value={form.price} onChange={set("price")} />
        </Field>
        <Field label="ক্যাটাগরি *" htmlFor="p-category">
          <select id="p-category" className={inputClass} value={form.category} onChange={set("category")}>
            <option value="">বেছে নিন</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="স্টক" htmlFor="p-stock">
          <input id="p-stock" type="number" min="0" className={inputClass} value={form.stock} onChange={set("stock")} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="বিবরণ" htmlFor="p-desc">
            <textarea id="p-desc" rows={3} className={inputClass} value={form.description} onChange={set("description")} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <p className="mb-1 text-sm font-medium text-neutral-700">ছবি</p>
          <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-neutral-300 p-4 hover:border-[#b45309]">
            {form.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- local preview of a picked file
              <img src={form.image} alt="প্রিভিউ" className="h-20 w-16 rounded-lg object-cover" />
            ) : (
              <span className="flex h-20 w-16 items-center justify-center rounded-lg bg-neutral-100">
                <Upload className="h-6 w-6 text-neutral-400" />
              </span>
            )}
            <span className="text-sm text-neutral-600">
              ছবি বেছে নিন <span className="block text-xs text-neutral-400">শুধু প্রিভিউ — কোথাও আপলোড হবে না</span>
            </span>
            <input type="file" accept="image/*" className="sr-only" onChange={pickImage} />
          </label>
        </div>
        <div className="flex items-center gap-3 sm:col-span-2">
          <Toggle
            checked={form.status === "published"}
            onChange={(on) => setForm((f) => ({ ...f, status: on ? "published" : "draft" }))}
            label="প্রকাশ করুন"
          />
          <span className="text-sm text-neutral-700">{form.status === "published" ? "প্রকাশিত" : "ড্রাফট"}</span>
        </div>
        {error ? <p role="alert" className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button variant="secondary" onClick={onClose}>বাতিল</Button>
          <Button type="submit">সংরক্ষণ করুন</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProductsManager({ initialProducts, categories }) {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [notice, setNotice] = useState("");

  const categoryName = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const q = query.trim().toLowerCase();
  const visible = products.filter(
    (p) =>
      (!q || p.name.toLowerCase().includes(q) || p.designNumber.includes(q)) &&
      (!category || p.category === category) &&
      (!status || p.status === status)
  );

  function save(product) {
    setProducts((list) =>
      product.id ? list.map((p) => (p.id === product.id ? { ...p, ...product } : p)) : [{ ...product, id: Date.now(), sold: 0 }, ...list]
    );
    setEditing(null);
    setNotice("পরিবর্তন শুধু এই পেজে দেখানো হচ্ছে (নমুনা) — কোথাও সংরক্ষণ হয়নি।");
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
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputClass} w-auto`} aria-label="ক্যাটাগরি ফিল্টার">
            <option value="">সব ক্যাটাগরি</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} w-auto`} aria-label="স্ট্যাটাস ফিল্টার">
            <option value="">সব স্ট্যাটাস</option>
            <option value="published">প্রকাশিত</option>
            <option value="draft">ড্রাফট</option>
          </select>
          <Button onClick={() => setEditing(EMPTY)}>
            <Plus className="h-4 w-4" /> নতুন পণ্য
          </Button>
        </div>

        {notice ? <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</p> : null}

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
                <th className={`${th} text-right`}>কাজ</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id}>
                  <td className={td}>
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- local preview only
                      <img src={p.image} alt="" className="h-12 w-9 rounded object-cover" />
                    ) : (
                      <span className="flex h-12 w-9 items-center justify-center rounded bg-amber-50 text-[10px] font-bold text-[#b45309]">
                        {p.designNumber || <ImageOff className="h-4 w-4" />}
                      </span>
                    )}
                  </td>
                  <td className={`${td} font-medium`}>{p.name}</td>
                  <td className={td}>{p.designNumber || "—"}</td>
                  <td className={td}>{taka(p.price)}</td>
                  <td className={td}>
                    <span className={p.stock <= 5 ? "font-semibold text-red-600" : ""}>{num(p.stock)}</span>
                  </td>
                  <td className={td}>{categoryName[p.category] ?? "—"}</td>
                  <td className={td}>
                    <Badge tone={p.status === "published" ? "green" : "neutral"}>{p.status === "published" ? "প্রকাশিত" : "ড্রাফট"}</Badge>
                  </td>
                  <td className={`${td} text-right`}>
                    <div className="inline-flex gap-1">
                      <button type="button" onClick={() => setEditing({ ...p, price: String(p.price), stock: String(p.stock) })} aria-label={`${p.name} সম্পাদনা`} className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setDeleting(p)} aria-label={`${p.name} মুছুন`} className="rounded-lg p-2 text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        ) : (
          <EmptyState title="কোনো পণ্য পাওয়া যায়নি" description="খোঁজ বা ফিল্টার বদলে আবার চেষ্টা করুন।" />
        )}
      </Card>

      {editing ? (
        <ProductForm
          key={editing.id ?? "new"}
          open
          initial={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="পণ্য মুছে ফেলবেন?"
        message={deleting ? `"${deleting.name}" তালিকা থেকে সরানো হবে। (নমুনা — আসলে কিছু মুছবে না)` : ""}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          setProducts((list) => list.filter((p) => p.id !== deleting.id));
          setDeleting(null);
        }}
      />
    </>
  );
}
