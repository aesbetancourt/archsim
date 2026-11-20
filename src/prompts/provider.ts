// The words that a provider needs around a prompt. They belong to no single feature.
// lib/ai/model.ts and lib/ai/opencode.ts add them.

/**
 * Tell Claude Code to read the diagram first. Claude Code reads it from a file in its working
 * directory.
 * @param fileName The name of the image file in the working directory.
 * @param prompt The prompt of the feature.
 * @returns The prompt, after an instruction to read the file.
 * @example
 * readImageFirst("diagram.png", prompt);
 */
export function readImageFirst(fileName: string, prompt: string): string {
  return `Read the file ${fileName} in the current directory before you answer.\n\n${prompt}`;
}

/**
 * Put the JSON Schema of the output in the system prompt. Use it for a provider that rejects a
 * JSON Schema in the request.
 * @param systemPrompt The system prompt of the feature.
 * @param schema The JSON Schema that the answer must match.
 * @returns The system prompt, with an instruction to answer with JSON that matches the schema.
 * @example
 * const system = withJsonSchema(call.systemPrompt, call.schema);
 */
export function withJsonSchema(systemPrompt: string, schema: object): string {
  return `${systemPrompt}\n\nAnswer with one JSON object and no other text. It must match this JSON Schema:\n${JSON.stringify(schema)}`;
}

/**
 * Write the one message for OpenCode. OpenCode has no option for a system prompt or a JSON
 * Schema, so both go in the message.
 * @param systemPrompt The system prompt of the feature.
 * @param schema The JSON Schema that the answer must match.
 * @param prompt The prompt of the feature.
 * @returns The system prompt, the rules for the JSON answer, and the prompt, in that order.
 * @example
 * const message = openCodeMessage(systemPrompt, schema, prompt);
 */
export function openCodeMessage(systemPrompt: string, schema: object, prompt: string): string {
  return `${systemPrompt}

Answer with one JSON object and no other text. Do not use tools other than reading the attached file. The JSON must be valid: when you quote words inside a text value, use single quotes, and do not put a line break inside a text value. The object must match this JSON Schema:
${JSON.stringify(schema)}

${prompt}`;
}
