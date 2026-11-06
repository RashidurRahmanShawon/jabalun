"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { login } from "./actions";

export default function LoginForm({ notice }) {
  const [state, formAction, pending] = useActionState(login, null);
  const error = state?.error ?? notice;

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="admin-password" className="mb-1 block text-sm font-medium text-neutral-700">
          পাসওয়ার্ড
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 outline-none focus:border-[#b45309] focus:ring-1 focus:ring-[#b45309]"
        />
      </div>
      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#b45309] px-4 py-2.5 font-semibold text-white transition hover:bg-[#92400e] disabled:opacity-60"
      >
        <Lock className="h-4 w-4" aria-hidden="true" />
        {pending ? "যাচাই হচ্ছে…" : "লগইন করুন"}
      </button>
    </form>
  );
}
