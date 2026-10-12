import React from "react";

/** Минимальный рендер markdown для новостей: ## заголовки, - списки, **жирный**, [ссылки](url), абзацы. */
function inline(text: string, key: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)\s]+)\)/g;
  let last = 0, i = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) out.push(<strong key={`${key}-${i++}`}>{m[1]}</strong>);
    else out.push(<a key={`${key}-${i++}`} href={m[3]}>{m[2]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.trim().split(/\n{2,}/);
  return (
    <>
      {blocks.map((b, i) => {
        const lines = b.split("\n").map((l) => l.trimEnd());
        if (lines.every((l) => /^[-*] /.test(l))) {
          return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.slice(2), `${i}-${j}`)}</li>)}</ul>;
        }
        if (/^## /.test(lines[0])) return <h2 key={i}>{inline(lines[0].slice(3), `${i}`)}</h2>;
        return <p key={i}>{inline(lines.join(" "), `${i}`)}</p>;
      })}
    </>
  );
}