"use client";

import { MoveHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * The frame of a lesson table. A table wider than the page scrolls to the side.
 * Then a fade shows on each side that has more columns, and a line under the table says so.
 * @returns The table in its frame.
 */
export default function TableFrame({ children }: { children: React.ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ left: false, right: false });

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const measure = () => {
      const end = element.scrollWidth - element.clientWidth;
      setMore({ left: element.scrollLeft > 1, right: element.scrollLeft < end - 1 });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    element.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener("scroll", measure);
    };
  }, []);

  const fade = "pointer-events-none absolute inset-y-0.5 w-10 transition-opacity";
  return (
    <div className="space-y-1.5">
      <div className="relative">
        <div
          ref={frame}
          className="overflow-x-auto border-t-2 border-b border-t-foreground border-b-edge bg-card"
        >
          {children}
        </div>
        <div
          aria-hidden
          className={`${fade} left-0.5 rounded-l-base bg-linear-to-r from-foreground/20 to-transparent ${more.left ? "opacity-100" : "opacity-0"}`}
        />
        <div
          aria-hidden
          className={`${fade} right-0.5 rounded-r-base bg-linear-to-l from-foreground/20 to-transparent ${more.right ? "opacity-100" : "opacity-0"}`}
        />
      </div>
      {(more.left || more.right) && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MoveHorizontal className="size-3.5" aria-hidden /> Scroll sideways to see all the
          columns.
        </p>
      )}
    </div>
  );
}
