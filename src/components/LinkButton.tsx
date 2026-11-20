import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Route } from "next";

// The address is checked like the address of a Link: a page of the app, or an address with a
// protocol, such as https://.
type Props<T extends string> = Omit<
  React.ComponentProps<typeof Button>,
  "render" | "nativeButton"
> & {
  href: Route<T>;
};

// A button that is a link. An external address opens in a new tab.
export default function LinkButton<T extends string>({ href, ...props }: Props<T>) {
  const external = /^https?:/.test(href);
  return (
    <Button
      nativeButton={false}
      // Button puts its children, the visible label, into this link.
      // oxlint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/control-has-associated-label
      render={external ? <a href={href} target="_blank" rel="noreferrer" /> : <Link href={href} />}
      {...props}
    />
  );
}
