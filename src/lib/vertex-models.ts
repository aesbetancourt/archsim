import { GoogleAuth } from "google-auth-library";

// The models of Vertex AI that can write a review: they read text and an image, and answer in
// text. Speech, image, embedding, live audio, and transcription models cannot.
const NOT_FOR_TEXT = /(tts|image|embedding|live|transcribe|translate|nano-banana|omni|robotics)/;

export type VertexModels = { gemini: string[]; claude: string[] };

// Sort model IDs with the newest version first: gemini-4-neon before gemini-3.8-flash.
const newestFirst = (a: string, b: string) => b.localeCompare(a, "en", { numeric: true });

// Keep the Gemini models that can write a review, newest first.
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

// The models that Vertex AI offers in a location: Gemini, and Claude from the Model Garden.
// A Claude model in this list must still be enabled in the Model Garden of the project.
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
