import fs from "fs";
import path from "path";
import { PDFDocument, PDFFont, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import sharp from "sharp";
import type { RecordRow } from "./supabase";
import { deviceLabel, fmtCoords, fmtDateTime } from "./format";
import { dict, type Lang } from "./dict";

const INK = rgb(0.08, 0.13, 0.17);
const MUTED = rgb(0.4, 0.45, 0.5);
const GREEN = rgb(0.09, 0.4, 0.23);
const GREEN_BG = rgb(0.78, 0.93, 0.84);
const PILL = rgb(0.94, 0.96, 0.98);

function wrap(text: string, font: PDFFont, size: number, max: number): string[] {
  const lines: string[] = [];
  for (const para of text.split(/\r?\n/)) {
    let cur = "";
    for (const word of para.split(/\s+/)) {
      let w = word;
      while (font.widthOfTextAtSize(w, size) > max) {
        let i = w.length;
        while (i > 1 && font.widthOfTextAtSize(w.slice(0, i), size) > max) i--;
        if (cur) { lines.push(cur); cur = ""; }
        lines.push(w.slice(0, i));
        w = w.slice(i);
      }
      const test = cur ? cur + " " + w : w;
      if (font.widthOfTextAtSize(test, size) <= max) cur = test;
      else { lines.push(cur); cur = w; }
    }
    lines.push(cur);
  }
  return lines;
}

type Row = { label: string; lines: string[]; strong?: boolean; green?: boolean };

export async function buildCertificate(rec: RecordRow, photo: Buffer, verifyUrl: string, lang: Lang = "ru"): Promise<Uint8Array> {
  const T = dict[lang].pdf;
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fontDir = path.join(process.cwd(), "public", "fonts");
  // subset: false, иначе с этим шрифтом пропадают буквы
  const regular = await pdf.embedFont(fs.readFileSync(path.join(fontDir, "NotoSans-Regular.ttf")), { subset: false });
  const bold = await pdf.embedFont(fs.readFileSync(path.join(fontDir, "NotoSans-Bold.ttf")), { subset: false });

  const PW = 595.28, PH = 841.89, M = 40, W = PW - M * 2;
  const page = pdf.addPage([PW, PH]);
  const LABEL_W = 135, VX = M + 12 + LABEL_W, VW = W - 12 - LABEL_W - 10;

  // Шапка: логотип, заголовок
  const logo = await pdf.embedPng(fs.readFileSync(path.join(process.cwd(), "public", "brand", "dobrosled-logo.png")));
  const lh = 34, lw = (logo.width / logo.height) * lh;
  let y = PH - M;
  page.drawImage(logo, { x: M, y: y - lh, width: lw, height: lh });
  y -= lh + 22;
  page.drawText(T.title, { x: M, y: y - 16, size: 22, font: bold, color: rgb(0.06, 0.15, 0.28) });
  y -= 36;
  page.drawText(T.subtitle, { x: M, y: y - 8, size: 11, font: regular, color: MUTED });
  y -= 24;

  // Строки данных. Необязательные поля пользователя попадают сюда только если заполнены.
  const rows: Row[] = [];
  if (rec.place_name) rows.push({ label: T.place, lines: wrap(rec.place_name, regular, 10.5, VW) });
  const coords = fmtCoords(rec.lat, rec.lng, rec.accuracy_m, lang);
  rows.push({ label: T.coords, lines: wrap(coords ?? T.coordsNone, regular, 10.5, VW) });
  rows.push({ label: T.datetime, lines: wrap(fmtDateTime(rec.created_at, rec.client_tz, lang), regular, 10.5, VW) });
  if (rec.device) rows.push({ label: T.device, lines: wrap(deviceLabel(rec.device, dict[lang].device), regular, 10.5, VW) });
  rows.push({ label: T.method, lines: [T.methodVal] });
  rows.push({ label: T.integrity, lines: [T.integrityVal], green: true });
  if (rec.project_name) rows.push({ label: T.project, lines: wrap(rec.project_name, regular, 10.5, VW) });
  if (rec.author_name) rows.push({ label: T.author, lines: wrap(rec.author_name, regular, 10.5, VW) });
  if (rec.description) rows.push({ label: T.done, lines: wrap(rec.description, regular, 10.5, VW) });

  const rowH = (r: Row) => Math.max(26, r.lines.length * 14 + 12);
  const rowsTotal = rows.reduce((s, r) => s + rowH(r) + 4, 0);
  const BOTTOM = 215; // ID, QR, хеш, ограничения
  const photoH = Math.max(110, Math.min(230, y - M - rowsTotal - BOTTOM));

  // Фото: целиком, без обрезки
  const thumb = await sharp(photo).rotate().resize({ width: 1100, height: 700, fit: "inside" }).jpeg({ quality: 78 }).toBuffer();
  const img = await pdf.embedJpg(thumb);
  page.drawRectangle({ x: M, y: y - photoH, width: W, height: photoH, color: rgb(0.93, 0.95, 0.96) });
  const s = Math.min(W / img.width, photoH / img.height);
  const iw = img.width * s, ih = img.height * s;
  page.drawImage(img, { x: M + (W - iw) / 2, y: y - photoH + (photoH - ih) / 2, width: iw, height: ih });
  y -= photoH + 14;

  for (const r of rows) {
    const h = rowH(r);
    page.drawRectangle({ x: M, y: y - h, width: W, height: h, color: PILL });
    page.drawText(r.label, { x: M + 12, y: y - 17, size: 9.5, font: regular, color: MUTED });
    let ty = y - 17;
    for (const line of r.lines) {
      page.drawText(line, { x: VX, y: ty, size: 10.5, font: r.green ? bold : regular, color: r.green ? GREEN : INK });
      ty -= 14;
    }
    y -= h + 4;
  }
  y -= 10;

  // ID, статус, QR
  const qrSize = 92;
  const qrPng = await QRCode.toBuffer(verifyUrl, { margin: 1, width: 400, errorCorrectionLevel: "M" });
  const qr = await pdf.embedPng(qrPng);
  page.drawImage(qr, { x: M + W - qrSize, y: y - qrSize, width: qrSize, height: qrSize });

  page.drawRectangle({ x: M, y: y - 30, width: W - qrSize - 14, height: 30, color: PILL });
  page.drawText(T.id, { x: M + 12, y: y - 19, size: 9.5, font: regular, color: MUTED });
  page.drawText(rec.cert_no, { x: VX, y: y - 19, size: 12, font: bold, color: INK });
  page.drawRectangle({ x: M, y: y - 62, width: 150, height: 26, color: GREEN_BG });
  page.drawText(T.status, { x: M + 16, y: y - 54, size: 11, font: bold, color: GREEN });
  page.drawText(T.scan, { x: M, y: y - 78, size: 9, font: regular, color: MUTED });
  y -= qrSize + 10;

  // Хеш и ссылка
  page.drawText(T.sha + rec.sha256.slice(0, 32), { x: M, y: y - 8, size: 7.5, font: regular, color: MUTED });
  page.drawText(rec.sha256.slice(32), { x: M + regular.widthOfTextAtSize(T.sha, 7.5), y: y - 18, size: 7.5, font: regular, color: MUTED });
  page.drawText(verifyUrl, { x: M, y: y - 30, size: 7.5, font: regular, color: GREEN });
  y -= 42;

  // Честные ограничения (заявка на грант: «disclose known limitations»)
  const wl = wrap(T.warn, regular, 7.5, W - 16);
  const bh = wl.length * 10 + 10;
  page.drawRectangle({ x: M, y: y - bh, width: W, height: bh, color: rgb(0.97, 0.97, 0.98), borderColor: rgb(0.86, 0.88, 0.9), borderWidth: 0.5 });
  let wy = y - 12;
  for (const l of wl) { page.drawText(l, { x: M + 8, y: wy, size: 7.5, font: regular, color: MUTED }); wy -= 10; }

  pdf.setTitle(`ДоброСлед ${rec.cert_no}`);
  pdf.setProducer("ДоброСлед / TrustLink");
  return pdf.save();
}