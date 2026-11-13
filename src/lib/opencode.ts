import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const TIMEOUT_MS = 5 * 60 * 1000;

type OpenCodeCall = {
  cwd: string;
  prompt: string;
  systemPrompt: string;
  schema: object;
  // In the form provider/model. Empty means the OpenCode default.
  model?: string;
  // The name of an image file in cwd to attach.
  imageName?: string;
};

// The "plan" agent of OpenCode does not edit files. This project file also stops shell commands.
const projectConfig = {
  $schema: "https://opencode.ai/config.json",
  agent: { plan: { permission: { edit: "deny", bash: "deny" } } },
};

// Start a headless OpenCode process and return the text of its answer.
// The process uses the OpenCode login of this computer.
export async function runOpenCode({ cwd, prompt, systemPrompt, schema, model, imageName }: OpenCodeCall): Promise<string> {
  await writeFile(path.join(cwd, "opencode.json"), JSON.stringify(projectConfig, null, 2));

  // OpenCode has no option for a system prompt or a JSON Schema. Put both in the message.
  const message = `${systemPrompt}

Answer with one JSON object and no other text. Do not use tools other than reading the attached file. The object must match this JSON Schema:
${JSON.stringify(schema)}

${prompt}`;

  const args = ["run", "--agent", "plan", "--format", "json"];
  if (model) args.push("--model", model);
  // Use the full path. OpenCode does not find a file by its name alone here.
  if (imageName) args.push("--file", path.join(cwd, imageName));
  args.push("--", message);

  return new Promise((resolve, reject) => {
    // OpenCode reads its folder from the PWD variable, not from the real working folder.
    // Without this, it works in the folder of the app.
    const child = spawn("opencode", args, { cwd, env: { ...process.env, PWD: cwd }, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("OpenCode did not answer in 5 minutes."));
    }, TIMEOUT_MS);

    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(new Error(`Cannot start the opencode command: ${error.message}`));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      // The output is one JSON event on each line. The answer is in the "text" events.
      let text = "";
      let failure = "";
      for (const line of stdout.split("\n")) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);
          if (event.type === "text" && typeof event.part?.text === "string") text += event.part.text;
          if (event.type === "error") failure = event.error?.message ?? event.error?.type ?? "unknown error";
        } catch {
          // Ignore a line that is not JSON.
        }
      }
      if (text) return resolve(text);
      if (/credential|auth|401/i.test(failure)) {
        return reject(new Error(`OpenCode could not sign in to the model provider (${failure}). Run "opencode auth login" in a terminal, or select a different model in Settings.`));
      }
      reject(new Error(`OpenCode failed (exit code ${code}): ${(failure || stderr || stdout || "no output").slice(0, 400)}`));
    });
  });
}
