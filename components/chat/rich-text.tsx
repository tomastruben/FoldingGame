import { Fragment, type ReactNode } from "react";

/**
 * Tiny inline markdown renderer: **bold**, *italic*, `code`.
 * Intentionally dependency-free — the agent only emits these three.
 */
export function RichText({ text }: { text: string }) {
  return <>{render(text)}</>;
}

function render(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(regex)) {
    const index = m.index ?? 0;
    if (index > last) {
      nodes.push(<Fragment key={key++}>{text.slice(last, index)}</Fragment>);
    }
    const tok = m[0];
    if (tok.startsWith("**")) {
      nodes.push(
        <strong key={key++} className="font-semibold text-foreground">
          {tok.slice(2, -2)}
        </strong>
      );
    } else if (tok.startsWith("`")) {
      nodes.push(
        <code
          key={key++}
          className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground"
        >
          {tok.slice(1, -1)}
        </code>
      );
    } else {
      nodes.push(
        <em key={key++} className="italic text-muted-foreground">
          {tok.slice(1, -1)}
        </em>
      );
    }
    last = index + tok.length;
  }
  if (last < text.length) nodes.push(<Fragment key={key++}>{text.slice(last)}</Fragment>);
  return nodes;
}
