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

// The elements that hold text to read, and the elements to skip.
const BLOCKS = "h1,h2,h3,h4,p,li,dt,dd,th,td,blockquote,figcaption";
const SKIP = "pre,nav,button,svg,script,style,textarea,input,select,[data-read-skip]";
// The name of the highlight style in globals.css.
const HIGHLIGHT = "archsim-reading";
const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];
const RATE_KEY = "archsim-read-rate";
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
// Alt+R starts and pauses it. Alt+click on a sentence starts the reading at that sentence.
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
    if (sentences.current.length === 0) return;
    void playAt(point ? sentenceAt(sentences.current, point) : firstVisible(sentences.current));
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
    if (!event.altKey) return;
    // Alt+click on a link downloads it. Here it starts the reading.
    event.preventDefault();
    void start(caretAt(event.clientX, event.clientY));
  });

  const reset = useEffectEvent(() => stop());

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const element = root.current;
    element?.addEventListener("click", onClick, true);
    return () => element?.removeEventListener("click", onClick, true);
  }, [root]);

  // A new page stops the reading.
  useEffect(() => () => reset(), [page]);

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

  if (status === "idle") {
    return (
      <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-2">
        {notice && <p className="rounded-base border-2 bg-card px-3 py-1.5 text-sm">{notice}</p>}
        <Button
          variant="neutral"
          size="sm"
          onClick={() => void start()}
          title="Read aloud from the first sentence on the screen (Alt+R). Alt+click a sentence to start there."
        >
          <Volume2 /> Read aloud
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-40 flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col items-center gap-2">
      {notice && (
        <output className="rounded-base border-2 bg-card px-3 py-1.5 text-sm">{notice}</output>
      )}
      <div
        role="toolbar"
        aria-label="Read aloud"
        className="flex items-center gap-1.5 rounded-base border-2 border-border bg-secondary-background p-1.5 shadow-shadow"
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
        <select
          aria-label="Reading speed"
          value={rate}
          onChange={(event) => changeRate(Number(event.target.value))}
          className="h-9 rounded-base border-2 border-border bg-secondary-background px-1.5 text-sm"
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
  );
}
