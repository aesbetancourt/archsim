import { Component, Cpu, Cylinder, Database, MonitorSmartphone, Scan, Shapes, Square, SquareDashed, User } from "lucide-react";
import type { BlockShape } from "@/lib/blocks";

const dash: Partial<Record<BlockShape, string>> = { call: "none", message: "4 3", replication: "1.5 3" };

// A small icon that shows the form of a piece on the canvas.
export default function BlockIcon({ shape }: { shape: BlockShape }) {
  const className = "size-3 shrink-0";
  const pattern = dash[shape];
  if (pattern) {
    // An arrow with the line style of the connection.
    return (
      <svg viewBox="0 0 24 12" className="h-3 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M2 6H19" strokeDasharray={pattern} />
        <path d="M17 2l4 4-4 4" />
      </svg>
    );
  }
  if (shape === "store") return <Database className={className} aria-hidden />;
  if (shape === "pipe") return <Cylinder className={`${className} rotate-90`} aria-hidden />;
  if (shape === "person") return <User className={className} aria-hidden />;
  if (shape === "actor") return <MonitorSmartphone className={className} aria-hidden />;
  if (shape === "device") return <Cpu className={className} aria-hidden />;
  if (shape === "module") return <Component className={className} aria-hidden />;
  if (shape === "external") return <SquareDashed className={className} aria-hidden />;
  if (shape === "boundary") return <Scan className={className} aria-hidden />;
  if (shape === "pattern") return <Shapes className={className} aria-hidden />;
  return <Square className={className} aria-hidden />;
}
