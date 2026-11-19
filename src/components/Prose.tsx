import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Diagram from "@/components/Diagram";
import TableFrame from "@/components/TableFrame";
import Walkthrough from "@/components/Walkthrough";
import { parseWalkthrough } from "@/lib/walkthrough";
import { headingId } from "@/lib/wiki-pages";

function text(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(text).join("");
  return "";
}

// A walkthrough code block. A block that is not valid shows the problem, so the author can fix it.
function WalkthroughBlock({ source }: { source: string }) {
  const result = parseWalkthrough(source);
  if (result.ok) return <Walkthrough walkthrough={result.walkthrough} />;
  return (
    <p
      role="alert"
      className="rounded-base border-2 border-[#e03131] bg-card p-3 font-mono text-sm"
    >
      {result.error}
    </p>
  );
}

// Draw the Markdown text of an article in the style of the app.
// The compact form is for the help chat. Its links open in a new tab, so the canvas keeps its content.
export default function Prose({
  markdown,
  compact = false,
}: {
  markdown: string;
  compact?: boolean;
}) {
  return (
    <div
      className={compact ? "space-y-2 text-sm leading-6" : "space-y-4 text-[0.9375rem] leading-7"}
    >
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2
              id={headingId(text(children))}
              className="scroll-mt-6 border-b pb-1 pt-4 text-xl font-semibold tracking-tight"
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => <h3 className="pt-2 text-base font-semibold">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc space-y-1.5 pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1.5 pl-6">{children}</ol>,
          a: ({ href = "", children }) =>
            href.startsWith("/") && !compact ? (
              <Link href={href} className="text-primary underline-offset-4 hover:underline">
                {children}
              </Link>
            ) : (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                {children}
              </a>
            ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary pl-4 text-muted-foreground">
              {children}
            </blockquote>
          ),
          // A "diagram" code block holds a diagram description in JSON. Other code blocks are code.
          pre: ({ node, children }) => {
            const first = node?.children[0];
            const className = first?.type === "element" ? String(first.properties.className) : "";
            if (/language-(diagram|walkthrough)/.test(className)) return <>{children}</>;
            return (
              <pre className="overflow-x-auto rounded-base border-2 bg-card p-4 font-mono text-[0.85em] leading-6 [&_code]:bg-transparent [&_code]:p-0">
                {children}
              </pre>
            );
          },
          code: ({ className, children }) =>
            className === "language-walkthrough" ? (
              <WalkthroughBlock source={text(children)} />
            ) : className === "language-diagram" ? (
              <Diagram spec={JSON.parse(text(children))} />
            ) : (
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
                {children}
              </code>
            ),
          // A table compares options. The header has the main color, the first column names the
          // row, and the rows have stripes, so the eye can follow one row across.
          // A wide table scrolls to the side, so each column keeps a readable width.
          table: ({ children }) => (
            <TableFrame>
              <table className="w-full border-collapse text-left text-sm leading-6 [&_tbody_tr:hover]:bg-main/15 [&_tbody_tr:nth-child(even)]:bg-muted/50">
                {children}
              </table>
            </TableFrame>
          ),
          thead: ({ children }) => (
            <thead className="border-b-2 border-border bg-main text-main-foreground">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2.5 align-bottom text-xs font-semibold uppercase tracking-wide [&+th]:border-l-2 [&+th]:border-border/25">
              {children}
            </th>
          ),
          // A cell with long text gets a minimum width. A short cell, such as "A/R" in a RACI
          // matrix or "Yes", does not, so a column of short values stays narrow.
          td: ({ children }) => {
            const length = text(children).trim().length;
            const short = length > 0 && length <= 12;
            return (
              <td
                className={`border-t border-foreground/10 px-3 py-2.5 align-top transition-colors first:min-w-40 first:font-semibold [&+td]:border-l [&+td]:border-foreground/10 ${short ? "" : "min-w-36"}`}
              >
                {children}
              </td>
            );
          },
        }}
      >
        {markdown}
      </Markdown>
    </div>
  );
}
