"use client";

import { LoaderCircle, Pause, Play, SkipBack, SkipForward, Square, Volume2 } from "lucide-react";
import { type RefObject, useEffect, useEffectEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { rangeFor } from "@/components/useHighlighter";
import { splitSentences } from "@/lib/sentences";
import type { PublicSettings, SpeechEngine } from "@/lib/settings";

type Sentence = { text: string; range: Range };
type Status = "idle" | "playing" | "paused";
type Point = { node: Node; offset: number };
type Section = { title: string; element: HTMLElement };

// The elements that hold text to read, and the elements to skip.
// Tables are skipped: a table read cell by cell is hard to follow by ear.
const BLOCKS = "h1,h2,h3,h4,p,li,dt,dd,blockquote,figcaption";
const SKIP = "pre,nav,table,button,svg,script,style,textarea,input,select,[data-read-skip]";
// A click on these elements does its own action. It does not move the reading.
const INTERACTIVE = "a,button,input,textarea,select,label,summary,[role=button]";
// The distance from the left edge of the text to the "Read from here" button.
const GUTTER = 26;
// The name of the highlight style in globals.css.
const HIGHLIGHT = "charrette-reading";
const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];
const RATE_KEY = "charrette-read-rate";
// The number of sentences to load before they are necessary, so there is no pause between them.
const PREFETCH = 3;
// The space at the top and bottom of the window that the current sentence must not go into.
const TOP_MARGIN = 72;
const BOTTOM_MARGIN = 120;

// Find the sentences in the visible text of the root, in reading order.
function collectSentences(root: HTMLElement): Sentence[] {
  const groups: { block: Element; nodes: Text[] }[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent) continue;
    const skip = parent.closest(SKIP);
    if (skip && root.contains(skip)) continue;
    const block = parent.closest(BLOCKS);
    if (!block || !root.contains(block)) continue;
    const last = groups.at(-1);
    if (last?.block === block) last.nodes.push(node as Text);
    else groups.push({ block, nodes: [node as Text] });
  }

  const sentences: Sentence[] = [];
  for (const { block, nodes } of groups) {
    if (!block.checkVisibility()) continue;
    const text = nodes.map((node) => node.data).join("");
    for (const span of splitSentences(text)) {
      const range = rangeFor(nodes, span.start, span.end);
      if (range)
        sentences.push({ text: text.slice(span.start, span.end).replace(/\s+/g, " "), range });
    }
  }
  return sentences;
}

// The sections of the page: each visible level-2 heading outside the skipped parts.
function collectSections(root: HTMLElement | null): Section[] {
  if (!root) return [];
  return [...root.querySelectorAll<HTMLElement>("h2")]
    .filter((heading) => {
      const skip = heading.closest(SKIP);
      return !(skip && root.contains(skip)) && heading.checkVisibility();
    })
    .map((element) => ({ title: element.textContent?.trim() ?? "", element }))
    .filter((section) => section.title);
}

// The section of a sentence: the last heading before it, or -1 before the first heading.
function sectionOf(sections: Section[], range: Range): number {
  let found = -1;
  sections.forEach((section, index) => {
    if (range.comparePoint(section.element, 0) <= 0) found = index;
  });
  return found;
}

// The text position under a point of the window.
function caretAt(x: number, y: number): Point | null {
  if (document.caretPositionFromPoint) {
    const position = document.caretPositionFromPoint(x, y);
    return position ? { node: position.offsetNode, offset: position.offset } : null;
  }
  const range = document.caretRangeFromPoint?.(x, y);
  return range ? { node: range.startContainer, offset: range.startOffset } : null;
}

// The first sentence that contains the point or comes after it.
function sentenceAt(sentences: Sentence[], point: Point): number {
  const index = sentences.findIndex((sentence) => {
    try {
      return sentence.range.comparePoint(point.node, point.offset) <= 0;
    } catch {
      return false;
    }
  });
  return Math.max(index, 0);
}

// The first sentence that is in the window now. Play starts there, so you can scroll to a place.
function firstVisible(sentences: Sentence[]): number {
  const index = sentences.findIndex((sentence) => {
    const rect = sentence.range.getBoundingClientRect();
    return rect.bottom > TOP_MARGIN && rect.top < window.innerHeight;
  });
  return Math.max(index, 0);
}

// A natural English voice of the browser. macOS has Premium and Enhanced voices.
function browserVoice(): SpeechSynthesisVoice | undefined {
  const voices = speechSynthesis.getVoices().filter((voice) => voice.lang.startsWith("en"));
  return (
    voices.find((voice) => voice.lang === "en-US" && /premium|enhanced/i.test(voice.name)) ??
    voices.find((voice) => voice.lang === "en-US" && voice.localService) ??
    voices[0]
  );
}

function readRate(): number {
  try {
    const saved = Number(localStorage.getItem(RATE_KEY));
    return RATES.includes(saved) ? saved : 1;
  } catch {
    return 1;
  }
}

