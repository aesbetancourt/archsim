"use client";

import {
  CircleCheck,
  KeyRound,
  LoaderCircle,
  type LucideIcon,
  Plug,
  PlugZap,
  Save,
  Terminal,
  Volume2,
} from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Mode, PublicSettings, SpeechEngine } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { googleVoices } from "@/lib/voices";

const modes: { id: Mode; title: string; description: string; icon: LucideIcon }[] = [
  {
    id: "claude-code",
    title: "Claude Code",
    icon: Terminal,
    description: "Uses the Claude Code login on this computer. No API key. This is the default.",
  },
  {
    id: "opencode",
    title: "OpenCode",
    icon: Terminal,
    description:
      "Uses the OpenCode login on this computer, in the same way as Claude Code. No API key in this app.",
  },
  {
    id: "opencode-go",
    title: "OpenCode Go",
    icon: KeyRound,
    description: "Uses an OpenCode Go API key. Requests count against your Go plan limits.",
  },
  {
    id: "anthropic",
    title: "Anthropic API",
    icon: KeyRound,
    description: "Uses an Anthropic API key. Each review is billed to that key.",
  },
  {
    id: "openai-compatible",
    title: "OpenAI-compatible endpoint",
    icon: Plug,
    description:
      "Uses a provider with an endpoint in the OpenAI format: Google Gemini, OpenRouter, OpenAI, or a local model.",
  },
];

const speechEngines: { id: SpeechEngine; title: string; description: string }[] = [
  {
    id: "google",
    title: "Google Cloud voice",
    description:
      "Natural Chirp 3: HD voices. Google bills the project. Each sentence is saved, so a replay is free.",
  },
  {
    id: "browser",
    title: "Browser voice",
    description:
      "The voices of this computer. Free and offline. The quality depends on the system.",
  },
];

const SAMPLE =
  "Every architecture decision is a trade-off. This is the voice that reads your lessons.";

