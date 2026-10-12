import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { admin, RecordRow, UUID_RE } from "@/lib/supabase";
import { checkToken } from "@/lib/token";
import { siteUrl } from "@/lib/site";

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
  const { t } = await searchParams;
  if (!UUID_RE.test(id) || !checkToken(id, t)) notFound();

  const { data: rec } = await admin().from("records").select("*").eq("id", id).maybeSingle<RecordRow>();
  if (!rec) notFound();

  const verifyUrl = `${siteUrl()}/verify/${rec.id}`;
  const qr = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 440, errorCorrectionLevel: "M" });

  return (
    <>
      <h1>Сертификат создан</h1>
      <div className="card" style={{ textAlign: "center" }}>
        <div className="tag">Номер сертификата</div>
        <div style={{ fontSize: 28, fontWeight: 700 }}>{rec.cert_no}</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="qr" src={qr} alt={`QR-код для проверки сертификата ${rec.cert_no}`} />
        <p className="tag">Отсканируйте код, чтобы открыть страницу проверки</p>
        <a className="btn" href={`/api/records/${rec.id}/pdf?t=${t}`}>Скачать PDF</a>
        <a className="btn ghost" href={`/verify/${rec.id}`}>Открыть страницу проверки</a>
      </div>
      <p className="note">Сохраните PDF сразу: ссылка на скачивание доступна только вам. Страница проверки доступна по QR-коду всем.</p>
      <a href="/">Сделать ещё одно фото</a>
    </>
  );
}
