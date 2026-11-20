"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import type * as React from "react";
import { cn } from "@/lib/utils";

// The tooltips of the app. They open faster than the browser's own, and they follow the theme.
// Use them for buttons that show only an icon. A button with a text label needs no tooltip.

// Put once around the app. The next tooltip opens at once when the pointer moves along a toolbar.
function TooltipProvider({
  delay = 300,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delay={delay} {...props} />;
}

// One element with a short label. The element must accept a ref, for example a Button.
function Tip({
  label,
  side = "bottom",
  children,
}: {
  label: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  children: React.ReactElement;
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger render={children} />
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner side={side} sideOffset={6} className="z-50">
          <TooltipPrimitive.Popup
            className={cn(
              "max-w-64 rounded-base border border-border bg-foreground px-2 py-1 text-xs text-background shadow-float",
              "origin-(--transform-origin) transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0",
            )}
          >
            {label}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

export { Tip, TooltipProvider };
