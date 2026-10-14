import { NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/geocode";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

// Небольшой кэш в памяти: одинаковые координаты не отправляем в OpenStreetMap повторно
const cache = new Map<string, { place: string | null; at: number }>();
const TTL = 60 * 60 * 1000;

export async function GET(req: Request) {
  if (!rateLimit(`geo:${clientIp(req)}`, 30)) return NextResponse.json({ place: null }, { status: 429 });
  const sp = new URL(req.url).searchParams;
  const lat = Number(sp.get("lat")), lng = Number(sp.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ place: null }, { status: 400 });
  }
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return NextResponse.json({ place: hit.place });
  const place = await reverseGeocode(lat, lng);
  if (cache.size > 500) cache.clear();
  cache.set(key, { place, at: Date.now() });
  return NextResponse.json({ place });
}