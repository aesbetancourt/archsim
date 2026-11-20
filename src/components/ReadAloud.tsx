"use client";

import { LoaderCircle, Pause, Play, SkipBack, SkipForward, Square, Volume2 } from "lucide-react";
import { type RefObject, useEffect, useEffectEvent, useRef, useState } from "react";
import ReadFromHere from "@/components/ReadFromHere";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BLOCKS,
  INTERACTIVE,
  SKIP,
  caretAt,
  collectSections,
  collectSentences,
  firstVisible,
  isGone,
  keepInView,
  sectionOf,
  sentenceAt,
  type Point,
  type Section,
  type Sentence,
} from "@/lib/browser/page-text";
import { readSettings } from "@/lib/browser/api";
import { RATES, browserCanSpeak, createSpeaker, readRate, saveRate } from "@/lib/browser/speaker";
import type { SpeechEngine } from "@/lib/store/settings";
import { cn } from "@/lib/utils";

type Status = "idle" | "playing" | "paused";

// The name of the highlight style in globals.css.
const HIGHLIGHT = "charrette-reading";
// The number of sentences to load before they are necessary, so there is no pause between them.
const PREFETCH = 3;

// The icon of the play button. It turns while the Google voice loads a sentence.
function PlayIcon({ waiting, playing }: { waiting: boolean; playing: boolean }) {
  if (waiting) return <LoaderCircle className="animate-spin" />;
  if (playing) return <Pause />;
  return <Play />;
}

