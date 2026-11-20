"use client";

import { LoaderCircle, MessageCircleQuestion, SendHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Prose from "@/components/Prose";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ChatMessage, HelperContext } from "@/lib/ai/helper";
import { askHelper } from "@/lib/browser/api";
import { tourTarget } from "@/lib/content/tours";

type Props = {
  // Read the current work at the moment the person sends a question.
  getContext: () => HelperContext;
  // A line that tells the person how the helper behaves on this page.
  intro: string;
};

// A floating button that opens a small help chat. The chat only answers. It changes nothing.
export default function HelpChat({ getContext, intro }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages, busy, open]);

  async function send() {
    const text = draft.trim();
    if (!text || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", text }];
    setMessages(next);
    setDraft("");
    setBusy(true);
    setError("");
    try {
      const body = await askHelper(getContext(), next);
      setMessages([...next, { role: "helper", text: body.reply }]);
    } catch (caught) {
      setError((caught as Error).message || "The helper did not answer.");
    }
    setBusy(false);
  }

  if (!open) {
    return (
      <Button
        size="icon-lg"
        // On a phone, the button is higher, so it does not cover the Submit button of a kata.
        className="fixed right-5 bottom-44 z-40 rounded-full shadow-float md:bottom-20"
        aria-label="Open the help chat"
        {...tourTarget("help-chat")}
        onClick={() => setOpen(true)}
      >
        <MessageCircleQuestion className="size-5" />
      </Button>
    );
  }

  return (
    <section
      aria-label="Help chat"
      {...tourTarget("help-chat")}
      className="fixed right-5 bottom-20 z-40 flex h-[min(34rem,calc(100dvh-8rem))] w-[24rem] max-w-[calc(100vw-2.5rem)] flex-col rounded-base border border-border bg-secondary-background text-sm shadow-float"
    >
      <header className="flex items-center justify-between gap-2 border-b border-border bg-main px-3 py-2 text-main-foreground">
        <h2 className="flex items-center gap-2 font-heading">
          <MessageCircleQuestion className="size-4" /> Help
        </h2>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              type="button"
              className="px-1 text-xs underline"
              onClick={() => setMessages([])}
            >
              Clear
            </button>
          )}
          <button type="button" aria-label="Close the help chat" onClick={() => setOpen(false)}>
            <X className="size-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <p className="text-muted-foreground">{intro}</p>
        {messages.map((message, index) =>
          message.role === "user" ? (
            <p
              key={index}
              className="ml-8 whitespace-pre-wrap rounded-base border border-border bg-background px-3 py-2"
            >
              {message.text}
            </p>
          ) : (
            <div key={index} className="mr-4">
              <Prose markdown={message.text} compact />
            </div>
          ),
        )}
        {busy && (
          <p className="flex items-center gap-2 text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" /> Thinking
          </p>
        )}
        {error && <p className="text-destructive">{error}</p>}
        <div ref={end} />
      </div>

      <div className="flex items-end gap-2 border-t border-border p-3">
        <Textarea
          aria-label="Your question"
          placeholder="Ask a question"
          className="max-h-32 min-h-10"
          rows={1}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Enter sends. Shift and Enter adds a line.
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send();
            }
          }}
        />
        <Button size="icon" aria-label="Send" onClick={send} disabled={busy || !draft.trim()}>
          <SendHorizontal />
        </Button>
      </div>
    </section>
  );
}
