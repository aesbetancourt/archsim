import { TriangleAlert } from "lucide-react";
import LinkButton from "@/components/LinkButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import ConfirmButton from "@/components/ConfirmButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getAttempt } from "@/lib/attempts";
import { findKata } from "@/lib/library";
import { dimensions } from "@/lib/rubric";

export default async function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attempt = await getAttempt(id);
  if (!attempt) notFound();
  const kata = await findKata(attempt.kataId);
  const { review } = attempt;

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-6 py-10 text-sm leading-relaxed">
      <header className="flex items-end justify-between gap-6">
        <div>
          <p className="text-muted-foreground">
            Review · {new Date(attempt.createdAt).toLocaleString()}
            {attempt.reviewer && ` · ${attempt.reviewer}`}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{kata?.title ?? attempt.kataId}</h1>
        </div>
        <p className="text-5xl font-semibold tabular-nums tracking-tight text-primary">
          {attempt.overall}
          <span className="text-base font-normal text-muted-foreground"> / 100</span>
        </p>
      </header>

      <p className="text-base">{review.summary}</p>

      <Alert>
        <TriangleAlert />
        <AlertTitle>Top risk</AlertTitle>
        <AlertDescription>{review.top_risk}</AlertDescription>
      </Alert>

      <section className="grid gap-4">
        {dimensions.map(({ id: dimensionId, label }) => {
          const result = review.dimensions.find((dimension) => dimension.id === dimensionId);
          if (!result) return null;
          return (
            <Card key={dimensionId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{label}</CardTitle>
                  <span className="tabular-nums text-muted-foreground">{result.score} / 5</span>
                </div>
                <Progress value={result.score * 20} />
              </CardHeader>
              <CardContent className="space-y-2">
                <p>{result.evidence}</p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Next time:</span> {result.improvement}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {review.strengths.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5">
                {review.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Questions a review board would ask</CardTitle>
            <CardDescription>Answer them before your next attempt.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-1 pl-5">
              {review.defense_questions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your attempt</CardTitle>
          <CardDescription>Style: {attempt.style || "none"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/attempt/${attempt.id}/diagram`}
            alt="Your diagram"
            className="w-full rounded-base border-2 bg-white"
          />
          <div>
            <h3 className="font-medium">Characteristics</h3>
            <p className="whitespace-pre-wrap text-muted-foreground">{attempt.characteristics || "none"}</p>
          </div>
          <div>
            <h3 className="font-medium">Rationale</h3>
            <p className="whitespace-pre-wrap text-muted-foreground">{attempt.rationale || "none"}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        {kata && (
          <LinkButton href={`/kata/${kata.id}`}>Try this kata again</LinkButton>
        )}
        <ConfirmButton
          label="Remove this attempt"
          title="Remove this attempt?"
          description="This removes the attempt, with its diagram and review. You cannot get it back."
          confirmLabel="Remove"
          endpoint={`/api/attempts/${attempt.id}`}
          redirectTo="/"
        />
      </div>
    </main>
  );
}
