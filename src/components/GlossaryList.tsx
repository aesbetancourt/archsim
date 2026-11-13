"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { glossary, glossaryCategories, wikiUrl } from "@/lib/glossary";

export default function GlossaryList() {
  const [query, setQuery] = useState("");
  const words = query.trim().toLowerCase();
  const visible = glossary.filter(
    (entry) =>
      !words || entry.term.toLowerCase().includes(words) || entry.definition.toLowerCase().includes(words),
  );

  return (
    <div className="space-y-10">
      <Input
        type="search"
        placeholder="Search for a term"
        aria-label="Search for a term"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="max-w-sm bg-card"
      />
      {visible.length === 0 && <p className="text-muted-foreground">No term matches.</p>}
      {glossaryCategories.map((category) => {
        const entries = visible.filter((entry) => entry.category === category);
        if (entries.length === 0) return null;
        return (
          <section key={category} className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">{category}</h2>
            <Card className="py-0">
              <CardContent className="divide-y px-0">
                {entries.map((entry) => (
                  <div key={entry.id} id={entry.id} className="scroll-mt-6 space-y-1 px-5 py-4 target:bg-accent">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="font-medium">{entry.term}</h3>
                      {entry.wiki && (
                        <a
                          href={wikiUrl(entry.wiki)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
                        >
                          Wikipedia <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                    <p>{entry.definition}</p>
                    <p className="text-muted-foreground">Example: {entry.example}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        );
      })}
    </div>
  );
}
