import { NextResponse } from "next/server";
import { admin, BUCKET } from "@/lib/supabase";

// ВРЕМЕННАЯ диагностика. Откройте /api/health?s=<PDF_TOKEN_SECRET> и после отладки удалите этот файл.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function keyKind(key: string): string {
  if (!key) return "MISSING";
  if (key.startsWith("sb_secret_")) return "ok (sb_secret)";
  if (key.startsWith("sb_publishable_")) return "WRONG: это publishable-ключ, нужен secret / service_role";
  const parts = key.split(".");
  if (parts.length === 3) {
    try {
      const role = JSON.parse(Buffer.from(parts[1], "base64url").toString()).role;
      return role === "service_role" ? "ok (service_role)" : `WRONG: роль ${role}, нужна service_role`;
    } catch { /* ниже */ }
  }
  return "unknown format";
}

export async function GET(req: Request) {
  const s = new URL(req.url).searchParams.get("s");
  if (!process.env.PDF_TOKEN_SECRET || s !== process.env.PDF_TOKEN_SECRET) return new NextResponse("Not found", { status: 404 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const out: Record<string, unknown> = {
    env: {
      NEXT_PUBLIC_SUPABASE_URL: url ? (/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url) ? "ok" : `CHECK FORMAT: ${url}`) : "MISSING",
      SUPABASE_SERVICE_ROLE_KEY: keyKind(key),
      PDF_TOKEN_SECRET: "ok",
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "MISSING",
    },
  };
  if (!url || !key) return NextResponse.json(out);

  const sb = admin();
  const bucket = await sb.storage.getBucket(BUCKET);
  out.bucket = bucket.error ? `ERROR: ${bucket.error.message}` : { exists: true, public: bucket.data.public };

  const up = await sb.storage.from(BUCKET).upload("healthcheck/test.txt", Buffer.from("ok"), { contentType: "text/plain", upsert: true });
  out.upload = up.error ? `ERROR: ${up.error.message}` : "ok";
  if (!up.error) await sb.storage.from(BUCKET).remove(["healthcheck/test.txt"]);

  const tbl = await sb.from("records").select("id", { count: "exact", head: true });
  out.table = tbl.error ? `ERROR: ${tbl.error.message}` : { ok: true, rows: tbl.count };

  return NextResponse.json(out);
}