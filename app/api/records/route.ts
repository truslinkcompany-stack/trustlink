import crypto from "crypto";
import { NextResponse } from "next/server";
import { admin, BUCKET } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { makeToken } from "@/lib/token";
import { deviceFromUA } from "@/lib/format";
import { reverseGeocode } from "@/lib/geocode";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 5 * 1024 * 1024;

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

function num(v: FormDataEntryValue | null, min: number, max: number): number | null {
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

export async function POST(req: Request) {
  if (!rateLimit(clientIp(req), 10)) return fail("Слишком много запросов. Попробуйте позже.", 429);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Некорректный запрос.");
  }

  const photo = form.get("photo");
  if (!(photo instanceof File)) return fail("Нет фото.");
  if (photo.size === 0) return fail("Файл пустой.");
  if (photo.size > MAX_BYTES) return fail("Файл больше 5 МБ.", 413);

  // Все три текстовых поля необязательны: пустое поле в сертификат не попадает
  const projectName = String(form.get("project_name") ?? "").trim();
  const authorName = String(form.get("author_name") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  if (projectName.length > 160) return fail("Поле «Проект» длиннее 160 символов.");
  if (authorName.length > 80) return fail("Имя автора длиннее 80 символов.");
  if (description.length > 300) return fail("Комментарий длиннее 300 символов.");

  // Хеш считается от байтов, которые приняли мы
  const buf = Buffer.from(await photo.arrayBuffer());
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (!isJpeg) return fail("Принимается только JPEG.");
  const sha256 = crypto.createHash("sha256").update(buf).digest("hex");

  const lat = num(form.get("lat"), -90, 90);
  const lng = num(form.get("lng"), -180, 180);
  const accuracy = num(form.get("accuracy"), 0, 1e6);
  const hasCoords = lat !== null && lng !== null;

  const clientTimeRaw = String(form.get("client_time") ?? "");
  const clientTime = clientTimeRaw && !isNaN(Date.parse(clientTimeRaw)) ? new Date(clientTimeRaw).toISOString() : null;
  const tzRaw = String(form.get("client_tz") ?? "");
  let clientTz: string | null = null;
  try {
    if (tzRaw) {
      new Intl.DateTimeFormat("ru-RU", { timeZone: tzRaw });
      clientTz = tzRaw;
    }
  } catch {
    clientTz = null;
  }

  const placeName = hasCoords ? await reverseGeocode(lat as number, lng as number) : null;

  const sb = admin();
  const id = crypto.randomUUID();
  const now = new Date();
  const filePath = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${id}.jpg`;

  const up = await sb.storage.from(BUCKET).upload(filePath, buf, { contentType: "image/jpeg", upsert: false });
  if (up.error) {
    console.error("upload", up.error);
    return fail("Не удалось сохранить файл.", 500);
  }

  const ins = await sb
    .from("records")
    .insert({
      id,
      client_time: clientTime,
      client_tz: clientTz,
      lat: hasCoords ? lat : null,
      lng: hasCoords ? lng : null,
      accuracy_m: hasCoords ? accuracy : null,
      place_name: placeName,
      sha256,
      file_path: filePath,
      project_name: projectName || null,
      author_name: authorName || null,
      description: description || null,
      device: deviceFromUA(req.headers.get("user-agent") ?? ""),
      user_agent: (req.headers.get("user-agent") ?? "").slice(0, 300),
    })
    .select("id, cert_no")
    .single();

  if (ins.error || !ins.data) {
    console.error("insert", ins.error);
    await sb.storage.from(BUCKET).remove([filePath]); // не оставляем файл без записи
    return fail("Не удалось создать запись.", 500);
  }

  return NextResponse.json({ id: ins.data.id, cert_no: ins.data.cert_no, token: makeToken(ins.data.id) });
}