// A player that reads the text of the root aloud and highlights the sentence that it reads.
// Alt+R starts and pauses it. To start at a place, use the button next to a paragraph, the section
// menu, or Alt+click on a sentence. While the player is open, a click on a sentence moves to it.
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
  // The position of the "Read from here" button, next to the block under the pointer.
  const [gutter, setGutter] = useState<{ top: number; left: number } | null>(null);

  const sentences = useRef<Sentence[]>([]);
  const current = useRef(0);
  // Each start of a sentence gets a new number. A callback of an older sentence does nothing.
  const run = useRef(0);
  // The engine from Settings. It loads again at each new start, so a change in Settings applies.
  const engine = useRef<SpeechEngine | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  // The sentence that the audio element holds now.
  const loaded = useRef(-1);
  // The audio of each sentence, as a blob URL, by the sentence text.
  const clips = useRef(new Map<string, Promise<string>>());
  const rateNow = useRef(1);
  const sectionList = useRef<Section[]>([]);
  // The block under the pointer, where the "Read from here" button starts the reading.
  const hovered = useRef<Element | null>(null);
  const gutterButton = useRef<HTMLButtonElement>(null);

  function refreshSections() {
    sectionList.current = collectSections(root.current);
    setSections(sectionList.current);
  }

  useEffect(() => {
    rateNow.current = readRate();
    setRate(rateNow.current);
  }, []);

  function silence() {
    audio.current?.pause();
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }

  function show(index: number) {
    const { range } = sentences.current[index];
    const highlight = new Highlight(range);
    // Show above the highlights of the notebook.
    highlight.priority = 1;
    CSS.highlights.set(HIGHLIGHT, highlight);
    setPosition({ index, total: sentences.current.length });
    setSection(sectionOf(sectionList.current, range));

    const rect = range.getBoundingClientRect();
    if (rect.top < TOP_MARGIN || rect.bottom > window.innerHeight - BOTTOM_MARGIN) {
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      range.startContainer.parentElement?.scrollIntoView({
        block: "center",
        behavior: still ? "auto" : "smooth",
      });
    }
  }

  function clip(text: string): Promise<string> {
    let request = clips.current.get(text);
    if (!request) {
      request = fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      }).then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error ?? "The Google voice did not load.");
        }
        return URL.createObjectURL(await response.blob());
      });
      // A failed request can run again later.
      request.catch(() => clips.current.delete(text));
      clips.current.set(text, request);
    }
    return request;
  }

  function stop() {
    run.current += 1;
    silence();
    CSS.highlights.delete(HIGHLIGHT);
    setStatus("idle");
    setWaiting(false);
  }

  async function playAt(index: number) {
    const id = ++run.current;
    silence();
    if (index >= sentences.current.length) {
      stop();
      return;
    }
    current.current = Math.max(index, 0);
    const at = current.current;
    show(at);
    setStatus("playing");
    const next = () => {
      if (id === run.current) void playAt(at + 1);
    };

    if (engine.current === "google") {
      for (const later of sentences.current.slice(at + 1, at + 1 + PREFETCH)) {
        clip(later.text).catch(() => undefined);
      }
      setWaiting(true);
      try {
        const url = await clip(sentences.current[at].text);
        if (id !== run.current) return;
        const player = (audio.current ??= new Audio());
        player.src = url;
        loaded.current = at;
        player.defaultPlaybackRate = rateNow.current;
        player.playbackRate = rateNow.current;
        player.onended = next;
        await player.play();
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

    const utterance = new SpeechSynthesisUtterance(sentences.current[at].text);
    utterance.lang = "en-US";
    utterance.voice = browserVoice() ?? null;
    utterance.rate = rateNow.current;
    utterance.onend = next;
    utterance.onerror = (event) => {
      if (id !== run.current || event.error === "interrupted" || event.error === "canceled") return;
      setNotice(`The browser voice stopped (${event.error}).`);
      stop();
    };
    speechSynthesis.speak(utterance);
  }

  async function start(point?: Point | null) {
    const element = root.current;
    if (!element) return;
    setNotice(null);
    if (status === "idle") {
      try {
        const settings = (await (await fetch("/api/settings")).json()) as PublicSettings;
        engine.current = settings.readAloud.engine;
      } catch {
        engine.current = "browser";
      }
    }
    if (engine.current === "browser" && !("speechSynthesis" in window)) {
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
    silence();
    setWaiting(false);
    setStatus("paused");
  }

  function resume() {
    const player = audio.current;
    // The Google voice continues from the pause. The browser voice starts the sentence again.
    if (
      engine.current === "google" &&
      player &&
      loaded.current === current.current &&
      player.currentTime > 0 &&
      !player.ended
    ) {
      const id = ++run.current;
      const at = current.current;
      player.onended = () => {
        if (id === run.current) void playAt(at + 1);
      };
      setStatus("playing");
      player.play().catch(() => void playAt(at));
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
    rateNow.current = value;
    setRate(value);
    try {
      localStorage.setItem(RATE_KEY, String(value));
    } catch {
      // The speed is not saved for the next visit. It still applies now.
    }
    if (audio.current) audio.current.playbackRate = value;
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

  // Show the "Read from here" button next to the block under the pointer.
  const onMove = useEffectEvent((event: MouseEvent) => {
    const element = root.current;
    const block = event.target instanceof Element ? event.target.closest(BLOCKS) : null;
    if (!element || !block || block === hovered.current || !element.contains(block)) return;
    const skip = block.closest(SKIP);
    if ((skip && element.contains(skip)) || !block.textContent?.trim()) return;
    hovered.current = block;
    // Put the button in the margin to the left of the text column, level with the first line.
    const column = block.closest("main") ?? element;
    const left =
      column.getBoundingClientRect().left +
      parseFloat(getComputedStyle(column).paddingLeft) -
      GUTTER;
    const rect = block.getBoundingClientRect();
    const line = parseFloat(getComputedStyle(block).lineHeight) || 24;
    setGutter({ left, top: rect.top + Math.min(line, rect.height) / 2 });
  });

  function clearGutter() {
    hovered.current = null;
    setGutter(null);
  }

  const hideGutter = useEffectEvent((event?: Event) => {
    // The pointer can move from the text to the button. Keep the button then.
    if (event instanceof MouseEvent && event.relatedTarget === gutterButton.current) return;
    clearGutter();
  });

  const reset = useEffectEvent(() => {
    stop();
    hideGutter();
    refreshSections();
  });

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const element = root.current;
    const hide = () => hideGutter();
    element?.addEventListener("click", onClick, true);
    element?.addEventListener("mousemove", onMove, { passive: true });
    element?.addEventListener("mouseleave", hideGutter);
    // The button has a fixed place on the screen, so it goes away when the page scrolls.
    window.addEventListener("scroll", hide, { capture: true, passive: true });
    return () => {
      element?.removeEventListener("click", onClick, true);
      element?.removeEventListener("mousemove", onMove);
      element?.removeEventListener("mouseleave", hideGutter);
      window.removeEventListener("scroll", hide, { capture: true });
    };
  }, [root]);

  // A new page stops the reading and loads the sections of the new page.
  useEffect(() => {
    const frame = requestAnimationFrame(() => reset());
    return () => cancelAnimationFrame(frame);
  }, [page]);

  // Release the audio when the player closes.
  useEffect(() => {
    const saved = clips.current;
    return () => {
      for (const request of saved.values()) {
        request.then(URL.revokeObjectURL, () => undefined);
      }
      saved.clear();
    };
  }, []);

  const fromHere = gutter && (
    <button
      ref={gutterButton}
      type="button"
      // The section menu and Alt+R do the same for the keyboard.
      tabIndex={-1}
      aria-label="Read from here"
      title="Read from here"
      onMouseLeave={(event) => {
        if (!root.current?.contains(event.relatedTarget as Node | null)) clearGutter();
      }}
      onClick={() => {
        if (hovered.current) void start({ node: hovered.current, offset: 0 });
      }}
      style={{ top: gutter.top, left: gutter.left }}
      className="fixed z-30 flex size-6 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-main text-main-foreground opacity-70 transition-opacity hover:opacity-100 shadow-float"
    >
      <Play className="size-3" aria-hidden />
    </button>
  );

  const menu = "h-9 rounded-base border border-border bg-secondary-background px-1.5 text-sm";

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
              <select
                aria-label="Read from a section"
                value=""
                onChange={(event) => startSection(Number(event.target.value))}
                className={`${menu} max-w-48 shadow-float`}
              >
                <option value="" disabled>
                  From a section…
                </option>
                <option value={-1}>Start of the page</option>
                {sections.map((item, index) => (
                  <option key={`${index}-${item.title}`} value={index}>
                    {item.title}
                  </option>
                ))}
              </select>
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
            {waiting ? (
              <LoaderCircle className="animate-spin" />
            ) : status === "playing" ? (
              <Pause />
            ) : (
              <Play />
            )}
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
            <select
              aria-label="Section"
              value={section}
              onChange={(event) => startSection(Number(event.target.value))}
              className={`${menu} max-w-48`}
            >
              <option value={-1}>Start of the page</option>
              {sections.map((item, index) => (
                <option key={`${index}-${item.title}`} value={index}>
                  {item.title}
                </option>
              ))}
            </select>
          )}
          <select
            aria-label="Reading speed"
            value={rate}
            onChange={(event) => changeRate(Number(event.target.value))}
            className={menu}
          >
            {RATES.map((value) => (
              <option key={value} value={value}>
                {value}×
              </option>
            ))}
          </select>
          <Button variant="ghost" size="icon-sm" aria-label="Stop reading" onClick={stop}>
            <Square />
          </Button>
        </div>
      </div>
    </>
  );
}
