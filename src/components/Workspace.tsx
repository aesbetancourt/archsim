"use client";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { ChevronDown, ExternalLink, LoaderCircle, NotebookPen, PenTool } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HelpChat from "@/components/HelpChat";
import ProblemText from "@/components/ProblemText";
import SidePanel from "@/components/SidePanel";
import StyleLessonBody from "@/components/StyleLessonBody";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { Kata } from "@/lib/katas";
import { loadNotesHtml, notesText } from "@/lib/notes";
import { slimElements } from "@/lib/scene";
import { characteristics as glossary, getStyleLesson, styleLessons } from "@/lib/learn";

const Canvas = dynamic(() => import("./Canvas"), { ssr: false });

const MAX_CHARACTERISTICS = 3;

const NotesEditor = dynamic(() => import("./NotesEditor"), { ssr: false });

const styles = [...styleLessons.map((lesson) => lesson.name), "Other (explain in the rationale)"];

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Open lessons in a new tab. The canvas keeps its content.
function LessonLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" className="inline-flex items-center gap-1 text-primary hover:underline">
      {children} <ExternalLink className="size-3" />
    </a>
  );
}

function StepHeading({ number, title, hint }: { number: number; title: string; hint: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 font-medium">
        <span className="flex size-5 items-center justify-center rounded-full border-2 border-border bg-main text-[11px] font-heading text-main-foreground">
          {number}
        </span>
        {title}
      </div>
      <p className="mt-1 text-muted-foreground">{hint}</p>
    </div>
  );
}

