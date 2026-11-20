"use client";

import dynamic from "next/dynamic";
import { Compass } from "lucide-react";
import { useState } from "react";
import type { EventData, Controls, Step, TooltipRenderProps } from "react-joyride";
import { Button } from "@/components/ui/button";
import { TOUR_ATTRIBUTE, type TourId, type TourStep, tours } from "@/lib/content/tours";
import { useTour } from "@/lib/browser/use-tour";

// The tour library uses the window, so it loads in the browser only.
const Joyride = dynamic(() => import("react-joyride").then((module) => module.Joyride), {
  ssr: false,
});

// The tour is above the dialogs and the side panels of the app.
const TOUR_Z_INDEX = 60;
const SPOTLIGHT = { padding: 6, radius: 8 };
// The tour draws the overlay as an SVG fill. Use the rgba() form, because a fill attribute does
// not take the newer rgb(0 0 0 / 0.4) form in each browser.
const OVERLAY_COLOR = "rgba(0, 0, 0, 0.45)";

// The element of a step. A part can show two times, for example a wide and a narrow form of a
// button. The tour uses the one that shows.
function findTarget(name: TourStep["target"]): () => HTMLElement | null {
  return () =>
    [...document.querySelectorAll<HTMLElement>(`[${TOUR_ATTRIBUTE}="${name}"]`)].find((element) =>
      element.checkVisibility(),
    ) ?? null;
}

function toStep(step: TourStep): Step {
  if (step.target === "page") {
    return { target: "body", placement: "center", title: step.title, content: step.content };
  }
  return { target: findTarget(step.target), title: step.title, content: step.content };
}

// The box of one step, in the style of the cards of the app.
function TourTooltip({
  backProps,
  index,
  isLastStep,
  primaryProps,
  size,
  skipProps,
  step,
  tooltipProps,
}: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      className="w-80 max-w-[calc(100vw-2rem)] space-y-3 rounded-base border-2 border-border bg-card p-4 text-sm text-foreground shadow-float"
    >
      {step.title && <h2 className="font-semibold">{step.title}</h2>}
      <p className="leading-relaxed">{step.content}</p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground tabular-nums">
          {index + 1} / {size}
        </span>
        {!isLastStep && (
          <Button {...skipProps} type="button" variant="ghost" size="sm" className="ml-auto">
            Skip the tour
          </Button>
        )}
        <div className={isLastStep ? "ml-auto flex gap-2" : "flex gap-2"}>
          {index > 0 && (
            <Button {...backProps} type="button" variant="neutral" size="sm">
              Back
            </Button>
          )}
          <Button {...primaryProps} type="button" size="sm">
            {isLastStep ? "Done" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// A tour of one page. It runs one time, the first time the person opens the page.
// Done, Skip, and Escape all end it, and it does not run again.
export default function Tour({ id }: { id: TourId }) {
  const tour = useTour(id);
  if (!tour.shouldRun) return null;

  function onEvent(data: EventData, controls: Controls) {
    // Escape closes the step. End the tour, so the person does not see the next step.
    if (data.action === "close") {
      controls.skip();
      return;
    }
    if (data.status === "finished" || data.status === "skipped") {
      void tour.setSeen(true).catch(() => undefined);
    }
  }

  return (
    <Joyride
      run
      continuous
      steps={tours[id].steps.map(toStep)}
      tooltipComponent={TourTooltip}
      onEvent={onEvent}
      options={{
        zIndex: TOUR_Z_INDEX,
        overlayColor: OVERLAY_COLOR,
        arrowColor: "var(--card)",
        spotlightPadding: SPOTLIGHT.padding,
        spotlightRadius: SPOTLIGHT.radius,
        skipBeacon: true,
        overlayClickAction: false,
        dismissKeyAction: "close",
      }}
    />
  );
}

// A button that starts a tour again. The tour runs the next time its page opens.
function ReplayTour({ id, onReplay }: { id: TourId; onReplay?: () => void }) {
  const tour = useTour(id);
  return (
    <Button
      type="button"
      variant="neutral"
      size="sm"
      onClick={() => {
        void tour
          .setSeen(false)
          .then(onReplay)
          .catch(() => undefined);
      }}
    >
      Start {tours[id].label.toLowerCase()}
    </Button>
  );
}

// The button on the home page that starts the welcome tour again, from its first step.
export function StartTourButton() {
  const tour = useTour("welcome");
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => void tour.setSeen(false).catch(() => undefined)}
    >
      <Compass /> Take the tour
    </Button>
  );
}

// The kata tour on the Guide page. It waits for the next kata that the person opens.
export function TourReplays() {
  const [kataNote, setKataNote] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ReplayTour id="kata" onReplay={() => setKataNote(true)} />
      {kataNote && (
        <output className="text-muted-foreground">
          The kata tour starts the next time you open a kata.
        </output>
      )}
    </div>
  );
}
