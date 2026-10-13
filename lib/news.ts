import fs from "fs";
import path from "path";

export type Post = { slug: string; title: string; date: string; summary: string; body: string };

const DIR = path.join(process.cwd(), "content", "news");

function parse(slug: string, raw: string): Post {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const meta: Record<string, string> = {};
  let body = raw;
  if (m) {
    body = m[2];
    for (const line of m[1].split(/\r?\n/)) {
      const i = line.indexOf(":");
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return { slug, title: meta.title || slug, date: meta.date || "", summary: meta.summary || "", body: body.trim() };
}

export function allPosts(): Post[] {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parse(f.replace(/\.md$/, ""), fs.readFileSync(path.join(DIR, f), "utf8")))
    .sort((a, b) => b.date.localeCompare(a.date) || b.slug.localeCompare(a.slug));}

export function getPost(slug: string): Post | null {
  if (!/^[a-z0-9-]+$/i.test(slug)) return null;
  const file = path.join(DIR, `${slug}.md`);
  return fs.existsSync(file) ? parse(slug, fs.readFileSync(file, "utf8")) : null;
}