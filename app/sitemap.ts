import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { allPosts } from "@/lib/news";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const posts = allPosts().map((p) => ({
    url: `${base}/news/${p.slug}`,
    lastModified: p.date ? new Date(p.date) : undefined,
  }));
  return [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/news`, changeFrequency: "weekly", priority: 0.8 },
    ...posts,
  ];
}