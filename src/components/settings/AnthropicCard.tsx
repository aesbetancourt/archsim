import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiKeyField, Field } from "@/components/settings/Field";
import type { Settings } from "@/lib/store/settings";

/**
 * The settings of the Anthropic API connection.
 * @returns The fields of the connection.
 */
export default function AnthropicCard({
  value,
  onChange,
  keyHint,
}: {
  value: Settings["anthropic"];
  onChange: (value: Settings["anthropic"]) => void;
  keyHint: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Anthropic API</CardTitle>
        <CardDescription>
          The diagram and your text go to the Anthropic API with your key.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ApiKeyField
          id="anthropic-key"
          value={value.apiKey}
          onChange={(apiKey) => onChange({ ...value, apiKey })}
          keyHint={keyHint}
          placeholder="sk-ant-…"
        />
        <Field
          id="anthropic-model"
          label="Model"
          hint="A model ID, for example claude-opus-5-5, claude-sonnet-5-5, or claude-haiku-5-5."
        >
          <Input
            id="anthropic-model"
            value={value.model}
            onChange={(event) => onChange({ ...value, model: event.target.value })}
          />
        </Field>
      </CardContent>
    </Card>
  );
}
