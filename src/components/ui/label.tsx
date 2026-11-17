import * as React from "react";

import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    // The caller gives htmlFor or a nested control through props.
    // oxlint-disable-next-line jsx-a11y/label-has-associated-control
    <label
      data-slot="label"
      className={cn(
        "text-sm font-heading leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 peer-data-disabled:cursor-not-allowed peer-data-disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
