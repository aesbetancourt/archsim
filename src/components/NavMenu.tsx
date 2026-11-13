"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Item = { href: string; title: string; description: string };

// One menu in the top bar. It opens a list of pages.
export default function NavMenu({ label, items }: { label: string; items: Item[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
        {label} <ChevronDown />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {items.map((item) => (
          <DropdownMenuItem key={item.href} render={<Link href={item.href} />} className="flex-col items-start gap-0">
            <span className="font-medium">{item.title}</span>
            <span className="text-xs opacity-80">{item.description}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
