"use client";

import {
  BookA,
  ChevronRight,
  CircleCheck,
  ChevronsDownUp,
  ChevronsUpDown,
  LayoutGrid,
  Calculator,
  MessageCircleQuestion,
  Lightbulb,
  type LucideIcon,
  NotebookPen,
  ScrollText,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { sectionIcon } from "@/components/section-icons";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useProgress } from "@/lib/browser/use-progress";
import { cn } from "@/lib/utils";
import { lessonSections, type Lesson } from "@/lib/content/lessons";
import { sectionTree } from "@/lib/content/lesson-tree";
import { pageAddress, route } from "@/lib/routes";
import { sumBy } from "es-toolkit";

const moreLinks: { href: string; title: string; icon: LucideIcon }[] = [
  { href: route("/learn/cheatsheets"), title: "Cheatsheets", icon: ScrollText },
  { href: route("/learn/examples"), title: "Worked examples", icon: Lightbulb },
  { href: route("/glossary"), title: "Glossary", icon: BookA },
  { href: route("/drill/questions"), title: "Question drill", icon: MessageCircleQuestion },
  { href: route("/drill/product"), title: "Product drill", icon: Calculator },
  { href: route("/notebook"), title: "Notebook", icon: NotebookPen },
];

// The groups that the user opened: sections by title, and pages with sub-pages by slug.
// This is a preference of this browser only.
const OPEN_KEY = "charrette:learn-open";
const listeners = new Set<() => void>();
const NONE: string[] = [];
let memory = "[]";
let cache: { raw: string; value: string[] } = { raw: "[]", value: NONE };

function readOpen(): string[] {
  let raw = memory;
  try {
    raw = localStorage.getItem(OPEN_KEY) ?? memory;
  } catch {
    // Storage is not available. Use the value in memory.
  }
  // Return the same array while the text is the same, so React does not draw again.
  if (raw !== cache.raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      cache = { raw, value: Array.isArray(parsed) ? parsed.map(String) : NONE };
    } catch {
      cache = { raw, value: NONE };
    }
  }
  return cache.value;
}

