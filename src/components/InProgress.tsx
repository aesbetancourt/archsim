"use client";

import { ArrowRight, PencilLine, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import LinkButton from "@/components/LinkButton";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { clearDraft, type DraftSummary, listDrafts } from "@/lib/browser/draft";
import { saveClock } from "@/lib/browser/kata-clock";
import { saveNotesHtml } from "@/lib/browser/kata-notes";

// The katas with unfinished work in this browser. The home page shows them first.
// Each one can be continued, or removed to start the kata again from nothing.
export default function InProgress({ titles }: { titles: Record<string, string> }) {
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  // The kata to remove, while the confirmation is open.
  const [removing, setRemoving] = useState<string | null>(null);

  // Remove the answers, the notes, and the diagram of a kata, as "Start again" in the kata does.
  function remove(kataId: string) {
    clearDraft(kataId);
    saveNotesHtml(kataId, "");
    saveClock(kataId, null);
    setDrafts((current) => current.filter((draft) => draft.kataId !== kataId));
    setRemoving(null);
  }

  useEffect(() => {
    // The saved work is known only in the browser, after the first render.
    // oxlint-disable-next-line react/set-state-in-effect
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
                {draft.savedAt &&
                  ` · saved ${new Date(draft.savedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`}
              </CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto gap-2">
              <LinkButton size="sm" href={`/kata/${draft.kataId}`}>
                Continue <ArrowRight />
              </LinkButton>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRemoving(draft.kataId)}
                aria-label={`Remove the work in progress on ${titles[draft.kataId]}`}
              >
                <RotateCcw /> Remove
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <Dialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Remove the work on {removing ? titles[removing] : "this kata"}?
            </DialogTitle>
            <DialogDescription>
              This removes your answers, your notes, and your diagram for this kata, so you can
              start it again from nothing. You cannot get them back. Your reviewed attempts stay in
              the history, and your highlights stay in the notebook.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="neutral" onClick={() => setRemoving(null)}>
              Cancel
            </Button>
            <Button onClick={() => removing && remove(removing)}>
              <RotateCcw /> Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
