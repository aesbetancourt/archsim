"use client";

import {
  ArrowRight,
  CircleCheck,
  Hash,
  Lightbulb,
  Search,
  Table2,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { sectionIcon } from "@/components/section-icons";
import { Input } from "@/components/ui/input";
import type { Cheatsheet, LessonLink, SheetBlock } from "@/lib/content/cheatsheets";
import { stem } from "@/lib/content/search";
import { useProgress } from "@/lib/browser/use-progress";
import { pageAddress } from "@/lib/routes";

// Keep the parts of a block that match the search words. A table keeps the rows that match.
function filterBlock(block: SheetBlock, words: string[]): SheetBlock | null {
  const matches = (...texts: (string | undefined)[]) => {
    const text = texts.join(" ").toLowerCase();
    return words.every((word) => text.includes(word));
  };
  if (words.length === 0 || matches(block.title)) return block;
  switch (block.type) {
    case "choose": {
      const items = block.items.filter((item) => matches(item.when, item.use, item.link.title));
      return items.length ? { ...block, items } : null;
    }
    case "rules": {
      const items = block.items.filter((item) => matches(item.text, item.link.title));
      return items.length ? { ...block, items } : null;
    }
    case "numbers": {
      const items = block.items.filter((item) => matches(item.label, item.value, item.note));
      return items.length ? { ...block, items } : null;
    }
    case "table": {
      const rows = block.rows.filter((row) => matches(...row));
      return rows.length ? { ...block, rows } : null;
    }
  }
}

function Source({ link }: { link: LessonLink }) {
  return (
    <Link
      href={pageAddress(link.href)}
      title={`Read more: ${link.title}`}
      aria-label={`Read more: ${link.title}`}
      className="inline-flex shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-primary"
    >
      <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  );
}

const blockIcon = { choose: Lightbulb, rules: TriangleAlert, numbers: Hash, table: Table2 };

function Block({ block }: { block: SheetBlock }) {
  const Icon = blockIcon[block.type];
  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-2 font-semibold">
        <Icon className="size-4 text-primary" aria-hidden /> {block.title}
      </h3>

      {block.type === "choose" && (
        <ul className="divide-y-2 rounded-base border bg-card">
          {block.items.map((item) => (
            <li
              key={item.when}
              className="grid gap-1 px-3 py-2 sm:grid-cols-[1fr_auto_minmax(0,0.8fr)_auto] sm:items-center sm:gap-3"
            >
              <span className="text-muted-foreground">{item.when}</span>
              <ArrowRight className="hidden size-4 text-primary sm:block" aria-hidden />
              <span className="font-medium">{item.use}</span>
              <Source link={item.link} />
            </li>
          ))}
        </ul>
      )}

      {block.type === "rules" && (
        <ul className="space-y-1.5">
          {block.items.map((item) => (
            <li key={item.text} className="flex items-start gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              <span className="flex-1">{item.text}</span>
              <Source link={item.link} />
            </li>
          ))}
        </ul>
      )}

      {block.type === "numbers" && (
        <dl className="grid gap-2 sm:grid-cols-2">
          {block.items.map((item) => (
            <div key={item.label} className="flex gap-2 rounded-base border bg-card px-3 py-2">
              <div className="flex-1">
                <dd className="font-mono text-lg font-semibold tabular-nums">{item.value}</dd>
                <dt>{item.label}</dt>
                {item.note && <p className="text-xs text-muted-foreground">{item.note}</p>}
              </div>
              <Source link={item.link} />
            </div>
          ))}
        </dl>
      )}

      {block.type === "table" && (
        <div className="overflow-x-auto rounded-base border bg-card">
          <table className="w-full text-left text-sm leading-6">
            <thead>
              <tr>
                {block.columns.map((column) => (
                  <th key={column} className="border-b bg-muted/50 px-3 py-2 font-medium">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.join("|")}>
                  {row.map((cell, index) => (
                    <td
                      key={index}
                      className={
                        index === 0
                          ? "border-b px-3 py-2 align-top font-medium"
                          : "border-b px-3 py-2 align-top"
                      }
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="flex items-center justify-end gap-1 px-3 py-1 text-xs text-muted-foreground">
            Read more <Source link={block.link} />
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * All cheatsheets on one page, with a filter that searches every entry.
 * @returns The filter and the cheatsheets, with the entries that match.
 */
export default function CheatsheetView({ sheets }: { sheets: Cheatsheet[] }) {
  const [query, setQuery] = useState("");
  const words = query.toLowerCase().split(/\s+/).filter(Boolean).map(stem);
  const done = useProgress();

  const shown = sheets
    .map((sheet) => ({
      ...sheet,
      blocks: sheet.blocks
        .map((block) => filterBlock(block, words))
        .filter((block): block is SheetBlock => block !== null),
    }))
    .filter((sheet) => sheet.blocks.length > 0);

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-2 space-y-3 bg-background/95 px-2 py-3 backdrop-blur">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            aria-label="Filter the cheatsheets"
            placeholder="Filter, for example: cache, retry, saga, 99.9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>
        <nav aria-label="Sections" className="flex flex-wrap gap-1.5">
          {sheets.map((sheet, index) => {
            const Icon = sectionIcon(sheet.section);
            const present = shown.some((item) => item.id === sheet.id);
            return (
              <a
                key={sheet.id}
                href={`#${sheet.id}`}
                aria-disabled={!present}
                className={
                  present
                    ? "flex items-center gap-1.5 rounded-base border border-border bg-secondary-background px-2 py-1 text-xs font-medium hover:bg-main hover:text-main-foreground"
                    : "pointer-events-none flex items-center gap-1.5 rounded-base border border-dashed px-2 py-1 text-xs text-muted-foreground opacity-60"
                }
              >
                <span className="tabular-nums">{index + 1}</span>
                <Icon className="size-3.5" aria-hidden />
                {sheet.section}
              </a>
            );
          })}
        </nav>
      </div>

      {shown.length === 0 && (
        <p className="text-muted-foreground">No entry has these words. Try a shorter word.</p>
      )}

      {shown.map((sheet) => {
        const Icon = sectionIcon(sheet.section);
        const number = sheets.findIndex((item) => item.id === sheet.id) + 1;
        const finished = sheet.slugs.filter((slug) => done[slug]).length;
        return (
          <section
            key={sheet.id}
            id={sheet.id}
            aria-labelledby={`${sheet.id}-title`}
            className="scroll-mt-32 space-y-5 rounded-base border bg-secondary-background p-5 shadow-shadow"
          >
            <header className="space-y-1 border-b pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2
                  id={`${sheet.id}-title`}
                  className="flex items-center gap-2 text-xl font-semibold tracking-tight"
                >
                  <span className="text-sm text-muted-foreground tabular-nums">{number}</span>
                  <Icon className="size-5 text-primary" aria-hidden />
                  {sheet.section}
                </h2>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CircleCheck className="size-3.5" aria-hidden />
                  {finished} of {sheet.slugs.length} lessons done
                </span>
              </div>
              <p className="text-muted-foreground">{sheet.summary}</p>
            </header>
            {sheet.blocks.map((block) => (
              <Block key={block.title} block={block} />
            ))}
          </section>
        );
      })}
    </div>
  );
}
