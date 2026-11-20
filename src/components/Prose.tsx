import bash from "highlight.js/lib/languages/bash";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import protobuf from "highlight.js/lib/languages/protobuf";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import yaml from "highlight.js/lib/languages/yaml";
import Link from "next/link";
import Markdown from "react-markdown";
import rehypeHighlight, { type Options as HighlightOptions } from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { BookmarkButton } from "@/components/Bookmarks";
import CodeBlock from "@/components/CodeBlock";
import Diagram from "@/components/Diagram";
import TableFrame from "@/components/TableFrame";
import Walkthrough from "@/components/Walkthrough";
import { parseWalkthrough } from "@/lib/content/walkthrough";
import { headingId } from "@/lib/content/lessons";

// Color the code of the languages that the lessons use. Only these grammars load, so the help
// chat stays small. Diagram and walkthrough blocks are data for a component, not code.
const highlight: [typeof rehypeHighlight, HighlightOptions] = [
  rehypeHighlight,
  {
    languages: { bash, java, javascript, json, protobuf, sql, typescript, yaml },
    aliases: { bash: ["sh", "shell"], javascript: ["js"], protobuf: ["proto"], typescript: ["ts"] },
    plainText: ["diagram", "walkthrough", "text"],
  },
];

// The plain text of a part of the syntax tree, for the copy button of a code block.
type Node = { type: string; value?: string; children?: Node[] };
function nodeText(node: Node | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(nodeText).join("");
}

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
    <p role="alert" className="rounded-base border border-[#e03131] bg-card p-3 font-mono text-sm">
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
      // A lesson uses the reading font, serif or sans. The help chat stays small and sans.
      className={compact ? "space-y-2 text-sm leading-6" : "reading space-y-4"}
    >
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[highlight]}
        components={{
          h2: ({ children }) => {
            const label = text(children);
            const id = headingId(label);
            return (
              <h2 id={id} className="scroll-mt-6 border-b pb-1 pt-4 text-2xl font-semibold">
                {children}
                {/* An empty id is the whole page, so a section needs its own id. */}
                {id && <BookmarkButton anchor={id} heading={label} />}
              </h2>
            );
          },
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
            <blockquote className="border-l border-primary pl-4 text-muted-foreground">
              {children}
            </blockquote>
          ),
          // A "diagram" code block holds a diagram description in JSON. Other code blocks are code.
          pre: ({ node, children }) => {
            const first = node?.children[0];
            const className = first?.type === "element" ? String(first.properties.className) : "";
            if (/language-(diagram|walkthrough)/.test(className)) return <>{children}</>;
            const language = className.match(/language-([\w+-]+)/)?.[1] ?? "";
            return (
              <CodeBlock language={language} code={nodeText(first as Node | undefined)}>
                {children}
              </CodeBlock>
            );
          },
          code: ({ className, children }) =>
            className === "language-walkthrough" ? (
              <WalkthroughBlock source={text(children)} />
            ) : className === "language-diagram" ? (
              <Diagram spec={JSON.parse(text(children))} />
            ) : className?.includes("hljs") ? (
              // A highlighted code block. Its spans have the classes of the code theme.
              <code className={className}>{children}</code>
            ) : (
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
                {children}
              </code>
            ),
          // A table compares options. An ink rule marks the header, the first column names the
          // row, and the rows have stripes, so the eye can follow one row across.
          // A wide table scrolls to the side, so each column keeps a readable width.
          table: ({ children }) => (
            <TableFrame>
              <table className="w-full border-collapse text-left text-sm leading-6 [&_tbody_tr:hover]:bg-main/15 [&_tbody_tr:nth-child(even)]:bg-muted/50">
                {children}
              </table>
            </TableFrame>
          ),
          thead: ({ children }) => <thead className="border-b border-foreground">{children}</thead>,
          th: ({ children }) => (
            <th className="px-3 py-2.5 align-bottom font-semibold [&+th]:border-l [&+th]:border-border">
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