// A player that reads the text of the root aloud and highlights the sentence that it reads.
// Alt+R starts and pauses it. To start at a place, use the button next to a paragraph, the section
// menu, or Alt+click on a sentence. While the player is open, a click on a sentence moves to it.
//
// The player decides which sentence comes next. Two other files do the rest:
// lib/browser/page-text.ts finds the sentences and the sections of the page, and
// lib/browser/speaker.ts makes the sound.
export default function ReadAloud({
  root,
  page,
}: {
  root: RefObject<HTMLDivElement | null>;
  page: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [waiting, setWaiting] = useState(false);
  const [position, setPosition] = useState({ index: 0, total: 0 });
  const [rate, setRate] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [section, setSection] = useState(-1);

  const sentences = useRef<Sentence[]>([]);
  const current = useRef(0);
  // Each start of a sentence gets a new number. A callback of an older sentence does nothing.
  const run = useRef(0);
  // The engine from Settings. It loads again at each new start, so a change in Settings applies.
  const engine = useRef<SpeechEngine | null>(null);
  const sectionList = useRef<Section[]>([]);
  // The sound. One speaker lives as long as the player.
  const [speaker] = useState(createSpeaker);

  function refreshSections() {
    sectionList.current = collectSections(root.current);
    setSections(sectionList.current);
  }

  // The saved speed is in the browser, so it loads after the first render.
  useEffect(() => {
    const saved = readRate();
    speaker.setRate(saved);
    // oxlint-disable-next-line react/set-state-in-effect
    setRate(saved);
  }, [speaker]);

  function show(index: number) {
    const { range } = sentences.current[index];
    const highlight = new Highlight(range);
    // Show above the highlights of the notebook.
    highlight.priority = 1;
    CSS.highlights.set(HIGHLIGHT, highlight);
    setPosition({ index, total: sentences.current.length });
    setSection(sectionOf(sectionList.current, range));
    keepInView(range);
  }

  function stop() {
    run.current += 1;
    speaker.silence();
    CSS.highlights.delete(HIGHLIGHT);
    setStatus("idle");
    setWaiting(false);
  }

  // Read the sentence after the one at the index, after its pause.
  // A pause or a stop changes the run, so a waiting step does nothing.
  function playNext(id: number, at: number) {
    const wait = sentences.current[at + 1]?.pause ?? 0;
    window.setTimeout(() => {
      if (id === run.current) void playAt(at + 1);
    }, wait);
  }

  async function playAt(index: number) {
    const id = ++run.current;
    speaker.silence();
    // The text changed while the player waited. Find the sentences again and continue.
    const sentence = sentences.current[index];
    if (sentence && isGone(sentence) && root.current) {
      sentences.current = collectSentences(root.current);
      refreshSections();
    }
    if (index >= sentences.current.length) {
      stop();
      return;
    }
    current.current = Math.max(index, 0);
    const at = current.current;
    show(at);
    setStatus("playing");
    const next = () => playNext(id, at);

    if (engine.current === "google") {
      speaker.prefetch(
        sentences.current.slice(at + 1, at + 1 + PREFETCH).map((later) => later.text),
      );
      setWaiting(true);
      try {
        const url = await speaker.clip(sentences.current[at].text);
        if (id !== run.current) return;
        await speaker.playClip(url, at, next);
      } catch (error) {
        if (id !== run.current) return;
        // Without the Google voice, continue with the voice of the browser.
        setNotice(`${(error as Error).message} The browser voice reads now.`);
        engine.current = "browser";
        void playAt(at);
      } finally {
        if (id === run.current) setWaiting(false);
      }
      return;
    }

    speaker.speak(sentences.current[at].text, next, (error) => {
      if (id !== run.current || error === "interrupted" || error === "canceled") return;
      setNotice(`The browser voice stopped (${error}).`);
      stop();
    });
  }

  async function start(point?: Point | null) {
    const element = root.current;
    if (!element) return;
    setNotice(null);
    if (status === "idle") {
      try {
        engine.current = (await readSettings()).readAloud.engine;
      } catch {
        engine.current = "browser";
      }
    }
    if (engine.current === "browser" && !browserCanSpeak()) {
      setNotice("This browser cannot read aloud.");
      return;
    }
    sentences.current = collectSentences(element);
    refreshSections();
    if (sentences.current.length === 0) return;
    void playAt(point ? sentenceAt(sentences.current, point) : firstVisible(sentences.current));
  }

  // Read from a section, or from the start of the page for -1.
  function startSection(index: number) {
    const element = index < 0 ? root.current : sectionList.current[index]?.element;
    if (element) void start({ node: element, offset: 0 });
  }

  function pause() {
    run.current += 1;
    speaker.silence();
    setWaiting(false);
    setStatus("paused");
  }

  function resume() {
    // The Google voice continues from the pause. The browser voice starts the sentence again.
    if (engine.current === "google" && speaker.canContinue(current.current)) {
      const id = ++run.current;
      const at = current.current;
      setStatus("playing");
      speaker.continueClip(() => playNext(id, at)).catch(() => void playAt(at));
      return;
    }
    void playAt(current.current);
  }

  function toggle() {
    if (status === "playing") pause();
    else if (status === "paused") resume();
    else void start();
  }

  function changeRate(value: number) {
    speaker.setRate(value);
    setRate(value);
    saveRate(value);
    // The browser voice reads the sentence again at the new speed.
    if (status === "playing" && engine.current === "browser") void playAt(current.current);
  }

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (!event.altKey || event.code !== "KeyR") return;
    event.preventDefault();
    toggle();
  });

  const onClick = useEffectEvent((event: MouseEvent) => {
    const element = root.current;
    const target = event.target instanceof Element ? event.target : null;
    if (!element || !target) return;
    if (event.altKey) {
      // Alt+click on a link downloads it. Here it starts the reading.
      event.preventDefault();
      void start(caretAt(event.clientX, event.clientY));
      return;
    }
    if (status === "idle") return;
    // A link to a part of this page, as in the contents, also moves the reading there.
    const link = target.closest<HTMLAnchorElement>('a[href^="#"]');
    if (link) {
      const heading = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (heading && element.contains(heading)) void start({ node: heading, offset: 0 });
      return;
    }
    if (target.closest(INTERACTIVE) || target.closest(SKIP) || !target.closest(BLOCKS)) return;
    // A click that ends a text selection is for a highlight, not for the reading.
    if (window.getSelection()?.isCollapsed === false) return;
    const point = caretAt(event.clientX, event.clientY);
    if (point) void start(point);
  });

  const reset = useEffectEvent(() => {
    stop();
    refreshSections();
  });

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const element = root.current;
    element?.addEventListener("click", onClick, true);
    return () => element?.removeEventListener("click", onClick, true);
  }, [root]);

  // A new page stops the reading and loads the sections of the new page.
  useEffect(() => {
    const frame = requestAnimationFrame(() => reset());
    return () => cancelAnimationFrame(frame);
  }, [page]);

  // When the player closes, for example on a page with no lesson, stop the sound and release the
  // audio. Without this, the reading continues on the next page.
  const close = useEffectEvent(() => {
    run.current += 1;
    speaker.silence();
    CSS.highlights.delete(HIGHLIGHT);
    speaker.release();
  });
  useEffect(() => () => close(), []);

  const fromHere = (
    <ReadFromHere
      root={root}
      page={page}
      onRead={(block) => void start({ node: block, offset: 0 })}
    />
  );

  const menu = "h-9 w-auto gap-1.5 border-border bg-secondary-background px-2.5";
  // The choices of the section menus, with the start of the page first.
  const sectionItems = [
    { value: "-1", label: "Start of the page" },
    ...sections.map((item, index) => ({ value: String(index), label: item.title })),
  ];
  const rateItems = RATES.map((value) => ({ value: String(value), label: `${value}×` }));

  if (status === "idle") {
    return (
      <>
        {fromHere}
        <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-2 shadow-float">
          {notice && <p className="rounded-base border bg-card px-3 py-1.5 text-sm">{notice}</p>}
          <div className="flex items-center gap-1.5">
            <Button
              variant="neutral"
              size="sm"
              className="bg-secondary-background shadow-float"
              onClick={() => void start()}
              title="Read aloud from the first sentence on the screen (Alt+R). To start at a paragraph, point at it and click the play button on its left."
            >
              <Volume2 /> Read aloud
            </Button>
            {sections.length > 0 && (
              // A menu of places to start. It shows no value, so each choice starts the reading.
              <Select
                items={sectionItems}
                value={null}
                onValueChange={(value) => value !== null && startSection(Number(value))}
              >
                <SelectTrigger
                  aria-label="Read from a section"
                  className={cn(menu, "max-w-48 shadow-float")}
                >
                  <SelectValue placeholder="From a section…" />
                </SelectTrigger>
                <SelectContent side="top" align="start">
                  {sectionItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {fromHere}
      <div className="fixed bottom-4 left-1/2 z-40 flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col items-center gap-2 shadow-float">
        {notice && (
          <output className="rounded-base border bg-card px-3 py-1.5 text-sm">{notice}</output>
        )}
        <div
          role="toolbar"
          aria-label="Read aloud"
          className="flex flex-wrap items-center justify-center gap-1.5 rounded-base border border-border bg-secondary-background p-1.5 shadow-float"
        >
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Previous sentence"
            onClick={() => void playAt(Math.max(current.current - 1, 0))}
          >
            <SkipBack />
          </Button>
          <Button
            size="icon-sm"
            aria-label={status === "playing" ? "Pause (Alt+R)" : "Play (Alt+R)"}
            onClick={toggle}
          >
            <PlayIcon waiting={waiting} playing={status === "playing"} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Next sentence"
            onClick={() => void playAt(current.current + 1)}
          >
            <SkipForward />
          </Button>
          <span className="px-1 font-mono text-xs tabular-nums text-muted-foreground">
            {position.index + 1}/{position.total}
          </span>
          {sections.length > 0 && (
            <Select
              items={sectionItems}
              value={String(section)}
              onValueChange={(value) => value !== null && startSection(Number(value))}
            >
              <SelectTrigger aria-label="Section" className={cn(menu, "max-w-48")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top" align="start">
                {sectionItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select
            items={rateItems}
            value={String(rate)}
            onValueChange={(value) => value !== null && changeRate(Number(value))}
          >
            <SelectTrigger aria-label="Reading speed" className={menu}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {rateItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon-sm" aria-label="Stop reading" onClick={stop}>
            <Square />
          </Button>
        </div>
      </div>
    </>
  );
}
