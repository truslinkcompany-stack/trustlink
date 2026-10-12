import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import "@fontsource-variable/inter";
import "./globals.css";
import Toggles from "@/components/Toggles";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang";

export async function generateMetadata(): Promise<Metadata> {
  const t = dict[await getLang()].meta;
  return { title: t.title, description: t.description };
}
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  const t = dict[lang];
  const theme = (await cookies()).get("theme")?.value;
  return (
    <html lang={lang} data-theme={theme === "light" || theme === "dark" ? theme : undefined} suppressHydrationWarning>
      <body>
        <header className="top">
          <div className="top-in">
            <Link href="/" className="brand" aria-label="ДоброСлед">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/dobrosled-logo.png" alt="ДоброСлед" className="logo" />
            </Link>
            <nav aria-label="Main">
              <Link href="/">{t.nav.shoot}</Link>
              <Link href="/about">{t.nav.about}</Link>
              <Link href="/news">{t.nav.news}</Link>
            </nav>
            <Toggles lang={lang} themeLabel={t.toggles.theme} langLabel={t.toggles.lang} />
          </div>
        </header>
        <main>{children}</main>
        <footer className="foot">{t.footer}</footer>
      </body>
    </html>
  );
}