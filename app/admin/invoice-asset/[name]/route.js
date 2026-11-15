// Admin-only invoice assets (signatures + licensed signature font).
// Kept in /private instead of /public so they are never downloadable without an admin login.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { isAdmin } from "@/lib/admin/session";

const FILES = {
  "signature-yasin.png": "image/png",
  "signature-rajib.png": "image/png",
  "LaBoutier.ttf": "font/ttf",
};

export async function GET(_request, { params }) {
  if (!(await isAdmin())) return new Response("Not found", { status: 404 });
  const { name } = await params;
  const type = FILES[name];
  if (!type) return new Response("Not found", { status: 404 });

  const file = await readFile(path.join(process.cwd(), "private", "invoice", name));
  return new Response(file, {
    headers: { "Content-Type": type, "Cache-Control": "private, max-age=86400" },
  });
}
