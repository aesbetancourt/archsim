import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/settings/Field";
import type { Settings } from "@/lib/store/settings";

/**
 * The settings of the OpenCode connection.
 * @returns The fields of the connection.
 */
export default function OpenCodeCard({
  value,
  onChange,
}: {
  value: Settings["openCode"];
  onChange: (value: Settings["openCode"]) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>OpenCode</CardTitle>
        <CardDescription>
          The app starts the opencode command for each review, with its read-only plan agent. The
          diagram and your text go to the provider of the model you select.
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
            value={value.model}
            onChange={(event) => onChange({ model: event.target.value })}
            placeholder="Default"
          />
        </Field>
      </CardContent>
    </Card>
  );
}
