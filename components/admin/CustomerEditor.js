"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button, Field, inputClass } from "./ui";
import { ConfirmDialog, Modal } from "./Modal";
import { CUSTOMER_STATUSES } from "@/lib/admin/customer-status";
import { deleteCustomer, saveCustomer } from "@/app/admin/customers/actions";

const BLANK = { phone: "", name: "", address: "", status: "regular", note: "" };

function CustomerForm({ initial, isNew, onSaved, onCancel }) {
  const [form, setForm] = useState({ ...BLANK, ...initial });
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

  function submit(event) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await saveCustomer(form);
      if (result?.error) setError(result.error);
      else onSaved(result.phone);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="মোবাইল নম্বর" htmlFor="cust-phone" hint={isNew ? undefined : "নম্বর দিয়েই অর্ডারগুলো মেলানো হয়, তাই এটি বদলানো যায় না।"}>
        <input id="cust-phone" className={inputClass} value={form.phone} onChange={set("phone")} disabled={!isNew} inputMode="tel" placeholder="01XXXXXXXXX" required />
      </Field>
      <Field label="নাম" htmlFor="cust-name">
        <input id="cust-name" className={inputClass} value={form.name} onChange={set("name")} maxLength={100} required />
      </Field>
      <Field label="ঠিকানা" htmlFor="cust-address">
        <textarea id="cust-address" rows={2} className={inputClass} value={form.address} onChange={set("address")} maxLength={300} />
      </Field>
      <Field label="স্ট্যাটাস" htmlFor="cust-status">
        <select id="cust-status" className={inputClass} value={form.status} onChange={set("status")}>
          {Object.entries(CUSTOMER_STATUSES).map(([id, s]) => (
            <option key={id} value={id}>{s.label}</option>
          ))}
        </select>
      </Field>
      <Field label="নোট (শুধু অ্যাডমিন দেখবে)" htmlFor="cust-note">
        <textarea id="cust-note" rows={3} className={inputClass} value={form.note} onChange={set("note")} maxLength={1000} placeholder="যেমন: সবসময় সন্ধ্যায় কল করতে বলেছেন" />
      </Field>
      {error ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <div className="flex justify-end gap-2">
        {onCancel ? <Button variant="secondary" onClick={onCancel} disabled={pending}>বাতিল</Button> : null}
        <Button type="submit" disabled={pending}>{pending ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}</Button>
      </div>
    </form>
  );
}

// List page: "নতুন গ্রাহক" button
export function AddCustomerButton({ disabled }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={disabled} title={disabled ? "আগে migration চালাতে হবে" : undefined}>
        <Plus className="h-4 w-4" aria-hidden="true" /> নতুন গ্রাহক
      </Button>
      <Modal open={open} title="নতুন গ্রাহক যোগ করুন" onClose={() => setOpen(false)}>
        <CustomerForm
          isNew
          initial={BLANK}
          onCancel={() => setOpen(false)}
          onSaved={(phone) => {
            setOpen(false);
            router.push(`/admin/customers/${phone}`);
          }}
        />
      </Modal>
    </>
  );
}

// Detail page: edit and delete
export function CustomerActions({ customer, disabled }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function remove() {
    setConfirming(false);
    startTransition(async () => {
      const result = await deleteCustomer(customer.phone);
      if (result?.error) setError(result.error);
      else router.push("/admin/customers");
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setEditing(true)} disabled={disabled || pending}>
          <Pencil className="h-4 w-4" aria-hidden="true" /> এডিট
        </Button>
        <Button variant="danger" onClick={() => setConfirming(true)} disabled={disabled || pending}>
          <Trash2 className="h-4 w-4" aria-hidden="true" /> ডিলিট
        </Button>
      </div>
      {error ? <p role="alert" className="mt-2 text-sm text-red-600">{error}</p> : null}

      <Modal open={editing} title="গ্রাহকের তথ্য এডিট" onClose={() => setEditing(false)}>
        <CustomerForm
          initial={{ phone: customer.phone, name: customer.name, address: customer.address, status: customer.status, note: customer.note }}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      </Modal>
      <ConfirmDialog
        open={confirming}
        title="গ্রাহক মুছে ফেলবেন?"
        message={`${customer.name} (${customer.phone}) গ্রাহক তালিকা থেকে সরে যাবে। তার অর্ডারগুলো মুছবে না। এই নম্বর থেকে আবার অর্ডার এলে গ্রাহক আবার তালিকায় ফিরে আসবে।`}
        onConfirm={remove}
        onClose={() => setConfirming(false)}
      />
    </>
  );
}
