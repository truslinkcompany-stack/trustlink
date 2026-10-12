import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang";

/**
 * Блок «При поддержке» над заголовком главной.
 * Включается переменной NEXT_PUBLIC_SHOW_PARTNERS=true после разрешения организаторов.
 * Файлы: public/partners/itu.png и public/partners/huawei.png
 */
export default async function Partners() {
  if (process.env.NEXT_PUBLIC_SHOW_PARTNERS !== "true") return null;
  const lang = await getLang();
  return (
    <div className="partners">
      <span>{dict[lang].partners}</span>
      <div className="p">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/partners/itu.png" alt={lang === "ru" ? "Международный союз электросвязи" : "International Telecommunication Union"} />
        <span>{lang === "ru" ? "Международный союз электросвязи" : "International Telecommunication Union"}</span>
      </div>
      <div className="p">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/partners/huawei.png" alt="Huawei" />
      </div>
    </div>
  );
}