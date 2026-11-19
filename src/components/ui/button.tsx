import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-base text-sm font-base ring-offset-background transition-colors gap-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50",
  {
    variants: {
      // The folio style, as on the website: the main action is ink, and it turns red chalk on hover.
      variant: {
        default:
          "bg-foreground text-background border border-foreground hover:bg-primary hover:border-primary hover:text-primary-foreground",
        // A selected item: the ochre wash with an ink edge.
        noShadow: "bg-main text-main-foreground border border-edge",
        neutral:
          "bg-transparent text-foreground border border-edge hover:bg-secondary-background hover:border-primary hover:text-primary",
        // Added for this app: a flat button for the top bar and for secondary actions.
        ghost:
          "text-foreground border border-transparent hover:bg-secondary-background hover:text-primary",
        reverse:
          "bg-foreground text-background border border-foreground hover:bg-primary hover:border-primary hover:text-primary-foreground",
        // A tab: underlined when it is selected, as the sections of a book.
        tab: "rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 text-muted-foreground hover:text-foreground aria-selected:border-foreground aria-selected:font-semibold aria-selected:text-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        xs: "h-8 gap-1.5 px-2.5 text-xs [&_svg]:size-3.5",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "size-10",
        "icon-xs": "size-8 [&_svg]:size-3.5",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ButtonPrimitive> & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
