"use client";

import { useEffect } from "react";
import { Button } from "./ui";

export function Modal({ open, title, onClose, children, footer, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="বন্ধ করুন" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className={`relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6 ${size === "lg" ? "sm:max-w-2xl" : "sm:max-w-md"}`}>
        <h2 className="mb-4 text-lg font-bold text-neutral-900">{title}</h2>
        {children}
        {footer ? <div className="mt-6 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = "মুছে ফেলুন", onConfirm, onClose }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>বাতিল</Button>
          <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-sm text-neutral-600">{message}</p>
    </Modal>
  );
}
