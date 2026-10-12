import crypto from "crypto";

function secret() {
  const s = process.env.PDF_TOKEN_SECRET;
  if (!s) throw new Error("Не задан PDF_TOKEN_SECRET");
  return s;
}

/** Токен выдаётся только создателю записи; без него PDF (с миниатюрой фото) скачать нельзя. */
export function makeToken(id: string): string {
  return crypto.createHmac("sha256", secret()).update(id).digest("hex").slice(0, 32);
}

export function checkToken(id: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const a = Buffer.from(makeToken(id));
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
