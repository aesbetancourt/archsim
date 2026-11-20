import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiKeyField, Field } from "@/components/settings/Field";
import type { Settings } from "@/lib/store/settings";

/**
 * The settings of the OpenCode Go connection.
 * @returns The fields of the connection.
 */
export default function OpenCodeGoCard({
  value,
  onChange,
  keyHint,
}: {
  value: Settings["openCodeGo"];
  onChange: (value: Settings["openCodeGo"]) => void;
  keyHint: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>OpenCode Go</CardTitle>
        <CardDescription>
          The diagram and your text go to OpenCode Go with your key. Get the key in the OpenCode
          Console after you subscribe to Go.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ApiKeyField
          id="go-key"
          value={value.apiKey}
          onChange={(apiKey) => onChange({ ...value, apiKey })}
          keyHint={keyHint}
        />
        <Field
          id="go-model"
          label="Model"
          hint="A Go model ID without the opencode-go/ prefix, for example kimi-k3 or deepseek-v4.1-flash. Select a model that reads images."
        >
          <Input
            id="go-model"
            value={value.model}
            onChange={(event) => onChange({ ...value, model: event.target.value })}
          />
        </Field>
      </CardContent>
    </Card>
  );
}
