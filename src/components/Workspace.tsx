"use client";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { ChevronDown, ExternalLink, LoaderCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StyleLessonBody from "@/components/StyleLessonBody";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { Kata } from "@/lib/katas";
import { characteristics as glossary, getStyleLesson, styleLessons } from "@/lib/learn";

const Canvas = dynamic(() => import("./Canvas"), { ssr: false });

const MAX_CHARACTERISTICS = 3;

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
        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
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
  const [style, setStyle] = useState("");
  const [rationale, setRationale] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lesson = getStyleLesson(style);

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
      setError("Draw the diagram before you submit.");
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
      <aside className="flex w-[27rem] shrink-0 flex-col border-r bg-card text-sm leading-relaxed">
        {/* "relative" keeps hidden labels inside this scroll area. Without it, they make the page scroll. */}
        <div className="relative flex-1 space-y-6 overflow-y-auto p-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{kata.title}</h1>
              <Badge variant={kata.interview || kata.source ? "outline" : "secondary"}>
                {kata.source ? "community kata" : kata.interview ? "interview question" : kata.difficulty}
              </Badge>
            </div>
            <p>{kata.context}</p>
            {kata.details?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {kata.users && (
              <p>
                <span className="font-medium">Users:</span> {kata.users}
              </p>
            )}
            {kata.requirements.length > 0 && (
              <div>
                <h2 className="font-medium">Requirements</h2>
                <ul className="list-disc pl-5 text-muted-foreground">
                  {kata.requirements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {kata.constraints.length > 0 && (
              <div>
                <h2 className="font-medium">Constraints</h2>
                <ul className="list-disc pl-5 text-muted-foreground">
                  {kata.constraints.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
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
            <StepHeading
              number={1}
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
                    variant={active ? "default" : "outline"}
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
              <div key={item.name} className="space-y-1.5 rounded-md border bg-background p-3">
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
                <ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2 rounded-md border bg-background p-3">
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
              number={2}
              title="Architecture style"
              hint="Select the simplest style that supports your characteristics."
            />
            <Select value={style} onValueChange={setStyle}>
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
              <div className="space-y-2 rounded-md border bg-background p-3">
                <p>{lesson.idea}</p>
                <p>
                  <span className="font-medium">Use when:</span> {lesson.useWhen}
                </p>
                <p>
                  <span className="font-medium">Main cost:</span> {lesson.costs[0]}
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      See the diagram and the full lesson
                    </Button>
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
              number={3}
              title="Diagram"
              hint="Draw on the canvas. Put a label on each shape and attach arrows to shapes."
            />
          </section>

          <section className="space-y-2">
            <Label htmlFor="rationale" className="sr-only">
              Rationale
            </Label>
            <StepHeading
              number={4}
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
      </aside>
      <div className="min-w-0 flex-1">
        <Canvas onReady={(instance) => (api.current = instance)} />
      </div>
    </main>
  );
}
