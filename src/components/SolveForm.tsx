"use client";

import { LoaderCircle, PencilRuler, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function SolveForm({ initialText }: { initialText: string }) {
  const router = useRouter();
  const [text, setText] = useState(initialText);
  const [busy, setBusy] = useState<"study" | "practice" | null>(null);
  const [error, setError] = useState("");

  // Create the kata and its answer. Then open the answer or the canvas.
  async function submit(mode: "study" | "practice") {
    setBusy(mode);
    setError("");
    try {
      const response = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      router.push(mode === "study" ? `/learn/examples/${body.id}` : `/kata/${body.id}`);
    } catch (caught) {
      setError((caught as Error).message || "The request failed.");
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="problem">Problem text</Label>
        <Textarea
          id="problem"
          className="min-h-56"
          placeholder="Paste the problem here. Keep the original words."
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={busy !== null}
        />
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => submit("study")} disabled={busy !== null || text.trim().length < 40}>
          {busy === "study" ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
          Solve it and show me the answer
        </Button>
        <Button
          variant="neutral"
          onClick={() => submit("practice")}
          disabled={busy !== null || text.trim().length < 40}
        >
          {busy === "practice" ? <LoaderCircle className="animate-spin" /> : <PencilRuler />}
          Solve it, but let me try first
        </Button>
      </div>
      {busy && (
        <p className="text-muted-foreground">The model is writing the answer. This can take two minutes.</p>
      )}
    </div>
  );
}
