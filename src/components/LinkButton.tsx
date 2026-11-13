import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = Omit<React.ComponentProps<typeof Button>, "render" | "nativeButton"> & { href: string };

// A button that is a link. An external address opens in a new tab.
export default function LinkButton({ href, ...props }: Props) {
  const external = /^https?:/.test(href);
  return (
    <Button
      nativeButton={false}
      render={external ? <a href={href} target="_blank" rel="noreferrer" /> : <Link href={href} />}
      {...props}
    />
  );
}
