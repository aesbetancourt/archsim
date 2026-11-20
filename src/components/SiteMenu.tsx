"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { tourTarget } from "@/lib/content/tours";
import { pageAddress } from "@/lib/routes";

type Item = { href: string; title: string; icon: React.ReactNode };
export type MenuGroup = { label: string; items: Item[] };

// The menu of the top bar on a narrow window. It has all the pages of the top bar, in groups.
// A wide window shows the same pages in the bar itself.
export default function SiteMenu({ groups }: { groups: MenuGroup[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Menu"
            title="Menu"
            className="lg:hidden"
            {...tourTarget("menu")}
          />
        }
      >
        <Menu />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[calc(100dvh-5rem)] w-64 overflow-y-auto">
        {groups.map((group, index) => (
          <Fragment key={group.label}>
            {index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground uppercase">
                {group.label}
              </DropdownMenuLabel>
              {group.items.map((item) => (
                <DropdownMenuItem
                  key={item.href}
                  render={<Link href={pageAddress(item.href)} />}
                  className="gap-2 [&>svg]:size-4"
                >
                  {item.icon}
                  {item.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
