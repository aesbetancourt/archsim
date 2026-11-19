"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

// The names of the languages, as a reader knows them.
const names: Record<string, string> = {
  sql: "SQL",
  ts: "TypeScript",
  typescript: "TypeScript",
  js: "JavaScript",
  javascript: "JavaScript",
  yaml: "YAML",
  json: "JSON",
  bash: "Bash",
  sh: "Shell",
  java: "Java",
  proto: "Protocol Buffers",
};

// A code block in a lesson: a header with the language and a copy button, then the code.
// The colors of the code come from the theme in globals.css.
export default function CodeBlock({
  language,
  code,
  children,
}: {
  language: string;
  code: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // The browser does not allow the clipboard here. The reader can still select the text.
    }
  }

  const name = names[language] ?? (language && language !== "text" ? language : "");
  return (
    // The read-aloud player skips code, so it does not read the header either.
    <div data-read-skip className="code-block overflow-hidden rounded-base border border-border">
      <div className="flex items-center justify-between border-b border-border px-3 py-1 text-xs text-muted-foreground">
        <span className="italic">{name}</span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1 rounded-base px-1.5 py-0.5 hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
          aria-label={copied ? "Copied" : "Copy the code"}
        >
          {copied ? (
            <Check className="size-3.5" aria-hidden />
          ) : (
            <Copy className="size-3.5" aria-hidden />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[0.85em] leading-6 [&_code]:bg-transparent [&_code]:p-0">
        {children}
      </pre>
    </div>
  );
}
