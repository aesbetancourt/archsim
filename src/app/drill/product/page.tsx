import { Calculator } from "lucide-react";
import Link from "next/link";
import ProductDrill from "@/components/ProductDrill";
import { productLessons, readProductCases } from "@/lib/product-drill";

// Read the cases on each request, so a new case in the file shows at once.
export const dynamic = "force-dynamic";

export default async function ProductDrillPage() {
  const cases = await readProductCases();
  const sections = Object.keys(productLessons).filter((section) =>
    cases.some((item) => item.section === section),
  );

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-6 py-10 text-sm leading-relaxed">
      <header className="space-y-3">
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          <Calculator className="size-7 shrink-0 text-primary" aria-hidden />
          Product drill
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Practice the {cases.length} product cases that interviewers ask engineers: what a feature
          costs, how you prove that it works, who pays, what comes first, and when the user gets the
          result. Commit to a number or a position first. Then give your assumptions and the
          arithmetic.
        </p>
        <p className="text-muted-foreground">
          Each price in a case is an assumption for practice. Real prices change. The AI check does
          the arithmetic again and tells you where it is wrong. Your progress is saved in this
          browser. For design questions, use the{" "}
          <Link href="/drill/questions" className="text-primary hover:underline">
            question drill
          </Link>
          .
        </p>
      </header>
      <ProductDrill cases={cases} sections={sections} />
    </main>
  );
}
