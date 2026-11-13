import { ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
        <h1 className="text-3xl font-semibold tracking-tight">{COMMUNITY_SOURCE.name}</h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          The architecture kata is an idea of {COMMUNITY_SOURCE.owner}. This page shows the katas
          from his public collection. Each kata belongs to its author.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={COMMUNITY_SOURCE.url} target="_blank" rel="noreferrer">
              The collection on GitHub <ExternalLink />
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={COMMUNITY_SOURCE.site} target="_blank" rel="noreferrer">
              The original website <ExternalLink />
            </a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/community?refresh=1">Download the list again</Link>
          </Button>
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
              <Button size="sm" asChild>
                <Link href={`/kata/${kata.id}`}>
                  Start <ArrowRight />
                </Link>
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <Link href={`/solve?kata=${kata.id}`}>Get a worked answer</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
}
