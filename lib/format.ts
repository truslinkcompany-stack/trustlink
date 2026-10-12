/** Дата и время вида «14 сентября 2026 · 14:32 (UTC+3)» в часовом поясе устройства. */
export function fmtDateTime(iso: string, tz: string | null): string {
  const zone = tz || "UTC";
  try {
    const d = new Date(iso);
    const date = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: zone }).format(d);
    const time = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: zone }).format(d);
    const off = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "shortOffset" })
      .formatToParts(d).find((p) => p.type === "timeZoneName")?.value.replace("GMT", "UTC") ?? "UTC";
    return `${date.replace(" г.", "")} · ${time} (${off === "UTC" ? "UTC+0" : off})`;
  } catch {
    return new Date(iso).toISOString().replace("T", " ").slice(0, 19) + " UTC";
  }
}

export function fmtUtc(iso: string): string {
  return new Date(iso).toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

export function fmtCoords(lat: number | null, lng: number | null, acc: number | null): string | null {
  if (lat == null || lng == null) return null;
  const ns = Number(lat) >= 0 ? "с. ш." : "ю. ш.";
  const ew = Number(lng) >= 0 ? "в. д." : "з. д.";
  const base = `${Math.abs(Number(lat)).toFixed(4)}° ${ns}, ${Math.abs(Number(lng)).toFixed(4)}° ${ew}`;
  return acc != null ? `${base} (±${Math.round(Number(acc))} м)` : base;
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
  if (/Macintosh|Windows|Linux|CrOS/i.test(ua)) return "Компьютер";
  return "Не определено";
}