const presets = [
  { name: "Google Gemini", url: "https://generativelanguage.googleapis.com/v1beta/openai" },
  { name: "OpenRouter", url: "https://openrouter.ai/api/v1" },
  { name: "OpenAI", url: "https://api.openai.com/v1" },
  { name: "Ollama (local)", url: "http://localhost:11434/v1" },
];

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function SettingsForm({ initial }: { initial: PublicSettings }) {
  const [saved, setSaved] = useState(initial);
  const [mode, setMode] = useState(initial.mode);
  const [claudeModel, setClaudeModel] = useState(initial.claudeCode.model);
  const [openCodeModel, setOpenCodeModel] = useState(initial.openCode.model);
  const [goKey, setGoKey] = useState("");
  const [goModel, setGoModel] = useState(initial.openCodeGo.model);
  const [anthropicKey, setAnthropicKey] = useState("");
  const [anthropicModel, setAnthropicModel] = useState(initial.anthropic.model);
  const [baseUrl, setBaseUrl] = useState(initial.openaiCompatible.baseUrl);
  const [openaiKey, setOpenaiKey] = useState("");
  const [openaiModel, setOpenaiModel] = useState(initial.openaiCompatible.model);
  const [speechEngine, setSpeechEngine] = useState(initial.readAloud.engine);
  const [projectId, setProjectId] = useState(initial.readAloud.googleProjectId);
  const [voice, setVoice] = useState(initial.readAloud.googleVoice);
  const [busy, setBusy] = useState<"save" | "test" | "voice" | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(): Promise<boolean> {
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        claudeCode: { model: claudeModel },
        openCode: { model: openCodeModel },
        openCodeGo: { apiKey: goKey, model: goModel },
        anthropic: { apiKey: anthropicKey, model: anthropicModel },
        openaiCompatible: { baseUrl, apiKey: openaiKey, model: openaiModel },
        readAloud: { engine: speechEngine, googleProjectId: projectId, googleVoice: voice },
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      setMessage({ ok: false, text: body.error });
      return false;
    }
    setSaved(body);
    setGoKey("");
    setAnthropicKey("");
    setOpenaiKey("");
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
      const response = await fetch("/api/settings/test", { method: "POST" });
      const body = await response.json();
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
        if (speechEngine === "google") {
          const response = await fetch("/api/speech", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: SAMPLE }),
          });
          if (!response.ok) throw new Error((await response.json()).error);
          const url = URL.createObjectURL(await response.blob());
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
      <fieldset className="grid gap-3">
        <legend className="sr-only">Connection</legend>
        {modes.map((item) => (
          <label
            key={item.id}
            className={cn(
              "block cursor-pointer rounded-base border-2 border-border bg-secondary-background p-4 text-left shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-border",
              mode === item.id && "bg-main text-main-foreground",
            )}
          >
            <input
              type="radio"
              name="connection"
              value={item.id}
              checked={mode === item.id}
              onChange={() => setMode(item.id)}
              className="sr-only"
            />
            <span className="flex items-center gap-2 font-medium">
              <item.icon className="size-4" aria-hidden />
              {item.title}
              {mode === item.id && <CircleCheck className="size-4" />}
            </span>
            <span className={mode === item.id ? "" : "text-muted-foreground"}>
              {item.description}
            </span>
          </label>
        ))}
      </fieldset>

      {mode === "claude-code" && (
        <Card>
          <CardHeader>
            <CardTitle>Claude Code</CardTitle>
            <CardDescription>The app starts the claude command for each review.</CardDescription>
          </CardHeader>
          <CardContent>
            <Field
              id="claude-model"
              label="Model"
              hint="Leave empty to use your Claude Code default. Examples: opus, sonnet, fable."
            >
              <Input
                id="claude-model"
                value={claudeModel}
                onChange={(event) => setClaudeModel(event.target.value)}
                placeholder="Default"
              />
            </Field>
          </CardContent>
        </Card>
      )}

      {mode === "opencode" && (
        <Card>
          <CardHeader>
            <CardTitle>OpenCode</CardTitle>
            <CardDescription>
              The app starts the opencode command for each review, with its read-only plan agent.
              The diagram and your text go to the provider of the model you select.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Field
              id="opencode-model"
              label="Model"
              hint="In the form provider/model, for example anthropic/claude-sonnet-5-5. Leave empty to use your OpenCode default. Run opencode models in a terminal to see the list. Select a model that reads images."
            >
              <Input
                id="opencode-model"
                value={openCodeModel}
                onChange={(event) => setOpenCodeModel(event.target.value)}
                placeholder="Default"
              />
            </Field>
          </CardContent>
        </Card>
      )}

      {mode === "opencode-go" && (
        <Card>
          <CardHeader>
            <CardTitle>OpenCode Go</CardTitle>
            <CardDescription>
              The diagram and your text go to OpenCode Go with your key. Get the key in the OpenCode
              Console after you subscribe to Go.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              id="go-key"
              label="API key"
              hint={
                saved.openCodeGo.keyHint
                  ? `A key is saved (${saved.openCodeGo.keyHint}). Leave empty to keep it.`
                  : "No key is saved."
              }
            >
              <Input
                id="go-key"
                type="password"
                autoComplete="off"
                value={goKey}
                onChange={(event) => setGoKey(event.target.value)}
              />
            </Field>
            <Field
              id="go-model"
              label="Model"
              hint="A Go model ID without the opencode-go/ prefix, for example kimi-k3 or deepseek-v4.1-flash. Select a model that reads images."
            >
              <Input
                id="go-model"
                value={goModel}
                onChange={(event) => setGoModel(event.target.value)}
              />
            </Field>
          </CardContent>
        </Card>
      )}

      {mode === "anthropic" && (
        <Card>
          <CardHeader>
            <CardTitle>Anthropic API</CardTitle>
            <CardDescription>
              The diagram and your text go to the Anthropic API with your key.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              id="anthropic-key"
              label="API key"
              hint={
                saved.anthropic.keyHint
                  ? `A key is saved (${saved.anthropic.keyHint}). Leave empty to keep it.`
                  : "No key is saved."
              }
            >
              <Input
                id="anthropic-key"
                type="password"
                autoComplete="off"
                value={anthropicKey}
                onChange={(event) => setAnthropicKey(event.target.value)}
                placeholder="sk-ant-…"
              />
            </Field>
            <Field
              id="anthropic-model"
              label="Model"
              hint="A model ID, for example claude-opus-5-5, claude-sonnet-5-5, or claude-haiku-5-5."
            >
              <Input
                id="anthropic-model"
                value={anthropicModel}
                onChange={(event) => setAnthropicModel(event.target.value)}
              />
            </Field>
          </CardContent>
        </Card>
      )}

      {mode === "openai-compatible" && (
        <Card>
          <CardHeader>
            <CardTitle>OpenAI-compatible endpoint</CardTitle>
            <CardDescription>
              The diagram and your text go to this provider. Select a model that reads images, or
              the review uses only the text list of your diagram.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              id="base-url"
              label="Base URL"
              hint="The app adds /chat/completions to this URL."
            >
              <Input
                id="base-url"
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder="https://…/v1"
              />
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset) => (
                  <Button
                    key={preset.name}
                    type="button"
                    size="xs"
                    variant="neutral"
                    onClick={() => setBaseUrl(preset.url)}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </Field>
            <Field
              id="openai-key"
              label="API key"
              hint={
                saved.openaiCompatible.keyHint
                  ? `A key is saved (${saved.openaiCompatible.keyHint}). Leave empty to keep it.`
                  : "No key is saved. A local model does not need one."
              }
            >
              <Input
                id="openai-key"
                type="password"
                autoComplete="off"
                value={openaiKey}
                onChange={(event) => setOpenaiKey(event.target.value)}
              />
            </Field>
            <Field id="openai-model" label="Model" hint="The model name as the provider writes it.">
              <Input
                id="openai-model"
                value={openaiModel}
                onChange={(event) => setOpenaiModel(event.target.value)}
              />
            </Field>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="size-4" aria-hidden /> Read aloud
          </CardTitle>
          <CardDescription>
            The voice that reads the lessons. Press Alt+R on a lesson, or click the play button next
            to a paragraph.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <fieldset className="grid gap-2 sm:grid-cols-2">
            <legend className="sr-only">Voice engine</legend>
            {speechEngines.map((item) => (
              <label
                key={item.id}
                className={cn(
                  "block cursor-pointer rounded-base border-2 border-border p-3 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-border",
                  speechEngine === item.id
                    ? "bg-main text-main-foreground"
                    : "bg-secondary-background",
                )}
              >
                <input
                  type="radio"
                  name="speech-engine"
                  value={item.id}
                  checked={speechEngine === item.id}
                  onChange={() => setSpeechEngine(item.id)}
                  className="sr-only"
                />
                <span className="flex items-center gap-2 font-medium">
                  {item.title}
                  {speechEngine === item.id && <CircleCheck className="size-4" />}
                </span>
                <span className={speechEngine === item.id ? "" : "text-muted-foreground"}>
                  {item.description}
                </span>
              </label>
            ))}
          </fieldset>
          {speechEngine === "google" && (
            <>
              <Field
                id="gcp-project"
                label="Google Cloud project ID"
                hint="The project that pays for the voice. The Text-to-Speech API must be on in it. Leave empty to use the quota project of your login. Log in one time with: gcloud auth application-default login"
              >
                <Input
                  id="gcp-project"
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                  placeholder="my-project-id"
                  autoComplete="off"
                  spellCheck={false}
                />
              </Field>
              <Field id="gcp-voice" label="Voice">
                <select
                  id="gcp-voice"
                  value={voice}
                  onChange={(event) => setVoice(event.target.value)}
                  className="flex h-10 w-full rounded-base border-2 border-border bg-secondary-background px-3 text-sm"
                >
                  {googleVoices.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}
          <Button variant="neutral" onClick={onSample} disabled={busy !== null}>
            {busy === "voice" ? <LoaderCircle className="animate-spin" /> : <Volume2 />}
            Save and play a sample
          </Button>
        </CardContent>
      </Card>

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
