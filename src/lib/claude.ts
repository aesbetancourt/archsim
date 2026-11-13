import { spawn } from "node:child_process";

const TIMEOUT_MS = 5 * 60 * 1000;

type ClaudeCall = {
  cwd: string;
  prompt: string;
  systemPrompt: string;
  schema: object;
};

// Start a headless Claude Code process and return its structured output.
// The process uses the local Claude Code login. It can only read files in cwd.
export function runClaude({ cwd, prompt, systemPrompt, schema }: ClaudeCall): Promise<unknown> {
  const args = [
    "-p",
    prompt,
    "--safe-mode",
    "--restricted",
    "--tools",
    "Read",
    "--permission-prompts",
    "none",
    "--no-session-persistence",
    "--output-format",
    "json",
    "--system-prompt",
    systemPrompt,
    "--json-schema",
    JSON.stringify(schema),
  ];
  if (process.env.ARCHSIM_MODEL) {
    args.push("--model", process.env.ARCHSIM_MODEL);
  }

  return new Promise((resolve, reject) => {
    const child = spawn("claude", args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("Claude Code did not answer in 5 minutes."));
    }, TIMEOUT_MS);

    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(new Error(`Cannot start the claude command: ${error.message}`));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      try {
        const result = JSON.parse(stdout);
        if (result.is_error || !result.structured_output) {
          throw new Error(result.result || "Claude Code returned no structured output.");
        }
        resolve(result.structured_output);
      } catch (error) {
        const detail = error instanceof SyntaxError ? stderr || stdout : (error as Error).message;
        reject(new Error(`Claude Code failed (exit code ${code}): ${detail.slice(0, 500)}`));
      }
    });
  });
}
