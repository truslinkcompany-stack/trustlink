import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ДоброСлед",
  description: "Фото с проверяемым временем и местом: сертификат с QR-кодом для отчётов НКО.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <header className="top">
          <div className="top-in">
            <Link href="/" className="brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/dobrosled-logo.png" alt="ДоброСлед" className="brandimg" />
            </Link>
            <nav aria-label="Основная навигация">
              <Link href="/">Снять фото</Link>
              <Link href="/about">О проекте</Link>
              <Link href="/news">Новости</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
