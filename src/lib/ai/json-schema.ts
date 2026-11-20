// Short forms for the JSON Schemas that a model output must match.
// Each provider gets the same schema, so use only the parts that all of them accept.

export const text = { type: "string" };
export const textList = { type: "array", items: text };

// An object with no extra properties. Each property is required, unless it is in the optional list.
export const object = (properties: Record<string, object>, optional: string[] = []) => ({
  type: "object",
  additionalProperties: false,
  required: Object.keys(properties).filter((key) => !optional.includes(key)),
  properties,
});
