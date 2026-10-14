import { cookies, headers } from "next/headers";
import { ENABLED_LANGS, type Lang } from "./dict";

/**
 * Язык интерфейса. Пока включён один язык, возвращаем его сразу, не читая cookie:
 * так страницы остаются статическими (быстрее и лучше для поисковиков).
 */
export async function getLang(): Promise<Lang> {
  if (ENABLED_LANGS.length === 1) return ENABLED_LANGS[0];
  const c = (await cookies()).get("lang")?.value;
  if (c === "ru" || c === "en") return ENABLED_LANGS.includes(c) ? c : ENABLED_LANGS[0];
  const al = (await headers()).get("accept-language") ?? "";
  const guess: Lang = /^\s*en/i.test(al) ? "en" : "ru";
  return ENABLED_LANGS.includes(guess) ? guess : ENABLED_LANGS[0];
}