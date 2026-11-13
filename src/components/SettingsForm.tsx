"use client";

import { CircleCheck, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Mode, PublicSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

const modes: { id: Mode; title: string; description: string }[] = [
  {
    id: "claude-code",
    title: "Claude Code",
    description: "Uses the Claude Code login on this computer. No API key. This is the default.",
  },
  {
    id: "anthropic",
    title: "Anthropic API",
    description: "Uses an Anthropic API key. Each review is billed to that key.",
  },
  {
    id: "openai-compatible",
    title: "OpenAI-compatible endpoint",
    description: "Uses a provider with an endpoint in the OpenAI format: Google Gemini, OpenRouter, OpenAI, or a local model.",
  },
];

const presets = [
  { name: "Google Gemini", url: "https://generativelanguage.googleapis.com/v1beta/openai" },
  { name: "OpenRouter", url: "https://openrouter.ai/api/v1" },
  { name: "OpenAI", url: "https://api.openai.com/v1" },
  { name: "Ollama (local)", url: "http://localhost:11434/v1" },
];

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
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
  const [anthropicKey, setAnthropicKey] = useState("");
  const [anthropicModel, setAnthropicModel] = useState(initial.anthropic.model);
  const [baseUrl, setBaseUrl] = useState(initial.openaiCompatible.baseUrl);
  const [openaiKey, setOpenaiKey] = useState("");
  const [openaiModel, setOpenaiModel] = useState(initial.openaiCompatible.model);
  const [busy, setBusy] = useState<"save" | "test" | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(): Promise<boolean> {
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        claudeCode: { model: claudeModel },
        anthropic: { apiKey: anthropicKey, model: anthropicModel },
        openaiCompatible: { baseUrl, apiKey: openaiKey, model: openaiModel },
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      setMessage({ ok: false, text: body.error });
      return false;
    }
    setSaved(body);
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

  return (
    <div className="space-y-6">
      <div className="grid gap-3" role="radiogroup" aria-label="Connection">
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={mode === item.id}
            onClick={() => setMode(item.id)}
            className={cn(
              "rounded-base border-2 border-border bg-secondary-background p-4 text-left shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
              mode === item.id && "bg-main text-main-foreground",
            )}
          >
            <span className="flex items-center gap-2 font-medium">
              {item.title}
              {mode === item.id && <CircleCheck className="size-4" />}
            </span>
            <span className={mode === item.id ? "" : "text-muted-foreground"}>{item.description}</span>
          </button>
        ))}
      </div>

      {mode === "claude-code" && (
        <Card>
          <CardHeader>
            <CardTitle>Claude Code</CardTitle>
            <CardDescription>The app starts the claude command for each review.</CardDescription>
          </CardHeader>
          <CardContent>
            <Field id="claude-model" label="Model" hint="Leave empty to use your Claude Code default. Examples: opus, sonnet, fable.">
              <Input id="claude-model" value={claudeModel} onChange={(event) => setClaudeModel(event.target.value)} placeholder="Default" />
            </Field>
          </CardContent>
        </Card>
      )}

      {mode === "anthropic" && (
        <Card>
          <CardHeader>
            <CardTitle>Anthropic API</CardTitle>
            <CardDescription>The diagram and your text go to the Anthropic API with your key.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              id="anthropic-key"
              label="API key"
              hint={saved.anthropic.keyHint ? `A key is saved (${saved.anthropic.keyHint}). Leave empty to keep it.` : "No key is saved."}
            >
              <Input id="anthropic-key" type="password" autoComplete="off" value={anthropicKey} onChange={(event) => setAnthropicKey(event.target.value)} placeholder="sk-ant-…" />
            </Field>
            <Field id="anthropic-model" label="Model" hint="A model ID, for example claude-opus-5-5, claude-sonnet-5-5, or claude-haiku-5-5.">
              <Input id="anthropic-model" value={anthropicModel} onChange={(event) => setAnthropicModel(event.target.value)} />
            </Field>
          </CardContent>
        </Card>
      )}

      {mode === "openai-compatible" && (
        <Card>
          <CardHeader>
            <CardTitle>OpenAI-compatible endpoint</CardTitle>
            <CardDescription>
              The diagram and your text go to this provider. Select a model that reads images, or the
              review uses only the text list of your diagram.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field id="base-url" label="Base URL" hint="The app adds /chat/completions to this URL.">
              <Input id="base-url" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder="https://…/v1" />
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset) => (
                  <Button key={preset.name} type="button" size="xs" variant="neutral" onClick={() => setBaseUrl(preset.url)}>
                    {preset.name}
                  </Button>
                ))}
              </div>
            </Field>
            <Field
              id="openai-key"
              label="API key"
              hint={saved.openaiCompatible.keyHint ? `A key is saved (${saved.openaiCompatible.keyHint}). Leave empty to keep it.` : "No key is saved. A local model does not need one."}
            >
              <Input id="openai-key" type="password" autoComplete="off" value={openaiKey} onChange={(event) => setOpenaiKey(event.target.value)} />
            </Field>
            <Field id="openai-model" label="Model" hint="The model name as the provider writes it.">
              <Input id="openai-model" value={openaiModel} onChange={(event) => setOpenaiModel(event.target.value)} />
            </Field>
          </CardContent>
        </Card>
      )}

      {message && (
        <Alert variant={message.ok ? "default" : "destructive"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onSave} disabled={busy !== null}>
          {busy === "save" && <LoaderCircle className="animate-spin" />}
          Save
        </Button>
        <Button variant="neutral" onClick={onTest} disabled={busy !== null}>
          {busy === "test" && <LoaderCircle className="animate-spin" />}
          Save and test the connection
        </Button>
      </div>

      <p className="text-muted-foreground">
        Keys are saved in data/settings.json on this computer, in plain text. Git ignores that
        file. The page shows only the last four characters of a saved key.
      </p>
    </div>
  );
}
