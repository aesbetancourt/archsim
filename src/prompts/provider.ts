// The words that a provider needs around a prompt. They belong to no single feature.
// lib/model.ts and lib/opencode.ts add them.

// Claude Code reads the diagram from a file in its working directory.
export function readImageFirst(fileName: string, prompt: string): string {
  return `Read the file ${fileName} in the current directory before you answer.\n\n${prompt}`;
}

// Some providers reject a JSON Schema in the request. Then the schema goes in the system prompt.
export function withJsonSchema(systemPrompt: string, schema: object): string {
  return `${systemPrompt}\n\nAnswer with one JSON object and no other text. It must match this JSON Schema:\n${JSON.stringify(schema)}`;
}

// OpenCode has no option for a system prompt or a JSON Schema. Both go in the message.
export function openCodeMessage(systemPrompt: string, schema: object, prompt: string): string {
  return `${systemPrompt}

Answer with one JSON object and no other text. Do not use tools other than reading the attached file. The JSON must be valid: when you quote words inside a text value, use single quotes, and do not put a line break inside a text value. The object must match this JSON Schema:
${JSON.stringify(schema)}

${prompt}`;
}
