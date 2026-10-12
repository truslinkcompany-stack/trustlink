import { NextResponse } from "next/server";
import { admin, BUCKET, RecordRow, UUID_RE } from "@/lib/supabase";
import { buildCertificate } from "@/lib/pdf";
import { checkToken } from "@/lib/token";
import { siteUrl } from "@/lib/site";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sp = new URL(req.url).searchParams;
  const token = sp.get("t");
  const lang = sp.get("lang") === "en" ? "en" : "ru";
  if (!UUID_RE.test(id) || !checkToken(id, token)) return new NextResponse("Not found", { status: 404 });

  const sb = admin();
  const { data: rec } = await sb.from("records").select("*").eq("id", id).maybeSingle<RecordRow>();
  if (!rec) return new NextResponse("Not found", { status: 404 });

  const file = await sb.storage.from(BUCKET).download(rec.file_path);
  if (file.error || !file.data) return new NextResponse("File unavailable", { status: 500 });
  const photo = Buffer.from(await file.data.arrayBuffer());

  const pdf = await buildCertificate(rec, photo, `${siteUrl(req)}/verify/${rec.id}`, lang);
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${rec.cert_no}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}