export default function Workspace({ kata, hasExample }: { kata: Kata; hasExample: boolean }) {
  const router = useRouter();
  const api = useRef<ExcalidrawImperativeAPI | null>(null);
  const [selected, setSelected] = useState<{ name: string; why: string }[]>([]);
  // The large area shows the notepad or the canvas. A kata starts on the notepad.
  const [view, setView] = useState<"notes" | "diagram">("notes");
  const [notes, setNotes] = useState("");
  const [scope, setScope] = useState("");

  // The notes belong to this kata. The editor saves them in this browser.
  // This page keeps their plain text, for the help chat and for the saved attempt.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotes(notesText(loadNotesHtml(kata.id)));
  }, [kata.id]);

  const [style, setStyle] = useState("");
  const [rationale, setRationale] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lesson = getStyleLesson(style);
  // The canvas must measure its position again after the panel opens or closes.
  const refreshCanvas = useCallback(() => api.current?.refresh(), []);

  // Select or remove a characteristic. The limit is three.
  function toggle(name: string) {
    setSelected((current) =>
      current.some((item) => item.name === name)
        ? current.filter((item) => item.name !== name)
        : current.length < MAX_CHARACTERISTICS
          ? [...current, { name, why: "" }]
          : current,
    );
  }

  function setWhy(name: string, why: string) {
    setSelected((current) => current.map((item) => (item.name === name ? { ...item, why } : item)));
  }

  async function submit() {
    const elements = api.current?.getSceneElements() ?? [];
    if (elements.length === 0) {
      setError("Draw the diagram before you submit. Open the Diagram tab.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { exportToBlob } = await import("@excalidraw/excalidraw");
      const blob = await exportToBlob({
        elements,
        // Always export in the light theme. The reviewer reads this image.
        appState: { exportBackground: true, viewBackgroundColor: "#ffffff", exportWithDarkMode: false },
        files: api.current!.getFiles(),
        mimeType: "image/png",
      });
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kataId: kata.id,
          scope,
          notes,
          characteristics: selected
            .map((item) => `${item.name}: ${item.why.trim() || "(no reason given)"}`)
            .join("\n"),
          style,
          rationale,
          diagramPng: await blobToDataUrl(blob),
          elements,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      router.push(`/attempt/${body.id}`);
    } catch (caught) {
      setError((caught as Error).message || "The review failed.");
      setBusy(false);
    }
  }

  return (
    <main className="flex h-[calc(100dvh-3.5rem)] overflow-hidden">
      <SidePanel widthClass="w-[27rem]" onToggle={refreshCanvas}>
        {/* "relative" keeps hidden labels inside this scroll area. Without it, they make the page scroll. */}
        <div className="relative flex-1 space-y-6 overflow-y-auto p-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{kata.title}</h1>
              <Badge variant={kata.interview || kata.source ? "neutral" : "neutral"}>
                {kata.source ? "community kata" : kata.interview ? "interview question" : kata.difficulty}
              </Badge>
            </div>
            <ProblemText kata={kata} />
            {kata.note && <p className="border-l-2 border-primary pl-3 text-muted-foreground">{kata.note}</p>}
            {kata.source && (
              <p className="text-muted-foreground">
                From <LessonLink href={kata.source.url}>{kata.source.name}</LessonLink>
                {kata.source.credit && `, by ${kata.source.credit}`}
              </p>
            )}
            <p className="flex flex-wrap gap-x-4 gap-y-1 rounded-md bg-muted p-3">
              <LessonLink href="/learn/method">How to do a kata</LessonLink>
              {hasExample && (
                <LessonLink href={`/learn/examples/${kata.id}`}>A finished answer to this kata</LessonLink>
              )}
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <Label htmlFor="scope" className="sr-only">
              Core functions and scope
            </Label>
            <StepHeading
              number={1}
              title="Core functions and scope"
              hint={
                kata.requirements.length > 0
                  ? "Select the two or three functions that shape the design. Say what you leave out."
                  : "The problem gives no list. Write the functions the system must have, your assumptions, and what you leave out."
              }
            />
            <Textarea id="scope" rows={4} value={scope} onChange={(event) => setScope(event.target.value)} />
            <p className="text-muted-foreground">
              These are the functional requirements: what the system does. Step 2 is about how well it
              does it.
            </p>
          </section>

          <section className="space-y-2">
            <StepHeading
              number={2}
              title="Driving characteristics"
              hint={`Select the top ${MAX_CHARACTERISTICS}. Then tie each one to a sentence in the kata.`}
            />
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Driving characteristics">
              {glossary.map((item) => {
                const active = selected.some((entry) => entry.name === item.name);
                return (
                  <Button
                    key={item.name}
                    type="button"
                    size="sm"
                    variant={active ? "default" : "neutral"}
                    aria-pressed={active}
                    disabled={!active && selected.length >= MAX_CHARACTERISTICS}
                    title={item.meaning}
                    onClick={() => toggle(item.name)}
                  >
                    {item.name}
                  </Button>
                );
              })}
            </div>
            <p className="text-muted-foreground">
              {selected.length} of {MAX_CHARACTERISTICS} selected
            </p>
            {selected.map((item) => (
              <div key={item.name} className="space-y-1.5 rounded-base border-2 bg-background p-3">
                <Label htmlFor={`why-${item.name}`}>{item.name}</Label>
                <p className="text-muted-foreground">
                  {glossary.find((entry) => entry.name === item.name)?.meaning}
                </p>
                <Input
                  id={`why-${item.name}`}
                  placeholder="Which sentence in the kata makes this important?"
                  value={item.why}
                  onChange={(event) => setWhy(item.name, event.target.value)}
                />
              </div>
            ))}
            <Collapsible>
              <CollapsibleTrigger className="group flex items-center gap-1 text-primary hover:underline">
                What does each characteristic mean?
                <ChevronDown className="size-3.5 transition-transform group-data-[panel-open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2 rounded-base border-2 bg-background p-3">
                <p className="text-muted-foreground">
                  A quality the system must have, not a feature. Look for these signals in the kata:
                </p>
                <dl className="space-y-2">
                  {glossary.map((item) => (
                    <div key={item.name}>
                      <dt className="font-medium">{item.name}</dt>
                      <dd className="text-muted-foreground">
                        {item.meaning} Signal: {item.signal}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CollapsibleContent>
            </Collapsible>
          </section>

          <section className="space-y-2">
            <StepHeading
              number={3}
              title="Architecture style"
              hint="Select the simplest style that supports your characteristics."
            />
            <Select value={style || null} onValueChange={(value) => setStyle(value ?? "")}>
              <SelectTrigger className="w-full" aria-label="Architecture style">
                <SelectValue placeholder="Select a style" />
              </SelectTrigger>
              <SelectContent>
                {styles.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {lesson && (
              <div className="space-y-2 rounded-base border-2 bg-background p-3">
                <p>{lesson.idea}</p>
                <p>
                  <span className="font-medium">Use when:</span> {lesson.useWhen}
                </p>
                <p>
                  <span className="font-medium">Main cost:</span> {lesson.costs[0]}
                </p>
                <Dialog>
                  <DialogTrigger render={<Button variant="neutral" size="sm" />}>
                    See the diagram and the full lesson
                  </DialogTrigger>
                  <DialogContent className="max-h-[85vh] overflow-y-auto text-sm leading-relaxed sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{lesson.name}</DialogTitle>
                      <DialogDescription>{lesson.idea}</DialogDescription>
                    </DialogHeader>
                    <StyleLessonBody lesson={lesson} />
                  </DialogContent>
                </Dialog>
              </div>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <LessonLink href="/learn/styles">Compare the styles</LessonLink>
              <LessonLink href="/glossary">Glossary</LessonLink>
            </div>
          </section>

          <section>
            <StepHeading
              number={4}
              title="Diagram"
              hint="Draw on the canvas. Put a label on each shape and attach arrows to shapes."
            />
          </section>

          <section className="space-y-2">
            <Label htmlFor="rationale" className="sr-only">
              Rationale
            </Label>
            <StepHeading
              number={5}
              title="Rationale"
              hint="Explain the design, what it gives up, and where it can fail."
            />
            <Textarea
              id="rationale"
              rows={8}
              value={rationale}
              onChange={(event) => setRationale(event.target.value)}
            />
          </section>
        </div>

        <div className="space-y-3 border-t-2 p-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button onClick={submit} disabled={busy} size="lg" className="w-full">
            {busy && <LoaderCircle className="animate-spin" />}
            {busy ? "The review is in progress. This can take a minute." : "Submit for review"}
          </Button>
        </div>
      </SidePanel>
      <div className="flex min-w-0 flex-1 flex-col bg-card">
        <div role="tablist" aria-label="Work area" className="flex items-center gap-2 border-b-2 py-2 pr-3 pl-14">
          <Button
            role="tab"
            aria-selected={view === "notes"}
            variant={view === "notes" ? "noShadow" : "ghost"}
            size="sm"
            onClick={() => setView("notes")}
          >
            <NotebookPen /> Notes
          </Button>
          <Button
            role="tab"
            aria-selected={view === "diagram"}
            variant={view === "diagram" ? "noShadow" : "ghost"}
            size="sm"
            onClick={() => setView("diagram")}
          >
            <PenTool /> Diagram
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            {view === "notes" ? "Your notes are private. The review does not read them." : "The review reads this diagram."}
          </span>
        </div>
        <div className="relative min-h-0 flex-1">
          {/* The canvas stays loaded under the notepad, so the drawing is kept. */}
          <Canvas onReady={(instance) => (api.current = instance)} />
          {view === "notes" && (
            <div className="absolute inset-0 z-20 bg-card">
              <NotesEditor kataId={kata.id} onTextChange={setNotes} />
            </div>
          )}
        </div>
      </div>
      <HelpChat
        intro="Ask about a concept, or check your reasoning. In a kata, the helper gives hints and questions, not the design."
        getContext={() => ({
          kind: "kata",
          kataId: kata.id,
          scope,
          notes,
          characteristics: selected.map((item) => `${item.name}: ${item.why.trim() || "(no reason given)"}`).join("\n"),
          style,
          rationale,
          elements: slimElements(api.current?.getSceneElements() ?? []),
        })}
      />
    </main>
  );
}
