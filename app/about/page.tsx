import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang";

export async function generateMetadata() {
  return { title: dict[await getLang()].about.metaTitle };
}

export default async function About() {
  const lang = await getLang();
  if (lang === "en") {
    return (
      <div className="prose">
        <h1>About the project</h1>
        <p>DobroSled turns an ordinary photo from an event, a project or an aid distribution into a verified record. The service records the time, the location and a digital fingerprint of the file at the moment it is uploaded.</p>
        <p>Today social projects confirm results with photos and add the date and place by hand. A funder has to take it on trust, and the team has to collect pictures from chats and folders before every report.</p>
        <p>This approach has two weak points. First, a photo cannot show that it was taken at that time and for that project: an old picture from an archive, or a shot from another event, can be attached to a new report. Second, neural networks can produce a realistic “photo of an aid distribution” in a minute, and it is getting harder to tell it from a real one by eye.</p>
        <h2>How it works</h2>
        <ul>
          <li>An employee or volunteer opens the link and takes a photo right in the service. Uploading a ready-made image from the gallery is not possible: only a camera shot is accepted. Optionally, they can add a project, an author name and a comment.</li>
          <li>The service records the time and the coordinates.</li>
          <li>The platform creates a certificate with a QR code. It can be attached to a report, and anyone can check that the file has not changed since it was uploaded.</li>
        </ul>
        <p>We confirm that the file has not changed since upload, and that the time and place were recorded at upload.</p>
        <h2>Who it is for</h2>
        <p>NGOs, social and volunteer projects, foundations and corporate volunteering programmes.</p>
      </div>
    );
  }
  return (
    <div className="prose">
      <h1>О проекте</h1>
      <p>ДоброСлед превращает обычную фотографию с мероприятия, проекта или раздачи помощи в подтверждённую запись. Сервис фиксирует время, место и «отпечаток» файла в момент загрузки.</p>
      <p>Сейчас социальные проекты подтверждают результаты фотографиями, а дату и место подписывают руками. Фонду приходится верить на слово, а команде перед каждым отчётом собирать снимки из чатов и папок.</p>
      <p>У такого подхода две слабые стороны. Первая: по снимку нельзя проверить, что он сделан именно тогда и именно по этому проекту. Старую фотографию из архива или кадр с другого мероприятия можно приложить к новому отчёту. Вторая: нейросети создают реалистичную «фотографию с раздачи помощи» за минуту, и на глаз её всё труднее отличить от настоящей.</p>
      <h2>Как это работает</h2>
      <ul>
        <li>Сотрудник или волонтёр открывает ссылку и снимает фото прямо в сервисе. Загрузить готовое изображение из галереи нельзя: принимается только снимок с камеры. При желании можно указать проект, имя автора и комментарий.</li>
        <li>Сервис записывает время и координаты.</li>
        <li>Платформа создаёт сертификат с QR-кодом. Его можно приложить к отчёту, а любой человек может проверить, что файл не менялся с момента загрузки.</li>
      </ul>
      <p>Мы подтверждаем, что файл не изменялся с момента загрузки, а время и место зафиксированы при загрузке.</p>
      <h2>Для кого</h2>
      <p>НКО, социальные и волонтёрские проекты, фонды, программы корпоративного волонтёрства.</p>
    </div>
  );
}