import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { admin, RecordRow, UUID_RE } from "@/lib/supabase";
import { checkToken } from "@/lib/token";
import { siteUrl } from "@/lib/site";
import { dict, fmt } from "@/lib/dict";
import { getLang } from "@/lib/lang";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function Result({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t: token } = await searchParams;
  if (!UUID_RE.test(id) || !checkToken(id, token)) notFound();

  const lang = await getLang();
  const t = dict[lang].result;
  const { data: rec } = await admin().from("records").select("*").eq("id", id).maybeSingle<RecordRow>();
  if (!rec) notFound();

  const verifyUrl = `${siteUrl()}/verify/${rec.id}`;
  const qr = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 440, errorCorrectionLevel: "M" });

  return (
    <div className="cert center">
      <h1 style={{ fontSize: 28, marginTop: 0 }}>{t.title}</h1>
      <div className="tag">{t.certNo}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{rec.cert_no}</div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="qr" src={qr} alt={fmt(t.qrAlt, { id: rec.cert_no })} />
      <p className="tag">{t.scanHint}</p>
      <a className="btn" href={`/api/records/${rec.id}/pdf?t=${token}&lang=${lang}`}>{t.download}</a>
      <a className="btn ghost" href={`/verify/${rec.id}`}>{t.openVerify}</a>
      <p className="note" style={{ textAlign: "left" }}>{t.saveNote}</p>
      <a href="/">{t.another}</a>
    </div>
  );
}