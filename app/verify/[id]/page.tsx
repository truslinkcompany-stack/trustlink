import crypto from "crypto";
import { admin, BUCKET, RecordRow, UUID_RE } from "@/lib/supabase";
import { fmtCoords, fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Проверка сертификата — ДоброСлед", robots: { index: false } };

type Verdict = { ok: true; rec: RecordRow; photoUrl: string | null } | { ok: false; reason: string };

async function verify(id: string): Promise<Verdict> {
  if (!UUID_RE.test(id)) return { ok: false, reason: "Некорректный идентификатор." };
  const sb = admin();
  const { data: rec, error } = await sb.from("records").select("*").eq("id", id).maybeSingle<RecordRow>();
  if (error) return { ok: false, reason: "Сервис проверки временно недоступен. Повторите позже." };
  if (!rec) return { ok: false, reason: "Записи с таким идентификатором нет." };
  if (rec.status === "revoked") return { ok: false, reason: "Запись отозвана." };

  const file = await sb.storage.from(BUCKET).download(rec.file_path);
  if (file.error || !file.data) return { ok: false, reason: "Файл записи недоступен: проверить контрольную сумму нельзя." };
  const hash = crypto.createHash("sha256").update(Buffer.from(await file.data.arrayBuffer())).digest("hex");
  if (hash !== rec.sha256) return { ok: false, reason: "Контрольная сумма файла не совпадает с записанной." };

  // По умолчанию фото на публичной странице не показываем (закрытое хранилище).
  // Включается переменной SHOW_PHOTO_ON_VERIFY=true: тогда выдаётся ссылка на 2 минуты.
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

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = await verify(id);

  if (!v.ok) {
    return (
      <div className="cert">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/dobrosled-logo.png" alt="ДоброСлед" className="cert-logo" />
        <h1 className="cert-title">Проверка записи</h1>
        <div className="stamp bad" role="status">
          <div className="word">НЕ ПОДТВЕРЖДЕНО</div>
          <p>{v.reason}</p>
        </div>
        <p className="lead">Если вы получили этот сертификат от организации, попросите прислать запись заново.</p>
      </div>
    );
  }

  const r = v.rec;
  const coords = fmtCoords(r.lat, r.lng, r.accuracy_m);
  return (
    <div className="cert">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/dobrosled-logo.png" alt="ДоброСлед" className="cert-logo" />
      <h1 className="cert-title">Подтверждение выполнения</h1>
      <div className="stamp ok" role="status">
        <div className="word">ПОДТВЕРЖДЕНО</div>
        <p>Запись {r.cert_no} найдена, файл не изменялся с момента получения.</p>
      </div>

      {v.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={v.photoUrl} alt="Фото из записи" className="cert-photo" />
      )}

      <div className="rows">
        {r.place_name && <Row label="Место" value={r.place_name} />}
        <Row label="Координаты" value={coords ?? "не получены"} />
        <Row label="Дата и время" value={fmtDateTime(r.created_at, r.client_tz)} />
        {r.device && <Row label="Устройство" value={r.device} />}
        <Row label="Способ съёмки" value="Камера страницы сервиса" />
        <Row label="Целостность файла" value="Не изменялся с момента получения" strong />
        {r.project_name && <Row label="Проект" value={r.project_name} />}
        {r.author_name && <Row label="Автор" value={r.author_name} />}
        {r.description && <Row label="Выполнено" value={r.description} />}
        <Row label="ID записи" value={r.cert_no} strong />
      </div>
      <p className="tag hash">SHA-256: {r.sha256}</p>
      <p className="note">Сертификат подтверждает, что файл получен сервисом в указанное время и не менялся с этого момента. Координаты предоставлены браузером устройства и могут быть подменены. Поля «Проект», «Автор» и «Выполнено» заполнены пользователем и сервисом не проверяются. Сервис не определяет, создано ли изображение нейросетью.</p>
    </div>
  );
}
