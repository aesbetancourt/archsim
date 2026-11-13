"use client";

import { ArrowRight, PencilLine } from "lucide-react";
import { useEffect, useState } from "react";
import LinkButton from "@/components/LinkButton";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { type DraftSummary, listDrafts } from "@/lib/draft";

// The katas with unfinished work in this browser. The home page shows them first.
export default function InProgress({ titles }: { titles: Record<string, string> }) {
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);

  useEffect(() => {
    // The saved work is known only in the browser, after the first render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDrafts(listDrafts().filter((draft) => titles[draft.kataId]));
  }, [titles]);

  if (drafts.length === 0) return null;
  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <PencilLine className="size-5 text-primary" aria-hidden /> In progress
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {drafts.map((draft) => (
          <Card key={draft.kataId}>
            <CardHeader>
              <CardTitle>{titles[draft.kataId]}</CardTitle>
              <CardDescription>
                {draft.stepsDone} of 5 steps started
                {draft.shapes > 0 && ` · ${draft.shapes} shapes in the diagram`}
                {draft.hasNotes && " · notes"}
                {draft.savedAt && ` · saved ${new Date(draft.savedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`}
              </CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto">
              <LinkButton size="sm" href={`/kata/${draft.kataId}`}>
                Continue <ArrowRight />
              </LinkButton>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
