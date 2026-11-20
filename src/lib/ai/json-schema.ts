// Short forms for the JSON Schemas that a model output must match.
// Each provider gets the same schema, so use only the parts that all of them accept.

/** The schema of a string. */
export const text = { type: "string" };
/** The schema of a list of strings. */
export const textList = { type: "array", items: text };

/**
 * The schema of an object with no extra properties.
 * Each property is required, unless it is in the optional list.
 * @param properties The schema of each property, by name.
 * @param optional The names of the properties that are not required.
 * @returns The schema of the object.
 * @example
 * object({ question: text, answer: text });
 * object({ title: text, users: text }, ["users"]);
 */
export const object = (properties: Record<string, object>, optional: string[] = []) => ({
  type: "object",
  additionalProperties: false,
  required: Object.keys(properties).filter((key) => !optional.includes(key)),
  properties,
});
