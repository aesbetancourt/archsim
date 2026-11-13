"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { wikiSections } from "@/lib/wiki-pages";

const extraLinks = [
  { href: "/learn/examples", title: "Worked examples" },
  { href: "/glossary", title: "Glossary" },
];

export default function WikiSidebar() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const words = query.trim().toLowerCase();

  const link = (href: string, title: string) => (
    <li key={href}>
      <Link
        href={href}
        aria-current={pathname === href ? "page" : undefined}
        className={cn(
          "block rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground",
          pathname === href && "bg-muted font-medium text-foreground",
        )}
      >
        {title}
      </Link>
    </li>
  );

  return (
    <nav aria-label="Learn" className="space-y-5 text-sm">
      <Input
        type="search"
        placeholder="Find a page"
        aria-label="Find a page"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="bg-background"
      />
      <ul>{link("/learn", "Contents")}</ul>
      {wikiSections.map((section) => {
        const pages = section.pages.filter((page) => !words || page.title.toLowerCase().includes(words));
        if (pages.length === 0) return null;
        return (
          <div key={section.title} className="space-y-1">
            <h2 className="px-2 text-xs font-semibold uppercase tracking-wide text-foreground">{section.title}</h2>
            <ul>{pages.map((page) => link(`/learn/${page.slug}`, page.title))}</ul>
          </div>
        );
      })}
      <div className="space-y-1">
        <h2 className="px-2 text-xs font-semibold uppercase tracking-wide text-foreground">Practice</h2>
        <ul>{extraLinks.map((item) => link(item.href, item.title))}</ul>
      </div>
    </nav>
  );
}
