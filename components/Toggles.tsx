"use client";

import { useRouter } from "next/navigation";

const setCookie = (k: string, v: string) => {
  document.cookie = `${k}=${v}; path=/; max-age=31536000; samesite=lax`;
};

export default function Toggles({ lang, themeLabel, langLabel }: { lang: "ru" | "en"; themeLabel: string; langLabel: string }) {
  const router = useRouter();

  function switchTheme() {
    const el = document.documentElement;
    const dark = el.dataset.theme ? el.dataset.theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = dark ? "light" : "dark";
    el.dataset.theme = next;
    setCookie("theme", next);
  }

  function switchLang(l: "ru" | "en") {
    if (l === lang) return;
    setCookie("lang", l);
    router.refresh();
  }

  return (
    <div className="tools">
      <div className="seg" role="group" aria-label={langLabel}>
        {(["ru", "en"] as const).map((l) => (
          <button key={l} type="button" aria-pressed={lang === l} onClick={() => switchLang(l)}>{l.toUpperCase()}</button>
        ))}
      </div>
      <button type="button" className="iconbtn" onClick={switchTheme} aria-label={themeLabel} title={themeLabel}>
        <svg className="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
        <svg className="i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      </button>
    </div>
  );
}