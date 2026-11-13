import { ArrowRight, ExternalLink, Library, RefreshCw, Sparkles } from "lucide-react";
import LinkButton from "@/components/LinkButton";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { COMMUNITY_SOURCE, loadCommunity } from "@/lib/community";
import type { Kata } from "@/lib/katas";

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ refresh?: string }>;
}) {
  const { refresh } = await searchParams;
  let katas: Kata[] = [];
  let error = "";
  try {
    katas = await loadCommunity(refresh === "1");
  } catch (caught) {
    error = (caught as Error).message;
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 px-6 py-10 text-sm leading-relaxed">
      <header className="space-y-3">
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          <Library className="size-7 shrink-0 text-primary" aria-hidden />
          {COMMUNITY_SOURCE.name}
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          The architecture kata is an idea of {COMMUNITY_SOURCE.owner}. This page shows the katas
          from his public collection. Each kata belongs to its author.
        </p>
        <div className="flex flex-wrap gap-2">
          <LinkButton variant="neutral" size="sm" href={COMMUNITY_SOURCE.url}>
              The collection on GitHub <ExternalLink />
            </LinkButton>
          <LinkButton variant="neutral" size="sm" href={COMMUNITY_SOURCE.site}>
              The original website <ExternalLink />
            </LinkButton>
          <LinkButton variant="ghost" size="sm" href="/community?refresh=1">
            <RefreshCw /> Download the list again
          </LinkButton>
        </div>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>The katas did not load.</AlertTitle>
          <AlertDescription>{error} Make sure you are online, then open this page again.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {katas.map((kata) => (
          <Card key={kata.id}>
            <CardHeader>
              <CardTitle>{kata.title}</CardTitle>
              {kata.source?.credit && (
                <p className="text-xs text-muted-foreground">by {kata.source.credit}</p>
              )}
              <CardDescription className="line-clamp-4">{kata.context}</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto gap-2">
              <LinkButton size="sm" href={`/kata/${kata.id}`}>
                  Start <ArrowRight />
                </LinkButton>
              <LinkButton size="sm" variant="ghost" href={`/solve?kata=${kata.id}`}>
                <Sparkles /> Get a worked answer
              </LinkButton>
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
}
