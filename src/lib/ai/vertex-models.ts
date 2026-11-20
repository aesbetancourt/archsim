import { GoogleAuth } from "google-auth-library";

// The models of Vertex AI that can write a review: they read text and an image, and answer in
// text. Speech, image, embedding, live audio, and transcription models cannot.
const NOT_FOR_TEXT = /(tts|image|embedding|live|transcribe|translate|nano-banana|omni|robotics)/;

/** The model IDs that Vertex AI offers, by publisher. */
export type VertexModels = { gemini: string[]; claude: string[] };

// Sort model IDs with the newest version first: gemini-4-neon before gemini-3.8-flash.
const newestFirst = (a: string, b: string) => b.localeCompare(a, "en", { numeric: true });

/**
 * Keep the Gemini models that can write a review, newest first.
 * @param names The model IDs from Vertex AI.
 * @returns The Gemini text models, with the newest version first.
 * @example
 * textModels(["gemini-3.8-flash", "gemini-4-neon", "gemini-4-tts"]); // ["gemini-4-neon", "gemini-3.8-flash"]
 */
export function textModels(names: string[]): string[] {
  return names
    .filter((name) => name.startsWith("gemini-") && !NOT_FOR_TEXT.test(name))
    .sort(newestFirst);
}

const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });

// The address of Vertex AI for a location. The global location has no region in the name.
const host = (location: string) =>
  location === "global" ? "aiplatform.googleapis.com" : `${location}-aiplatform.googleapis.com`;

async function publisherModels(publisher: string, location: string, project: string) {
  const url = `https://${host(location)}/v1beta1/publishers/${publisher}/models?pageSize=300&listAllVersions=false`;
  const headers = await auth.getRequestHeaders(url);
  // A user login bills the quota project. The project in Settings replaces the default one.
  if (project) headers.set("x-goog-user-project", project);
  const response = await fetch(url, { headers });
  const body = (await response.json().catch(() => ({}))) as {
    publisherModels?: { name: string }[];
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(
      `Vertex AI did not list the models (${response.status}). ${body.error?.message ?? ""}`.trim(),
    );
  }
  return (body.publisherModels ?? []).map((model) => model.name.split("/").pop() ?? "");
}

/**
 * The models that Vertex AI offers in a location: Gemini, and Claude from the Model Garden.
 * A Claude model in this list must still be enabled in the Model Garden of the project.
 * @param project The Google Cloud project that pays the quota. Empty means the project of the login.
 * @param location The Vertex AI location, for example "global" or "us-east5".
 * @returns The Gemini models and the Claude models, newest first. The Claude list is empty when it fails.
 * @throws When there is no Google Cloud login on this computer.
 * @throws When Vertex AI does not list the Gemini models.
 * @example
 * const { gemini, claude } = await listVertexModels("my-project", "global");
 */
export async function listVertexModels(project: string, location: string): Promise<VertexModels> {
  try {
    await auth.getRequestHeaders();
  } catch {
    throw new Error(
      "There is no Google Cloud login on this computer. Run: gcloud auth application-default login",
    );
  }
  const [gemini, claude] = await Promise.all([
    publisherModels("google", location, project),
    publisherModels("anthropic", location, project).catch(() => []),
  ]);
  return {
    gemini: textModels(gemini),
    claude: claude.filter((name) => name.startsWith("claude-")).sort(newestFirst),
  };
}
