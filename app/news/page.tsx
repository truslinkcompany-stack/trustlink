import Link from "next/link";
import { allPosts } from "@/lib/news";

export const metadata = { title: "Новости — TrustLink" };

export default function News() {
  const posts = allPosts();
  return (
    <>
      <h1>Новости</h1>
      {posts.length === 0 && <p className="lead">Пока новостей нет. Добавьте файл .md в папку content/news.</p>}
      {posts.map((p) => (
        <div className="post" key={p.slug}>
          <span className="tag">{p.date}</span>
          <Link href={`/news/${p.slug}`}>{p.title}</Link>
        </div>
      ))}
    </>
  );
}
