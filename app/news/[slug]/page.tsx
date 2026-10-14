import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { allPosts, getPost } from "@/lib/news";
import { Markdown } from "@/lib/markdown";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang";
import { siteUrl } from "@/lib/site";

export function generateStaticParams() {
  return allPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary || undefined,
    alternates: { canonical: `/news/${slug}` },
    openGraph: { type: "article", title: post.title, description: post.summary || undefined, publishedTime: post.date || undefined, url: `/news/${slug}` },
  };
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const lang = await getLang();
  const t = dict[lang].news;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    inLanguage: "ru",
    mainEntityOfPage: `${siteUrl()}/news/${slug}`,
    author: { "@type": "Organization", name: "ДоброСлед" },
    publisher: { "@type": "Organization", name: "ДоброСлед", logo: { "@type": "ImageObject", url: `${siteUrl()}/brand/dobrosled-logo.png` } },
  };
  return (
    <article className="prose">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/news">{t.back}</Link>
      <h1>{post.title}</h1>
      <div className="tag" style={{ marginBottom: 16 }}>{post.date}{lang === "en" ? ` · ${t.ruOnly}` : ""}</div>
      <Markdown source={post.body} />
    </article>
  );
}