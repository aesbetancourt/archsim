import { insightsHtml, insightsSchema, parseInsights } from "@/lib/ai/insights";
import { insightsStatus, startInsightsJob } from "@/lib/ai/insights-job";
import { runModel } from "@/lib/ai/model";
import { addInsightsDocument, readNotebook } from "@/lib/store/notebook";
import { plural } from "@/lib/text";
import { readArticle } from "@/lib/content/wiki";
import { buildInsightsPrompt, insightsSystemPrompt } from "@/prompts/insights";

// The state of the background job, so the notebook page can show it after a reload.
export async function GET() {
  return Response.json(insightsStatus());
}

// Start to write an insights document from all the marks of the notebook. The work continues in
// the background, and the document is saved as a general note when it is ready.
export async function POST() {
  const notebook = await readNotebook();
  // The bookmarked sections come with their lesson text.
  const slugs = new Set(
    notebook.bookmarks.flatMap((item) => item.page.match(/^\/learn\/([a-z0-9-]+)$/)?.[1] ?? []),
  );
  const articles = Object.fromEntries(
    await Promise.all([...slugs].map(async (slug) => [slug, (await readArticle(slug)) ?? ""])),
  );
  const built = buildInsightsPrompt(notebook, articles);
  if (!built) {
    return Response.json(
      {
        error: "The notebook is empty. Bookmark a heading, highlight text, or write a note first.",
      },
      { status: 400 },
    );
  }

  // A second click while a job runs does not start another one.
  startInsightsJob(async () => {
    const { output, model } = await runModel({
      prompt: built.prompt,
      systemPrompt: insightsSystemPrompt,
      schema: insightsSchema,
    });
    const insights = parseInsights(output);
    const { bookmarks, highlights, notes } = built.counts;
    const date = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date());
    const byline = `Made on ${date} by ${model}, from ${plural(bookmarks, "bookmark")}, ${plural(highlights, "highlight")}, and ${plural(notes, "note")}.`;
    await addInsightsDocument(`Insights · ${insights.title}`, insightsHtml(insights, byline));
  });
  return Response.json(insightsStatus(), { status: 202 });
}
