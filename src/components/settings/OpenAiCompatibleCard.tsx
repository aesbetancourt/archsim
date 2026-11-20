import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiKeyField, Field } from "@/components/settings/Field";
import type { Settings } from "@/lib/store/settings";

// The base URL of some providers with an endpoint in the OpenAI format.
const presets = [
  { name: "Google Gemini", url: "https://generativelanguage.googleapis.com/v1beta/openai" },
  { name: "OpenRouter", url: "https://openrouter.ai/api/v1" },
  { name: "OpenAI", url: "https://api.openai.com/v1" },
  { name: "Ollama (local)", url: "http://localhost:11434/v1" },
];

// The settings of a provider with an endpoint in the OpenAI format. This is also the way to use a
// local model, for example with Ollama.
export default function OpenAiCompatibleCard({
  value,
  onChange,
  keyHint,
}: {
  value: Settings["openaiCompatible"];
  onChange: (value: Settings["openaiCompatible"]) => void;
  keyHint: string;
}) {
  return (
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
          <Input
            id="base-url"
            value={value.baseUrl}
            onChange={(event) => onChange({ ...value, baseUrl: event.target.value })}
            placeholder="https://…/v1"
          />
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset) => (
              <Button
                key={preset.name}
                type="button"
                size="xs"
                variant="neutral"
                onClick={() => onChange({ ...value, baseUrl: preset.url })}
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </Field>
        <ApiKeyField
          id="openai-key"
          value={value.apiKey}
          onChange={(apiKey) => onChange({ ...value, apiKey })}
          keyHint={keyHint}
          noKey="No key is saved. A local model does not need one."
        />
        <Field id="openai-model" label="Model" hint="The model name as the provider writes it.">
          <Input
            id="openai-model"
            value={value.model}
            onChange={(event) => onChange({ ...value, model: event.target.value })}
          />
        </Field>
      </CardContent>
    </Card>
  );
}
