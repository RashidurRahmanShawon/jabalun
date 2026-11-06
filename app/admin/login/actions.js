"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  MIN_PASSWORD_LENGTH,
  SESSION_COOKIE,
  SESSION_DAYS,
  createToken,
  passwordMatches,
  passwordStatus,
} from "@/lib/admin/token";

const COOKIE_OPTIONS = {
  httpOnly: true,
  // Always secure on Vercel (HTTPS); plain http://localhost in development
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/admin",
};

export async function login(_previous, formData) {
  const status = passwordStatus();
  if (status === "missing") return { error: "অ্যাডমিন পাসওয়ার্ড সেট করা হয়নি (ADMIN_PASSWORD)।" };
  if (status === "short") {
    return { error: `অ্যাডমিন পাসওয়ার্ড অন্তত ${MIN_PASSWORD_LENGTH} অক্ষরের হতে হবে। লগইন বন্ধ আছে।` };
  }

  if (!passwordMatches(formData.get("password"))) {
    // Slow down repeated guesses
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { error: "পাসওয়ার্ড সঠিক নয়।" };
  }

  (await cookies()).set(SESSION_COOKIE, createToken(), {
    ...COOKIE_OPTIONS,
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).set(SESSION_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  redirect("/admin/login");
}
