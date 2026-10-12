/**
 * Блок «При поддержке» над заголовком главной страницы.
 * Включается переменной NEXT_PUBLIC_SHOW_PARTNERS=true, когда организаторы разрешат использовать логотипы.
 * Положите файлы: public/partners/itu.png и public/partners/huawei.png
 */
export default function Partners() {
  if (process.env.NEXT_PUBLIC_SHOW_PARTNERS !== "true") return null;
  return (
    <div className="partners" aria-label="При поддержке">
      <span>При поддержке</span>
      <div className="p">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/partners/itu.png" alt="Международный союз электросвязи" />
        <span>Международный союз электросвязи</span>
      </div>
      <div className="p">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/partners/huawei.png" alt="Huawei" />
      </div>
    </div>
  );
}
