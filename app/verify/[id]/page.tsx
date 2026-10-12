import crypto from "crypto";
import { admin, BUCKET, RecordRow, UUID_RE } from "@/lib/supabase";
import { deviceLabel, fmtCoords, fmtDateTime } from "@/lib/format";
import { dict, fmt } from "@/lib/dict";
import { getLang } from "@/lib/lang";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

type Reason = keyof typeof dict.ru.verify.reasons;
type Verdict = { ok: true; rec: RecordRow; photoUrl: string | null } | { ok: false; reason: Reason };

async function verify(id: string): Promise<Verdict> {
  if (!UUID_RE.test(id)) return { ok: false, reason: "invalidId" };
  const sb = admin();
  const { data: rec, error } = await sb.from("records").select("*").eq("id", id).maybeSingle<RecordRow>();
  if (error) return { ok: false, reason: "unavailable" };
  if (!rec) return { ok: false, reason: "notFound" };
  if (rec.status === "revoked") return { ok: false, reason: "revoked" };

  const file = await sb.storage.from(BUCKET).download(rec.file_path);
  if (file.error || !file.data) return { ok: false, reason: "fileMissing" };
  const hash = crypto.createHash("sha256").update(Buffer.from(await file.data.arrayBuffer())).digest("hex");
  if (hash !== rec.sha256) return { ok: false, reason: "hashMismatch" };

  // По умолчанию фото на публичной странице не показываем (закрытое хранилище).
  // SHOW_PHOTO_ON_VERIFY=true выдаёт ссылку на 2 минуты.
  let photoUrl: string | null = null;
  if (process.env.SHOW_PHOTO_ON_VERIFY === "true") {
    const signed = await sb.storage.from(BUCKET).createSignedUrl(rec.file_path, 120);
    photoUrl = signed.data?.signedUrl ?? null;
  }
  return { ok: true, rec, photoUrl };
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="crow">
      <div className="clabel">{label}</div>
      <div className={strong ? "cval strong" : "cval"}>{value}</div>
    </div>
  );
}

const Check = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M7.5 12.5l3 3 6-6.5" /></svg>);
const Cross = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" /></svg>);

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lang = await getLang();
  const t = dict[lang].verify;
  const v = await verify(id);

  if (!v.ok) {
    return (
      <div className="cert">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/dobrosled-logo.png" alt="ДоброСлед" className="logo" />
        <h1 className="cert-title">{t.checkTitle}</h1>
        <div className="stamp bad" role="status">
          <Cross />
          <div><div className="word">{t.bad}</div><p>{t.reasons[v.reason]}</p></div>
        </div>
        <p className="lead">{t.badLead}</p>
      </div>
    );
  }

  const r = v.rec;
  const coords = fmtCoords(r.lat, r.lng, r.accuracy_m, lang);
  return (
    <div className="cert">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/dobrosled-logo.png" alt="ДоброСлед" className="logo" />
      <h1 className="cert-title">{t.title}</h1>
      <div className="stamp ok" role="status">
        <Check />
        <div><div className="word">{t.ok}</div><p>{fmt(t.okText, { id: r.cert_no })}</p></div>
      </div>

      {v.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={v.photoUrl} alt={t.photoAlt} className="cert-photo" />
      )}

      <div className="rows">
        {r.place_name && <Row label={t.place} value={r.place_name} />}
        <Row label={t.coords} value={coords ?? t.coordsNone} />
        <Row label={t.datetime} value={fmtDateTime(r.created_at, r.client_tz, lang)} />
        {r.device && <Row label={t.device} value={deviceLabel(r.device, dict[lang].device)} />}
        <Row label={t.method} value={t.methodVal} />
        <Row label={t.integrity} value={t.integrityVal} strong />
        {r.project_name && <Row label={t.project} value={r.project_name} />}
        {r.author_name && <Row label={t.author} value={r.author_name} />}
        {r.description && <Row label={t.done} value={r.description} />}
        <Row label={t.id} value={r.cert_no} strong />
      </div>
      <p className="tag hash">SHA-256: {r.sha256}</p>
      <p className="note">{t.note}</p>
    </div>
  );
}