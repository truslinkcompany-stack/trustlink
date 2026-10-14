/** Название места по координатам (OpenStreetMap Nominatim). Необязательно: при любой ошибке возвращает null. */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&accept-language=ru&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "DobroSled/0.1 (trustlinkcompany@gmail.com)" },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { address?: Record<string, string> };
    const a = j.address ?? {};
    const city = a.city || a.town || a.village || a.municipality || a.county || a.state;
    const parts = [city, a.country].filter(Boolean);
    return parts.length ? parts.join(", ").slice(0, 120) : null;
  } catch {
    return null;
  }
}
