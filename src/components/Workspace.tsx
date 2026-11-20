"use client";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import {
  BookOpen,
  ChevronDown,
  ExternalLink,
  FileText,
  LoaderCircle,
  NotebookPen,
  PenTool,
  RotateCcw,
  Send,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HelpChat from "@/components/HelpChat";
import KataClock from "@/components/KataClock";
import ProblemText from "@/components/ProblemText";
import SidePanel from "@/components/SidePanel";
import StyleLessonBody from "@/components/StyleLessonBody";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { clearDraft, type Draft, loadDraft, saveDraft } from "@/lib/browser/draft";
import { saveClock } from "@/lib/browser/kata-clock";
import type { Kata } from "@/lib/content/katas";
import { loadNotesHtml, saveNotesHtml } from "@/lib/browser/kata-notes";
import { notesText } from "@/lib/notes-html";
import { slimElements } from "@/lib/ai/scene";
import {
  characteristics as glossary,
  getStyleLesson,
  styleLessons,
} from "@/lib/content/kata-method";
import { reviewAttempt } from "@/lib/browser/api";
import { sceneVersion } from "@/lib/browser/scene-version";
import { useAutosave } from "@/lib/browser/use-autosave";
import { tourTarget } from "@/lib/content/tours";
import { cn } from "@/lib/utils";
import Tour from "@/components/Tour";

const Canvas = dynamic(() => import("./Canvas"), { ssr: false });

// The most characteristics that a person can select. The method recommends three.
const MAX_CHARACTERISTICS = 5;
const USUAL_CHARACTERISTICS = 3;
// The time between the last change and the save of the work in progress.
const SAVE_DELAY_MS = 800;

const NotesEditor = dynamic(() => import("./NotesEditor"), { ssr: false });

const styles = [...styleLessons.map((lesson) => lesson.name), "Other (explain in the rationale)"];

// The kind of a kata, for the badge next to its title. A built-in kata shows its difficulty.
function kataKind(kata: Kata): string {
  if (kata.source) return "community kata";
  if (kata.interview) return "interview question";
  return kata.difficulty;
}

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
    <a
      href={href}
      target="_blank"
      className="inline-flex items-center gap-1 text-primary hover:underline"
    >
      {children} <ExternalLink className="size-3" />
    </a>
  );
}

