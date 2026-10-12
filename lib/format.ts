import type { Lang } from "./dict";

/** «14 сентября 2026 · 14:32:10 (UTC+3)» в часовом поясе устройства. */
export function fmtDateTime(iso: string, tz: string | null, lang: Lang = "ru"): string {
  const zone = tz || "UTC";
  const loc = lang === "en" ? "en-GB" : "ru-RU";
  try {
    const d = new Date(iso);
    const date = new Intl.DateTimeFormat(loc, { day: "numeric", month: "long", year: "numeric", timeZone: zone }).format(d);
    const time = new Intl.DateTimeFormat(loc, { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: zone }).format(d);
    const off = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "shortOffset" })
      .formatToParts(d).find((p) => p.type === "timeZoneName")?.value.replace("GMT", "UTC") ?? "UTC";
    return `${date.replace(" г.", "")} · ${time} (${off === "UTC" ? "UTC+0" : off})`;
  } catch {
    return new Date(iso).toISOString().replace("T", " ").slice(0, 19) + " UTC";
  }
}

export function fmtCoords(lat: number | null, lng: number | null, acc: number | null, lang: Lang = "ru"): string | null {
  if (lat == null || lng == null) return null;
  const [n, s, e, w, m] = lang === "en" ? ["N", "S", "E", "W", "m"] : ["с. ш.", "ю. ш.", "в. д.", "з. д.", "м"];
  const base = `${Math.abs(Number(lat)).toFixed(4)}° ${Number(lat) >= 0 ? n : s}, ${Math.abs(Number(lng)).toFixed(4)}° ${Number(lng) >= 0 ? e : w}`;
  return acc != null ? `${base} (±${Math.round(Number(acc))} ${m})` : base;
}

/** Упрощённое название устройства из User-Agent (точную модель iPhone браузер не сообщает). */
export function deviceFromUA(ua: string): string {
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) {
    const m = ua.match(/Android[^;)]*;\s*([^;)]+?)(?:\s+Build|\)|;)/);
    const model = m?.[1]?.trim();
    return model && model !== "K" ? `Android, ${model}` : "Android";
  }
  if (/Macintosh|Windows|Linux|CrOS/i.test(ua)) return "Desktop";
  return "Unknown";
}

/** Для показа: служебные значения переводим, остальное (iPhone, Android, старые записи) как есть. */
export function deviceLabel(device: string, map: Record<string, string>): string {
  return map[device] ?? device;
}