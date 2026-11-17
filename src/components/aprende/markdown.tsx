import type { ReactNode } from "react";

// Renderizador mínimo del markdown de los capítulos: títulos, citas, tablas,
// listas, párrafos y, en línea, negrita, cursiva, código y enlaces. Devuelve
// elementos de React (nada de HTML crudo). Los tramos en chino llevan
// lang="zh-Hans" y la fuente de hanzi.

const CJK = /([㐀-鿿豈-﫿]+)/g;

function cjk(text: string, key: string): ReactNode[] {
  return text.split(CJK).map((part, i) =>
    i % 2 === 1 ? <span key={`${key}-${i}`} lang="zh-Hans" className="font-hanzi">{part}</span> : part,
  );
}

function inline(text: string, key = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|`(.+?)`|\[(.+?)\]\((https?:\/\/.+?)\)|(?<![*\w])\*(?!\*)(.+?)\*(?![*\w])/g;
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(re)) {
    const at = m.index ?? 0;
    if (at > last) out.push(...cjk(text.slice(last, at), `${key}${n}t`));
    const k = `${key}${n++}`;
    if (m[1] !== undefined) out.push(<strong key={k}>{inline(m[1], k)}</strong>);
    else if (m[2] !== undefined) out.push(<code key={k} className="rounded bg-muted px-1 py-0.5 text-[0.9em]">{m[2]}</code>);
    else if (m[3] !== undefined) out.push(<a key={k} href={m[4]} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">{m[3]}</a>);
    else out.push(<em key={k}>{inline(m[5], k)}</em>);
    last = at + m[0].length;
  }
  if (last < text.length) out.push(...cjk(text.slice(last), `${key}end`));
  return out;
}

const isListLine = (l: string) => /^(\d+\.|-) /.test(l);

export function Markdown({ source }: { source: string }) {
  const lines = source.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const l = lines[i];
    const k = `b${key++}`;
    if (/^#{2,3} /.test(l)) {
      const level = l.match(/^#+/)![0].length;
      const text = l.replace(/^#+ /, "");
      blocks.push(level === 2
        ? <h2 key={k} className="mt-8 text-xl font-semibold">{inline(text, k)}</h2>
        : <h3 key={k} className="mt-6 text-lg font-semibold">{inline(text, k)}</h3>);
      i++;
    } else if (l.startsWith(">")) {
      const quote: string[] = [];
      while (lines[i]?.startsWith(">")) quote.push(lines[i++].replace(/^> ?/, ""));
      blocks.push(
        <blockquote key={k} className="rounded-lg border border-border border-l-4 border-l-primary bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          {inline(quote.join(" "), k)}
        </blockquote>,
      );
    } else if (l.startsWith("|")) {
      const rows: string[] = [];
      while (lines[i]?.startsWith("|")) rows.push(lines[i++]);
      const cells = (r: string) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const [head, , ...body] = rows;
      const labels = cells(head);
      // Sin barra de desplazamiento: en pantallas anchas la tabla ajusta el
      // texto a varias líneas; en estrechas cada fila pasa a ser una tarjeta
      // con el nombre de la columna sobre cada dato.
      blocks.push(
        <div key={k} className="rounded-lg border border-border">
          <table className="w-full text-left text-sm max-sm:block">
            <thead className="bg-muted/60 max-sm:sr-only">
              <tr>{labels.map((c, j) => <th key={j} scope="col" className="px-3 py-2 font-medium">{inline(c, `${k}h${j}`)}</th>)}</tr>
            </thead>
            <tbody className="max-sm:block">
              {body.map((r, ri) => (
                <tr key={ri} className="border-t border-border align-top first:border-t-0 max-sm:block max-sm:space-y-2 max-sm:px-3 max-sm:py-3 sm:first:border-t">
                  {cells(r).map((c, j) => (
                    <td
                      key={j}
                      data-label={labels[j]}
                      className="px-3 py-2 max-sm:block max-sm:p-0 max-sm:before:mb-0.5 max-sm:before:block max-sm:before:text-xs max-sm:before:font-medium max-sm:before:text-muted-foreground max-sm:before:content-[attr(data-label)]"
                    >
                      {inline(c, `${k}r${ri}c${j}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
    } else if (isListLine(l)) {
      const ordered = /^\d/.test(l);
      const items: string[] = [];
      while (lines[i] !== undefined && (isListLine(lines[i]) || /^ {2,}\S/.test(lines[i]))) {
        if (isListLine(lines[i])) items.push(lines[i].replace(/^(\d+\.|-) /, ""));
        else items[items.length - 1] += ` ${lines[i].trim()}`;
        i++;
      }
      const Tag = ordered ? "ol" : "ul";
      blocks.push(
        <Tag key={k} className={ordered ? "ml-6 list-decimal space-y-1" : "ml-6 list-disc space-y-1"}>
          {items.map((it, j) => <li key={j}>{inline(it, `${k}l${j}`)}</li>)}
        </Tag>,
      );
    } else if (l.trim() === "") {
      i++;
    } else {
      const para: string[] = [];
      while (lines[i] !== undefined && lines[i].trim() && !/^(#|>|\|)/.test(lines[i]) && !isListLine(lines[i])) para.push(lines[i++]);
      blocks.push(<p key={k}>{inline(para.join(" "), k)}</p>);
    }
  }
  return <div className="flex flex-col gap-4 leading-relaxed">{blocks}</div>;
}
