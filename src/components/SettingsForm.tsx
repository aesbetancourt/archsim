"use client";

import { LoaderCircle, PlugZap, Save } from "lucide-react";
import { useState } from "react";
import ReadingFontSetting from "@/components/ReadingFontSetting";
import AnthropicCard from "@/components/settings/AnthropicCard";
import ClaudeCodeCard from "@/components/settings/ClaudeCodeCard";
import ConnectionPicker from "@/components/settings/ConnectionPicker";
import OpenAiCompatibleCard from "@/components/settings/OpenAiCompatibleCard";
import OpenCodeCard from "@/components/settings/OpenCodeCard";
import OpenCodeGoCard from "@/components/settings/OpenCodeGoCard";
import ReadAloudCard from "@/components/settings/ReadAloudCard";
import VertexCard, { useVertexModels } from "@/components/settings/VertexCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { PublicSettings, Settings } from "@/lib/store/settings";
import { saveSettings, speechClip, testConnection } from "@/lib/browser/api";

const SAMPLE =
  "Every architecture decision is a trade-off. This is the voice that reads your lessons.";

// The values of the form. They have the same form as the settings that the server saves.
// The server does not send a saved key to the browser, so each key starts empty. An empty key
// in a save keeps the saved key.
function draftFrom(saved: PublicSettings): Settings {
  return {
    mode: saved.mode,
    claudeCode: { model: saved.claudeCode.model },
    openCode: { model: saved.openCode.model },
    openCodeGo: { apiKey: "", model: saved.openCodeGo.model },
    anthropic: { apiKey: "", model: saved.anthropic.model },
    openaiCompatible: {
      baseUrl: saved.openaiCompatible.baseUrl,
      apiKey: "",
      model: saved.openaiCompatible.model,
    },
    vertex: {
      projectId: saved.vertex.projectId,
      location: saved.vertex.location,
      model: saved.vertex.model,
    },
    readAloud: {
      engine: saved.readAloud.engine,
      googleProjectId: saved.readAloud.googleProjectId,
      googleVoice: saved.readAloud.googleVoice,
    },
  };
}

// The Settings page: the connection to the model, the font, and the voice. This component has the
// values and the three actions: save, test the connection, and play a sample. Each card of the
// form is a file in components/settings.
export default function SettingsForm({ initial }: { initial: PublicSettings }) {
  // The settings as the server saved them, with a hint for each key.
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(() => draftFrom(initial));
  const [busy, setBusy] = useState<"save" | "test" | "voice" | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const vertexModels = useVertexModels(
    draft.mode === "vertex",
    draft.vertex.projectId,
    draft.vertex.location,
  );

  // Change one part of the draft, for example the Anthropic card.
  const change =
    <Key extends keyof Settings>(key: Key) =>
    (value: Settings[Key]) =>
      setDraft((current) => ({ ...current, [key]: value }));

  async function save(): Promise<boolean> {
    try {
      setSaved(await saveSettings(draft));
    } catch (error) {
      setMessage({ ok: false, text: (error as Error).message });
      return false;
    }
    // The keys are saved now. Empty the key fields.
    setDraft((current) => ({
      ...current,
      openCodeGo: { ...current.openCodeGo, apiKey: "" },
      anthropic: { ...current.anthropic, apiKey: "" },
      openaiCompatible: { ...current.openaiCompatible, apiKey: "" },
    }));
    return true;
  }

  async function onSave() {
    setBusy("save");
    setMessage(null);
    if (await save()) setMessage({ ok: true, text: "Settings saved." });
    setBusy(null);
  }

  // Save first, then send a small request with the saved settings.
  async function onTest() {
    setBusy("test");
    setMessage(null);
    if (await save()) {
      const body = await testConnection();
      setMessage(
        body.ok
          ? { ok: true, text: `The connection works. Model: ${body.model}.` }
          : { ok: false, text: body.error ?? "The model did not answer as expected." },
      );
    }
    setBusy(null);
  }

  // Save first, then read a short sample with the saved voice.
  async function onSample() {
    setBusy("voice");
    setMessage(null);
    if (await save()) {
      try {
        if (draft.readAloud.engine === "google") {
          const url = URL.createObjectURL(await speechClip(SAMPLE));
          const audio = new Audio(url);
          audio.onended = () => URL.revokeObjectURL(url);
          await audio.play();
        } else {
          speechSynthesis.cancel();
          speechSynthesis.speak(new SpeechSynthesisUtterance(SAMPLE));
        }
        setMessage({ ok: true, text: "Settings saved. The voice reads a sample." });
      } catch (error) {
        setMessage({ ok: false, text: (error as Error).message || "The voice did not play." });
      }
    }
    setBusy(null);
  }

  return (
    <div className="space-y-6">
      <ConnectionPicker value={draft.mode} onChange={change("mode")} />

      {draft.mode === "claude-code" && (
        <ClaudeCodeCard value={draft.claudeCode} onChange={change("claudeCode")} />
      )}
      {draft.mode === "opencode" && (
        <OpenCodeCard value={draft.openCode} onChange={change("openCode")} />
      )}
      {draft.mode === "opencode-go" && (
        <OpenCodeGoCard
          value={draft.openCodeGo}
          onChange={change("openCodeGo")}
          keyHint={saved.openCodeGo.keyHint}
        />
      )}
      {draft.mode === "anthropic" && (
        <AnthropicCard
          value={draft.anthropic}
          onChange={change("anthropic")}
          keyHint={saved.anthropic.keyHint}
        />
      )}
      {draft.mode === "openai-compatible" && (
        <OpenAiCompatibleCard
          value={draft.openaiCompatible}
          onChange={change("openaiCompatible")}
          keyHint={saved.openaiCompatible.keyHint}
        />
      )}
      {draft.mode === "vertex" && (
        <VertexCard
          value={draft.vertex}
          onChange={change("vertex")}
          models={vertexModels}
          voiceProjectId={draft.readAloud.googleProjectId}
        />
      )}

      <ReadingFontSetting />

      <ReadAloudCard
        value={draft.readAloud}
        onChange={change("readAloud")}
        onSample={onSample}
        disabled={busy !== null}
        sampling={busy === "voice"}
      />

      {message && (
        <Alert variant={message.ok ? "default" : "destructive"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onSave} disabled={busy !== null}>
          {busy === "save" ? <LoaderCircle className="animate-spin" /> : <Save />}
          Save
        </Button>
        <Button variant="neutral" onClick={onTest} disabled={busy !== null}>
          {busy === "test" ? <LoaderCircle className="animate-spin" /> : <PlugZap />}
          Save and test the connection
        </Button>
      </div>

      <p className="text-muted-foreground">
        Keys are saved in data/settings.json on this computer, in plain text. Git ignores that file.
        The page shows only the last four characters of a saved key.
      </p>
    </div>
  );
}
