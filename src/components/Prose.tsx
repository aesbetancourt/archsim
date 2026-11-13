import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Diagram from "@/components/Diagram";
import { headingId } from "@/lib/wiki-pages";

function text(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(text).join("");
  return "";
}

// Draw the Markdown text of an article in the style of the app.
// The compact form is for the help chat. Its links open in a new tab, so the canvas keeps its content.
export default function Prose({ markdown, compact = false }: { markdown: string; compact?: boolean }) {
  return (
    <div className={compact ? "space-y-2 text-sm leading-6" : "space-y-4 text-[0.9375rem] leading-7"}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 id={headingId(text(children))} className="scroll-mt-6 border-b pb-1 pt-4 text-xl font-semibold tracking-tight">
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
              <a href={href} target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">
                {children}
              </a>
            ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary pl-4 text-muted-foreground">{children}</blockquote>
          ),
          // A "diagram" code block holds a diagram description in JSON.
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children }) =>
            className === "language-diagram" ? (
              <Diagram spec={JSON.parse(text(children))} />
            ) : (
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">{children}</code>
            ),
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-base border-2 bg-card">
              <table className="w-full text-left text-sm leading-6">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border-b bg-muted/50 px-3 py-2 font-medium">{children}</th>,
          td: ({ children }) => <td className="border-b px-3 py-2 align-top">{children}</td>,
        }}
      >
        {markdown}
      </Markdown>
    </div>
  );
}
