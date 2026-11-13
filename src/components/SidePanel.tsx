"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "archsim:side-panel-hidden";

type Props = {
  // The Tailwind width class of the open panel.
  widthClass: string;
  // Called after the panel opens or closes. The canvas must measure its position again.
  onToggle?: () => void;
  children: React.ReactNode;
};

// The left panel of a canvas page. The user can hide it to get more room to draw.
// The content stays loaded while the panel is hidden, so no input is lost.
export default function SidePanel({ widthClass, onToggle, children }: Props) {
  const [hidden, setHidden] = useState(false);

  // Remember the choice in this browser.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(STORAGE_KEY) === "1") setHidden(true);
    } catch {
      // Storage is not available. Start with the panel open.
    }
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => onToggle?.());
    return () => cancelAnimationFrame(frame);
  }, [hidden, onToggle]);

  function toggle() {
    setHidden((current) => {
      try {
        localStorage.setItem(STORAGE_KEY, current ? "0" : "1");
      } catch {
        // Storage is not available. The choice lasts for this page only.
      }
      return !current;
    });
  }

  return (
    <div className="relative z-30 shrink-0">
      <aside
        className={cn("flex h-full flex-col border-r-2 bg-card text-sm leading-relaxed", widthClass, hidden && "hidden")}
      >
        {children}
      </aside>
      {/* The wrapper sets the position. The button does not move on hover, so it is easy to click. */}
      <div className="absolute top-1/2 -right-10 -translate-y-1/2">
        <Button
          variant="neutral"
          size="icon-xs"
          className="shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-main hover:text-main-foreground"
          aria-label={hidden ? "Show the panel" : "Hide the panel"}
          aria-expanded={!hidden}
          title={hidden ? "Show the panel" : "Hide the panel"}
          onClick={toggle}
        >
          {hidden ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </div>
    </div>
  );
}
