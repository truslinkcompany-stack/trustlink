import { notFound } from "next/navigation";
import Link from "next/link";
import { getPost } from "@/lib/news";
import { Markdown } from "@/lib/markdown";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang";

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const lang = await getLang();
  const t = dict[lang].news;
  return (
    <article className="prose">
      <Link href="/news">{t.back}</Link>
      <h1>{post.title}</h1>
      <div className="tag" style={{ marginBottom: 16 }}>{post.date}{lang === "en" ? ` · ${t.ruOnly}` : ""}</div>
      <Markdown source={post.body} />
    </article>
  );
}