function writeOpen(keys: string[]) {
  memory = JSON.stringify(keys);
  try {
    localStorage.setItem(OPEN_KEY, memory);
  } catch {
    // Storage is not available. The value lasts for this page only.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const sectionKey = (title: string) => `section:${title}`;
const pageKey = (slug: string) => `page:${slug}`;

function PageLink({
  href,
  title,
  current,
  done,
  small = false,
}: {
  href: string;
  title: string;
  current: boolean;
  done: boolean;
  small?: boolean;
}) {
  return (
    <Link
      href={pageAddress(href)}
      aria-current={current ? "page" : undefined}
      className={cn(
        "relative block flex-1 rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground",
        small && "py-0.5 text-[0.8125rem]",
        // A bar on the guide line marks the current page.
        current &&
          "bg-muted font-medium text-foreground before:absolute before:inset-y-1 before:-left-[10px] before:w-0.5 before:rounded-full before:bg-primary",
      )}
    >
      <span className="flex items-start justify-between gap-1.5">
        {title}
        {done && (
          <CircleCheck className="mt-[0.2rem] size-3.5 shrink-0 text-primary" aria-label="Done" />
        )}
      </span>
    </Link>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <ChevronRight
      className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-90")}
      aria-hidden
    />
  );
}

// The page list of the Learn area: numbered sections that open and close, with the pages indented
// under each section, and sub-pages indented one more level.
export default function LessonSidebar() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const searching = query.trim() !== "";
  const opened = useSyncExternalStore(subscribe, readOpen, () => NONE);
  const done = useProgress();
  const total = sumBy(lessonSections, (section) => section.pages.length);
  const doneTotal = sumBy(
    lessonSections,
    (section) => section.pages.filter((page) => done[page.slug]).length,
  );

  const toggle = (key: string, open: boolean) =>
    writeOpen(open ? opened.filter((item) => item !== key) : [...opened, key]);
  const hrefOf = (page: Lesson) => `/learn/${page.slug}`;

  return (
    <nav aria-label="Learn" className="space-y-4 text-sm">
      <Input
        type="search"
        placeholder="Find a page"
        aria-label="Find a page"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="bg-background"
      />

      <div className="flex items-center justify-between gap-2">
        <Link
          href="/learn"
          aria-current={pathname === "/learn" ? "page" : undefined}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1 font-medium hover:bg-muted",
            pathname === "/learn" && "bg-muted",
          )}
        >
          <LayoutGrid className="size-4 text-primary" aria-hidden /> All lessons
        </Link>
        <span className="flex text-muted-foreground">
          <button
            type="button"
            aria-label="Open all sections"
            title="Open all sections"
            className="rounded-md p-1.5 hover:bg-muted hover:text-foreground"
            onClick={() =>
              writeOpen([
                ...lessonSections.map((section) => sectionKey(section.title)),
                ...lessonSections.flatMap((section) =>
                  section.pages.filter((page) => !page.parent).map((page) => pageKey(page.slug)),
                ),
              ])
            }
          >
            <ChevronsUpDown className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Close all sections"
            title="Close all sections"
            className="rounded-md p-1.5 hover:bg-muted hover:text-foreground"
            onClick={() => writeOpen([])}
          >
            <ChevronsDownUp className="size-4" aria-hidden />
          </button>
        </span>
      </div>

      <div className="space-y-1 px-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span className="tabular-nums">
            {doneTotal} / {total} done
          </span>
        </div>
        <Progress
          aria-label="Lessons done"
          value={doneTotal}
          max={total}
          getAriaValueText={() => `${doneTotal} of ${total} lessons done`}
        />
      </div>

      <ol className="space-y-1">
        {lessonSections.map((section, index) => {
          const nodes = sectionTree(section.pages, query);
          if (nodes.length === 0) return null;
          const here = section.pages.some((page) => hrefOf(page) === pathname);
          const key = sectionKey(section.title);
          // The section of the current page and all sections in a search are always open.
          const open = searching || here || opened.includes(key);
          const Icon = sectionIcon(section.title);
          const listId = `learn-section-${index}`;
          return (
            <li key={section.title}>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={listId}
                disabled={searching || here}
                onClick={() => toggle(key, open)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left font-semibold hover:bg-muted disabled:cursor-default disabled:hover:bg-transparent",
                  here && "text-foreground",
                )}
              >
                <span className="w-4 shrink-0 text-xs tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                <Icon className="size-4 shrink-0 text-primary" aria-hidden />
                <span className="flex-1">{section.title}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {section.pages.filter((page) => done[page.slug]).length}/{section.pages.length}
                </span>
                <Chevron open={open} />
              </button>
              {open && (
                <ul id={listId} className="mt-0.5 mb-2 ml-[1.1rem] space-y-0.5 border-l pl-2">
                  {nodes.map(({ page, children }) => {
                    const childHere = children.some((child) => hrefOf(child) === pathname);
                    const subKey = pageKey(page.slug);
                    const subOpen =
                      searching ||
                      childHere ||
                      hrefOf(page) === pathname ||
                      opened.includes(subKey);
                    return (
                      <li key={page.slug}>
                        <div className="flex items-center">
                          <PageLink
                            href={hrefOf(page)}
                            title={page.title}
                            current={hrefOf(page) === pathname}
                            done={Boolean(done[page.slug])}
                          />
                          {children.length > 0 && (
                            <button
                              type="button"
                              aria-expanded={subOpen}
                              aria-label={`${subOpen ? "Close" : "Open"} the pages under ${page.title}`}
                              title={`${children.length} pages`}
                              className="flex items-center gap-0.5 rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                              onClick={() => toggle(subKey, subOpen)}
                            >
                              {children.length} <Chevron open={subOpen} />
                            </button>
                          )}
                        </div>
                        {children.length > 0 && subOpen && (
                          <ul className="mt-0.5 mb-1 ml-3 space-y-0.5 border-l border-dashed pl-2">
                            {children.map((child) => (
                              <li key={child.slug}>
                                <PageLink
                                  small
                                  href={hrefOf(child)}
                                  title={child.title}
                                  current={hrefOf(child) === pathname}
                                  done={Boolean(done[child.slug])}
                                />
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ol>

      {searching &&
        lessonSections.every((section) => sectionTree(section.pages, query).length === 0) && (
          <p className="px-2 text-muted-foreground">No page has this name.</p>
        )}

      <div className="space-y-1 border-t pt-3">
        <h2 className="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          More
        </h2>
        <ul className="space-y-0.5">
          {moreLinks.map((item) => {
            // A worked example is a page under the list of examples.
            const here = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={pageAddress(item.href)}
                  aria-current={here ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground",
                    here && "bg-muted font-medium text-foreground",
                  )}
                >
                  <item.icon className="size-4 shrink-0" aria-hidden />
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
