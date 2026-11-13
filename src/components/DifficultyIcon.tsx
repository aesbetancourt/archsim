const levels: Record<string, number> = { starter: 1, medium: 2, hard: 3 };
const heights = ["h-1.5", "h-2.5", "h-3.5"];

// Three bars show how hard a kata is. One filled bar is a starter kata, three is a hard one.
export default function DifficultyIcon({ level }: { level: string }) {
  const filled = levels[level] ?? 1;
  return (
    <span className="flex h-3.5 items-end gap-0.5" aria-hidden>
      {heights.map((height, index) => (
        <span
          key={height}
          className={`w-1 rounded-[1px] border border-current ${height} ${index < filled ? "bg-current" : "opacity-40"}`}
        />
      ))}
    </span>
  );
}
