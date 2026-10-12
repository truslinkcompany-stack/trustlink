import Capture from "./capture";
import Partners from "@/components/Partners";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang";

export default async function Home() {
  const t = dict[await getLang()];
  return (
    <>
      <Partners />
      <section className="hero">
        <div>
          <span className="kicker">{t.home.kicker}</span>
          <h1>{t.home.h1}</h1>
          <p className="lead">{t.home.lead}</p>
          <ul className="chips">
            {t.home.chips.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </div>
        <div className="card">
          <Capture t={t.capture} />
        </div>
      </section>
      <h2>{t.home.howTitle}</h2>
      <ol className="steps">
        {t.home.steps.map((s) => (
          <li key={s.t}><b>{s.t}</b><p>{s.d}</p></li>
        ))}
      </ol>
    </>
  );
}