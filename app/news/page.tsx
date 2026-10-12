import Link from "next/link";
import { allPosts } from "@/lib/news";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang";

export async function generateMetadata() {
  return { title: dict[await getLang()].news.metaTitle };
}

export default async function News() {
  const lang = await getLang();
  const t = dict[lang].news;
  const posts = allPosts();
  return (
    <>
      <h1>{t.title}</h1>
      {lang === "en" && <p className="tag">{t.ruOnly}</p>}
      {posts.length === 0 && <p className="lead">{t.none}</p>}
      {posts.map((p) => (
        <div className="post" key={p.slug}>
          <span className="tag">{p.date}</span>
          <Link href={`/news/${p.slug}`}>{p.title}</Link>
          {p.summary && <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>{p.summary}</p>}
        </div>
      ))}
    </>
  );
}