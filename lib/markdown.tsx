import React from "react";

/** Минимальный рендер markdown для новостей: ## и ### заголовки, - списки, таблицы, картинки ![alt](/путь), **жирный**, [ссылки](url), абзацы. */
function inline(text: string, key: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /!\[([^\]]*)\]\((\/[^)\s]+)\)|\*\*(.+?)\*\*|\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)\s]+)\)/g;
  let last = 0, i = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[2] !== undefined) {
      // eslint-disable-next-line @next/next/no-img-element
      out.push(<img key={`${key}-${i++}`} src={m[2]} alt={m[1]} loading="lazy" style={{ maxWidth: "100%", height: "auto" }} />);
    } else if (m[3] !== undefined) out.push(<strong key={`${key}-${i++}`}>{m[3]}</strong>);
    else out.push(<a key={`${key}-${i++}`} href={m[5]}>{m[4]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const cells = (line: string) => line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

export function Markdown({ source }: { source: string }) {
  const blocks = source.trim().split(/\n{2,}/);
  return (
    <>
      {blocks.map((b, i) => {
        const lines = b.split("\n").map((l) => l.trimEnd());
        if (lines.every((l) => /^[-*] /.test(l))) {
          return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.slice(2), `${i}-${j}`)}</li>)}</ul>;
        }
        if (lines.length >= 2 && lines.every((l) => l.trim().startsWith("|"))) {
          const [head, , ...body] = lines; // вторая строка: | --- | --- |
          return (
            <div className="table-wrap" key={i}>
              <table>
                <thead><tr>{cells(head).map((c, j) => <th key={j}>{inline(c, `${i}h${j}`)}</th>)}</tr></thead>
                <tbody>{body.map((r, k) => <tr key={k}>{cells(r).map((c, j) => <td key={j}>{inline(c, `${i}-${k}-${j}`)}</td>)}</tr>)}</tbody>
              </table>
            </div>
          );
        }
        const img = lines.length === 1 && lines[0].match(/^!\[([^\]]*)\]\((\/[^)\s]+)\)$/);
        if (img) {
          // eslint-disable-next-line @next/next/no-img-element
          return <figure key={i}><img src={img[2]} alt={img[1]} loading="lazy" /></figure>;
        }
        if (/^### /.test(lines[0])) return <h3 key={i}>{inline(lines[0].slice(4), `${i}`)}</h3>;
        if (/^## /.test(lines[0])) return <h2 key={i}>{inline(lines[0].slice(3), `${i}`)}</h2>;
        return <p key={i}>{inline(lines.join(" "), `${i}`)}</p>;
      })}
    </>
  );
}