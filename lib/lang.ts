import { cookies, headers } from "next/headers";
import type { Lang } from "./dict";

/** Язык: cookie `lang`, иначе по Accept-Language (русский по умолчанию). */
export async function getLang(): Promise<Lang> {
  const c = (await cookies()).get("lang")?.value;
  if (c === "ru" || c === "en") return c;
  const al = (await headers()).get("accept-language") ?? "";
  return /^\s*en/i.test(al) ? "en" : "ru";
}