import { notFound } from "next/navigation";
import Link from "next/link";
import { getPost } from "@/lib/news";

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  return (
    <article className="prose">
      <Link href="/news">← Все новости</Link>
      <h1>{post.title}</h1>
      <div className="tag" style={{ marginBottom: 16 }}>{post.date}</div>
      {post.body.split(/\n{2,}/).map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </article>
  );
}
