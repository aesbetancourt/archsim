"use client";

import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CREATOR, PROJECT } from "@/lib/content/about";
import { COMMUNITY_SOURCE } from "@/lib/content/community-source";

// A link to a different site. It opens in a new tab.
function External({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-primary hover:underline">
      {children}
    </a>
  );
}

const heading = "text-xs font-medium uppercase text-muted-foreground";

// Who made Charrette and why, the credits, and the license. The home page opens it.
export default function AboutDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        <Info /> About
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>About Charrette</DialogTitle>
          <DialogDescription>
            A local tool to practice software architecture with katas and an AI critic.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 text-sm leading-relaxed">
          <section className="space-y-1.5">
            <h3 className={heading}>Why it exists</h3>
            <p>
              I built Charrette for myself, to practice architecture concepts: design a system,
              explain the decisions, and get a review. I share it in case it helps you too.
            </p>
          </section>
          <section className="space-y-1.5">
            <h3 className={heading}>The creator</h3>
            <p className="font-medium">{CREATOR.name}</p>
            <p className="flex gap-4">
              <External href={CREATOR.github}>GitHub</External>
              <External href={CREATOR.linkedin}>LinkedIn</External>
            </p>
          </section>
          <section className="space-y-1.5">
            <h3 className={heading}>Credits</h3>
            <p>
              The architecture kata is an idea of {COMMUNITY_SOURCE.owner}. The community katas come
              from his <External href={COMMUNITY_SOURCE.url}>{COMMUNITY_SOURCE.name}</External>,
              with his permission. Charrette is built with Next.js, Excalidraw, Tiptap, and other
              open-source projects.
            </p>
          </section>
          <section className="space-y-1.5">
            <h3 className={heading}>The project</h3>
            <p className="flex flex-wrap gap-x-4 gap-y-1">
              <External href={PROJECT.website}>Website</External>
              <External href={PROJECT.repository}>Source code</External>
              <External href={PROJECT.licenseUrl}>License: {PROJECT.license}</External>
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
