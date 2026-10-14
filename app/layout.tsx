import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "@fontsource-variable/inter";
import "./globals.css";
import Toggles from "@/components/Toggles";
import { dict, ENABLED_LANGS } from "@/lib/dict";
import { getLang } from "@/lib/lang";
import { siteUrl } from "@/lib/site";

const SITE = "ДоброСлед";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const t = dict[lang].meta;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${t.title}: подтверждение фотоотчётов для НКО`, template: `%s | ${SITE}` },
    description: t.description,
    applicationName: SITE,
    alternates: { canonical: "/" },
    openGraph: {
      siteName: SITE,
      type: "website",
      locale: "ru_RU",
      title: `${t.title}: подтверждение фотоотчётов для НКО`,
      description: t.description,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: SITE }],
    },
    twitter: { card: "summary_large_image", title: SITE, description: t.description, images: ["/og.png"] },
    // Коды подтверждения для Google Search Console и Яндекс Вебмастера (задаются переменными в Vercel)
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
    },
  };
}
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// Тема читается из cookie в браузере до отрисовки, а не на сервере: страницы остаются статическими
const themeScript = `try{var m=document.cookie.match(/(?:^|; )theme=(light|dark)/);if(m)document.documentElement.dataset.theme=m[1]}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  const t = dict[lang];
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <header className="top">
          <div className="top-in">
            <Link href="/" className="brand" aria-label={SITE}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/dobrosled-logo.png" alt={SITE} className="logo" />
            </Link>
            <nav aria-label="Основная навигация">
              <Link href="/">{t.nav.shoot}</Link>
              <Link href="/about">{t.nav.about}</Link>
              <Link href="/news">{t.nav.news}</Link>
            </nav>
            <Toggles lang={lang} langs={ENABLED_LANGS} themeLabel={t.toggles.theme} langLabel={t.toggles.lang} />
          </div>
        </header>
        <main>{children}</main>
        <footer className="foot">{t.footer}</footer>
      </body>
    </html>
  );
}