function StepHeading({ number, title, hint }: { number: number; title: string; hint: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 font-medium">
        <span className="flex size-5 items-center justify-center rounded-full border border-border bg-main text-[11px] font-heading text-main-foreground">
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
  // On a phone, the page shows one pane at a time: the kata, or the work area.
  const [pane, setPane] = useState<"kata" | "work">("kata");
  const [notes, setNotes] = useState("");
  const [scope, setScope] = useState("");

  const [style, setStyle] = useState("");
  const [rationale, setRationale] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // The saved work on this kata. "undefined" means that it is not read yet.
  const [draft, setDraft] = useState<Draft | null | undefined>(undefined);
  const [saveState, setSaveState] = useState<"saved" | "pending" | "error">("saved");
  // A new number makes a new, empty canvas and notepad. "Start again" changes it.
  const [round, setRound] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  // The version of the drawing at the last change. See sceneVersion.
  const lastVersion = useRef(-1);
  // The newest answers, for a save that starts after a delay.
  const latest = useRef({ scope, selected, style, rationale, notes });
  // The drawing from the saved work. A save uses it while the canvas is not open yet.
  const savedScene = useRef<Draft["scene"]>({ elements: [], files: {} });

  // Read the saved work when the page opens. The editor saves the notes itself.
  // This page keeps their plain text, for the help chat and for the saved attempt.
  useEffect(() => {
    const saved = loadDraft(kata.id);
    /* oxlint-disable react/set-state-in-effect */
    const savedNotes = notesText(loadNotesHtml(kata.id));
    latest.current = { ...latest.current, notes: savedNotes };
    setNotes(savedNotes);
    if (saved) {
      // Set the newest answers first, so this read does not start a save.
      latest.current = {
        scope: saved.scope,
        selected: saved.selected,
        style: saved.style,
        rationale: saved.rationale,
        notes: latest.current.notes,
      };
      savedScene.current = saved.scene;
      setScope(saved.scope);
      setSelected(saved.selected);
      setStyle(saved.style);
      setRationale(saved.rationale);
    }
    setDraft(saved);
    /* oxlint-enable react/set-state-in-effect */
  }, [kata.id]);

  const save = useCallback(() => {
    const { scope, selected, style, rationale } = latest.current;
    const ok = saveDraft(kata.id, {
      scope,
      selected,
      style,
      rationale,
      scene: api.current
        ? { elements: [...api.current.getSceneElements()], files: { ...api.current.getFiles() } }
        : savedScene.current,
    });
    setSaveState(ok ? "saved" : "error");
  }, [kata.id]);
  // The work saves at once when the page closes with a planned save.
  const autosave = useAutosave(save, SAVE_DELAY_MS);

  // Plan a save a short time after the last change.
  const changed = useCallback(() => {
    setSaveState("pending");
    autosave.schedule();
  }, [autosave]);

  // Save when an answer changes. Do not save before the saved work is read.
  useEffect(() => {
    const before = latest.current;
    latest.current = { scope, selected, style, rationale, notes };
    if (draft === undefined) return;
    // The editor saves the notes itself. A change in the notes still saves the draft,
    // so the home page can show this kata as in progress.
    if (
      before.scope !== scope ||
      before.selected !== selected ||
      before.style !== style ||
      before.rationale !== rationale ||
      before.notes !== notes
    ) {
      changed();
    }
  }, [scope, selected, style, rationale, notes, draft, changed]);

  // Save immediately when the user leaves the site, or closes the tab, with a planned save.
  useEffect(() => {
    window.addEventListener("pagehide", autosave.flush);
    return () => window.removeEventListener("pagehide", autosave.flush);
  }, [autosave]);

  // Excalidraw reports each pointer move. Plan a save only when the drawing changed.
  const onSceneChange = useCallback(
    (elements: readonly { version: number }[]) => {
      const version = sceneVersion(elements);
      if (lastVersion.current === -1) {
        lastVersion.current = version;
        return;
      }
      if (version !== lastVersion.current) {
        lastVersion.current = version;
        changed();
      }
    },
    [changed],
  );

  // Remove all the work on this kata: the answers, the notes, and the drawing.
  function startAgain() {
    autosave.cancel();
    clearDraft(kata.id);
    saveNotesHtml(kata.id, "");
    saveClock(kata.id, null);
    api.current = null;
    savedScene.current = { elements: [], files: {} };
    latest.current = { scope: "", selected: [], style: "", rationale: "", notes: "" };
    setScope("");
    setSelected(latest.current.selected);
    setStyle("");
    setRationale("");
    setNotes("");
    setDraft(null);
    lastVersion.current = -1;
    setRound((current) => current + 1);
    setSaveState("saved");
    setError("");
    setConfirmClear(false);
  }

  const lesson = getStyleLesson(style);
  // The canvas must measure its position again after the panel opens or closes.
  const refreshCanvas = useCallback(() => api.current?.refresh(), []);
  // The canvas measures its position again when its pane shows on a phone.
  useEffect(() => {
    const frame = requestAnimationFrame(refreshCanvas);
    return () => cancelAnimationFrame(frame);
  }, [pane, refreshCanvas]);

  // Select or remove a characteristic, up to the limit.
  function toggle(name: string) {
    setSelected((current) => {
      if (current.some((item) => item.name === name)) {
        return current.filter((item) => item.name !== name);
      }
      if (current.length < MAX_CHARACTERISTICS) return [...current, { name, why: "" }];
      return current;
    });
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
        appState: {
          exportBackground: true,
          viewBackgroundColor: "#ffffff",
          exportWithDarkMode: false,
        },
        files: api.current!.getFiles(),
        mimeType: "image/png",
      });
      const body = await reviewAttempt({
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
      });
      // The attempt is done, so the clock of this kata stops.
      saveClock(kata.id, null);
      router.push(`/attempt/${body.id}`);
    } catch (caught) {
      setError((caught as Error).message || "The review failed.");
      setBusy(false);
    }
  }

  return (
    <main className="flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden md:flex-row">
      {/* On a phone, one row of tabs selects the kata, the notes, or the diagram. A wider window
          shows the kata and the work area side by side, with the Notes and Diagram tabs. */}
      <div
        role="tablist"
        aria-label="Kata, notes, or diagram"
        className="flex shrink-0 gap-2 border-b bg-card px-3 py-2 md:hidden"
      >
        <Button
          role="tab"
          aria-selected={pane === "kata"}
          variant="tab"
          size="sm"
          onClick={() => setPane("kata")}
        >
          <FileText /> The kata
        </Button>
        <Button
          role="tab"
          aria-selected={pane === "work" && view === "notes"}
          variant="tab"
          size="sm"
          onClick={() => {
            setPane("work");
            setView("notes");
          }}
          {...tourTarget("notes-pane")}
        >
          <NotebookPen /> Notes
        </Button>
        <Button
          role="tab"
          aria-selected={pane === "work" && view === "diagram"}
          variant="tab"
          size="sm"
          onClick={() => {
            setPane("work");
            setView("diagram");
          }}
          {...tourTarget("diagram-pane")}
        >
          <PenTool /> Diagram
        </Button>
      </div>
      <SidePanel
        widthClass="w-full md:w-[27rem]"
        className={cn("max-md:min-h-0 max-md:flex-1", pane === "work" && "max-md:hidden")}
        onToggle={refreshCanvas}
      >
        {/* "relative" keeps hidden labels inside this scroll area. Without it, they make the page scroll. */}
        <div className="relative flex-1 space-y-6 overflow-y-auto p-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{kata.title}</h1>
              <Badge variant="neutral">{kataKind(kata)}</Badge>
            </div>
            <div {...tourTarget("problem")}>
              <ProblemText kata={kata} />
            </div>
            {kata.note && (
              <p className="border-l border-primary pl-3 text-muted-foreground">{kata.note}</p>
            )}
            {kata.source && (
              <p className="text-muted-foreground">
                From <LessonLink href={kata.source.url}>{kata.source.name}</LessonLink>
                {kata.source.credit && `, by ${kata.source.credit}`}
              </p>
            )}
            <p className="flex flex-wrap gap-x-4 gap-y-1 rounded-md bg-muted p-3">
              <LessonLink href="/learn/method">How to do a kata</LessonLink>
              {hasExample && (
                <LessonLink href={`/learn/examples/${kata.id}`}>
                  A finished answer to this kata
                </LessonLink>
              )}
            </p>
          </section>

          <Separator />

          <section className="space-y-2" {...tourTarget("steps")}>
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
            <Textarea
              id="scope"
              rows={4}
              value={scope}
              onChange={(event) => setScope(event.target.value)}
            />
            <p className="text-muted-foreground">
              These are the functional requirements: what the system does. Step 2 is about how well
              it does it.
            </p>
          </section>

          <section className="space-y-2">
            <StepHeading
              number={2}
              title="Driving characteristics"
              hint={`Select the few that drive the design: ${USUAL_CHARACTERISTICS} is usual, ${MAX_CHARACTERISTICS} is the limit. Then tie each one to a sentence in the kata.`}
            />
            <fieldset className="flex flex-wrap gap-1.5" aria-label="Driving characteristics">
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
            </fieldset>
            <p className="text-muted-foreground">
              {selected.length} of {MAX_CHARACTERISTICS} selected
              {selected.length > USUAL_CHARACTERISTICS &&
                ". Each one you add makes the design harder. Make sure each has a reason."}
            </p>
            {selected.map((item) => (
              <div key={item.name} className="space-y-1.5 rounded-base border bg-background p-3">
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
              <CollapsibleContent className="mt-2 space-y-2 rounded-base border bg-background p-3">
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
              <div className="space-y-2 rounded-base border bg-background p-3">
                <p>{lesson.idea}</p>
                <p>
                  <span className="font-medium">Use when:</span> {lesson.useWhen}
                </p>
                <p>
                  <span className="font-medium">Main cost:</span> {lesson.costs[0]}
                </p>
                <Dialog>
                  <DialogTrigger render={<Button variant="neutral" size="sm" />}>
                    <BookOpen /> See the diagram and the full lesson
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

        <div className="space-y-3 border-t p-4">
          <div {...tourTarget("clock")}>
            <KataClock key={round} kataId={kata.id} interview={Boolean(kata.interview)} />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            onClick={submit}
            {...tourTarget("submit")}
            disabled={busy}
            size="lg"
            className="w-full"
          >
            {busy ? <LoaderCircle className="animate-spin" /> : <Send />}
            {busy ? "The review is in progress. This can take a minute." : "Submit for review"}
          </Button>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <output>
              {saveState === "saved" && "Your work is saved in this browser."}
              {saveState === "pending" && "Saving your work."}
              {saveState === "error" && "The browser refused to save your work."}
            </output>
            <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
              <DialogTrigger render={<Button variant="ghost" size="xs" disabled={busy} />}>
                <RotateCcw /> Start again
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start this kata again?</DialogTitle>
                  <DialogDescription>
                    This removes your answers, your notes, and your diagram for this kata. You
                    cannot get them back. Your reviewed attempts stay in the history.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="neutral" onClick={() => setConfirmClear(false)}>
                    Cancel
                  </Button>
                  <Button onClick={startAgain}>Start again</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </SidePanel>
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col bg-card",
          pane === "kata" && "max-md:hidden",
        )}
      >
        <div
          role="tablist"
          aria-label="Work area"
          // On a phone, the row of tabs at the top of the page has these two tabs.
          className="flex items-center gap-2 border-b px-3 py-2 max-md:hidden"
          {...tourTarget("work-area")}
        >
          <Button
            role="tab"
            aria-selected={view === "notes"}
            variant="tab"
            size="sm"
            onClick={() => setView("notes")}
          >
            <NotebookPen /> Notes
          </Button>
          <Button
            role="tab"
            aria-selected={view === "diagram"}
            variant="tab"
            size="sm"
            onClick={() => setView("diagram")}
            {...tourTarget("diagram-tab")}
          >
            <PenTool /> Diagram
          </Button>
          <span className="ml-auto hidden text-xs text-muted-foreground lg:inline">
            {view === "notes"
              ? "Your notes are private. The review does not read them."
              : "The review reads this diagram."}
          </span>
        </div>
        <div className="relative min-h-0 flex-1">
          {/* The canvas stays loaded under the notepad, so the drawing is kept. */}
          {/* The canvas opens after the saved work is read, so it can show the saved drawing. */}
          {draft !== undefined && (
            <Canvas
              key={round}
              onReady={(instance) => (api.current = instance)}
              initialData={draft?.scene.elements.length ? draft.scene : undefined}
              onChange={onSceneChange}
            />
          )}
          {view === "notes" && (
            <div className="absolute inset-0 z-20 bg-card">
              <NotesEditor key={round} kataId={kata.id} onTextChange={setNotes} />
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
          characteristics: selected
            .map((item) => `${item.name}: ${item.why.trim() || "(no reason given)"}`)
            .join("\n"),
          style,
          rationale,
          elements: slimElements(api.current?.getSceneElements() ?? []),
        })}
      />
      <Tour id="kata" />
    </main>
  );
}
