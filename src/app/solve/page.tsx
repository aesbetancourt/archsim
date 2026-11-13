import SolveForm from "@/components/SolveForm";

export default function SolvePage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-6 py-10 text-sm leading-relaxed">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Solve a problem</h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Paste the text of a design problem, for example an interview question. Claude writes a
          worked answer with the five-step method. The problem is also added to your katas, so you
          can try it with your own design.
        </p>
      </header>
      <SolveForm />
    </main>
  );
}
