import { readBody, speechRequest } from "@/lib/requests";
import { readSettings } from "@/lib/store/settings";
import { synthesize } from "@/lib/ai/speech";
import { HTTP } from "@/lib/http-status";

// Return the spoken audio of one sentence with the Google voice in Settings.
export async function POST(request: Request) {
  const body = await readBody(request, speechRequest);
  if (body instanceof Response) return body;
  const { readAloud } = await readSettings();
  if (readAloud.engine !== "google") {
    return Response.json(
      { error: "Google voices are not selected in Settings." },
      { status: HTTP.conflict },
    );
  }
  try {
    const audio = await synthesize(body.text, readAloud);
    return new Response(new Uint8Array(audio), {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: HTTP.badGateway });
  }
}
