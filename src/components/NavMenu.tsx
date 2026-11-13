"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Item = { href: string; title: string; description: string; icon: React.ReactNode };

// One menu in the top bar. It opens a list of pages.
export default function NavMenu({ label, icon, items }: { label: string; icon: React.ReactNode; items: Item[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
        {icon} {label} <ChevronDown />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {items.map((item) => (
          <DropdownMenuItem key={item.href} render={<Link href={item.href} />} className="items-start gap-3">
            <span className="mt-0.5 [&>svg]:size-4">{item.icon}</span>
            <span className="flex flex-col">
              <span className="font-medium">{item.title}</span>
              <span className="text-xs opacity-80">{item.description}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
