"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Badge, Button, Card, EmptyState, Field, Toggle, inputClass } from "./ui";
import { Modal } from "./Modal";

function CategoryForm({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    const slug = form.id.trim();
    if (!form.name.trim() || !/^[a-z0-9-]+$/.test(slug)) {
      setError("নাম দিন, আর slug-এ শুধু ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও - ব্যবহার করুন।");
      return;
    }
    onSave({ ...form, id: slug });
  }

  return (
    <Modal open title={initial.isNew ? "নতুন ক্যাটাগরি" : "ক্যাটাগরি সম্পাদনা"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="নাম *" htmlFor="cat-name">
          <input id="cat-name" className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="slug *" htmlFor="cat-slug" hint="URL-এ ব্যবহৃত হয়, যেমন instant-ready-hijab">
          <input id="cat-slug" className={inputClass} value={form.id} disabled={!initial.isNew} onChange={(e) => setForm({ ...form, id: e.target.value })} />
        </Field>
        <Field label="বিবরণ" htmlFor="cat-desc">
          <textarea id="cat-desc" rows={2} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>বাতিল</Button>
          <Button type="submit">সংরক্ষণ করুন</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DiscountsManager({ initialCategories, initialRule }) {
  const [categories, setCategories] = useState(initialCategories);
  const [editing, setEditing] = useState(null);
  const [rule, setRule] = useState(initialRule);
  const [draft, setDraft] = useState({ minQty: String(initialRule.minQty), percent: String(initialRule.percent) });
  const [notice, setNotice] = useState("");

  const categoryName = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  function saveRule() {
    const minQty = Number(draft.minQty);
    const percent = Number(draft.percent);
    if (!Number.isInteger(minQty) || minQty < 1 || !(percent > 0 && percent <= 90)) {
      setNotice("সংখ্যা অন্তত ১ আর শতাংশ ১ থেকে ৯০-এর মধ্যে দিন।");
      return;
    }
    setRule({ ...rule, minQty, percent });
    setNotice("নমুনা — নিয়মটি শুধু এই পেজে বদলেছে। সাইটের আসল ছাড় (৩টি বা তার বেশি হিজাবে ১০%) বদলায়নি।");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card
        title="ক্যাটাগরি"
        action={
          <Button onClick={() => setEditing({ id: "", name: "", description: "", isNew: true })}>
            <Plus className="h-4 w-4" /> নতুন
          </Button>
        }
      >
        {categories.length > 0 ? (
          <ul className="divide-y divide-neutral-100">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-neutral-900">{c.name}</p>
                  <p className="truncate text-xs text-neutral-500">{c.id} · {c.description || "বিবরণ নেই"}</p>
                </div>
                <button type="button" onClick={() => setEditing(c)} aria-label={`${c.name} সম্পাদনা`} className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100">
                  <Pencil className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="কোনো ক্যাটাগরি নেই" />
        )}
      </Card>

      <Card title="ছাড়ের নিয়ম">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-neutral-900">
                {rule.minQty}টি বা তার বেশি হিজাবে {rule.percent}%
              </p>
              <p className="mt-1 text-xs text-neutral-600">প্রযোজ্য: {categoryName[rule.category] ?? rule.category}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={rule.active ? "green" : "neutral"}>{rule.active ? "সক্রিয়" : "নিষ্ক্রিয়"}</Badge>
              <Toggle checked={rule.active} onChange={(on) => setRule({ ...rule, active: on })} label="ছাড় সক্রিয়" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="ন্যূনতম সংখ্যা" htmlFor="rule-qty">
              <input id="rule-qty" type="number" min="1" className={inputClass} value={draft.minQty} onChange={(e) => setDraft({ ...draft, minQty: e.target.value })} />
            </Field>
            <Field label="ছাড় (%)" htmlFor="rule-percent">
              <input id="rule-percent" type="number" min="1" max="90" className={inputClass} value={draft.percent} onChange={(e) => setDraft({ ...draft, percent: e.target.value })} />
            </Field>
          </div>
          <Button className="mt-4" onClick={saveRule}>নিয়ম হালনাগাদ করুন</Button>
        </div>
        {notice ? <p className="mt-3 text-sm text-amber-800">{notice}</p> : null}
      </Card>

      {editing ? (
        <CategoryForm
          key={editing.id || "new"}
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(category) => {
            setCategories((list) =>
              editing.isNew ? [...list, { id: category.id, name: category.name, description: category.description }] : list.map((c) => (c.id === category.id ? { ...c, ...category } : c))
            );
            setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}
