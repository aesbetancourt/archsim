import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { GoogleAuth } from "google-auth-library";
import type { ReadAloud } from "@/lib/store/settings";

const ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize";

// The login is the Application Default Credentials of this computer:
// `gcloud auth application-default login`, or a service account file in GOOGLE_APPLICATION_CREDENTIALS.
const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });

// The audio of each sentence is saved in the data folder. The lesson text does not change often,
// so each sentence costs money only one time.
const cacheFile = (voice: string, text: string) =>
  path.join(
    process.cwd(),
    "data",
    "speech",
    `${createHash("sha256").update(`${voice}\n${text}`).digest("hex")}.mp3`,
  );

async function requestHeaders(projectId: string): Promise<Headers> {
  let headers: Headers;
  try {
    headers = await auth.getRequestHeaders(ENDPOINT);
  } catch {
    throw new Error(
      "There is no Google Cloud login on this computer. Run: gcloud auth application-default login",
    );
  }
  // A user login bills the quota project. The project ID in Settings replaces the default one.
  if (projectId) headers.set("x-goog-user-project", projectId);
  headers.set("Content-Type", "application/json");
  return headers;
}

// Return the MP3 audio of one sentence, from the cache or from Google Cloud Text-to-Speech.
export async function synthesize(
  text: string,
  { googleProjectId, googleVoice }: ReadAloud,
): Promise<Buffer> {
  const file = cacheFile(googleVoice, text);
  try {
    return await readFile(file);
  } catch {
    // The sentence is not in the cache yet.
  }

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: await requestHeaders(googleProjectId),
    body: JSON.stringify({
      input: { text },
      // The language code is the start of the voice name, for example en-US.
      voice: { languageCode: googleVoice.split("-").slice(0, 2).join("-"), name: googleVoice },
      audioConfig: { audioEncoding: "MP3" },
    }),
  });
  const body = (await response.json().catch(() => ({}))) as {
    audioContent?: string;
    error?: { message?: string };
  };
  if (!response.ok || !body.audioContent) {
    throw new Error(
      `Google Text-to-Speech did not answer (${response.status}). ${body.error?.message ?? ""}`.trim(),
    );
  }

  const audio = Buffer.from(body.audioContent, "base64");
  await mkdir(path.dirname(file), { recursive: true });
  // Write a new file, then replace. Two requests for the same sentence do not damage the file.
  const temporary = `${file}.${process.pid}-${Math.random().toString(36).slice(2, 8)}.tmp`;
  await writeFile(temporary, audio);
  await rename(temporary, file);
  return audio;
}
