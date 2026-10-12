import Capture from "./capture";
import Partners from "@/components/Partners";

export default function Home() {
  return (
    <>
      <Partners />
      <h1>Подтвердите выполненную работу фотографией</h1>
      <p className="lead">Снимите фото прямо здесь. Сервис зафиксирует время, место и «отпечаток» файла, а вы получите PDF-сертификат с QR-кодом.</p>
      <Capture />
    </>
  );
}
