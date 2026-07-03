"use client";

import { type RefObject, useState } from "react";
import { Orbit, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { RepresentationTheme, StructurePreset, Variant } from "@/lib/types";
import { MolstarViewer, type MolstarHandle } from "./molstar-viewer";

type Status = "idle" | "loading" | "ready" | "error";

const REPS: { key: RepresentationTheme; label: string }[] = [
  { key: "chain", label: "Chain" },
  { key: "hydrophobicity", label: "Hydrophobic" },
  { key: "bfactor", label: "Flexibility" },
];

interface Props {
  viewerRef: RefObject<MolstarHandle | null>;
  structure: StructurePreset | null;
  status: Status;
  selected: Variant | null;
  onDeselect: () => void;
  onStatus: (s: Status, pdbId?: string) => void;
}

export function ViewerPanel({
  viewerRef,
  structure,
  status,
  selected,
  onDeselect,
  onStatus,
}: Props) {
  const [rep, setRep] = useState<RepresentationTheme>("chain");
  const [spin, setSpin] = useState(true);
  const ready = status === "ready";

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MolstarViewer ref={viewerRef} onStatus={onStatus} />

      {/* top-left: provenance */}
      {structure && ready && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 hidden items-center gap-2 rounded-full border border-border bg-background/70 px-2.5 py-1 text-[11px] backdrop-blur-md sm:flex">
          <span className="size-1.5 rounded-full bg-brand" />
          <span className="font-mono font-medium text-foreground">
            {structure.pdbId}
          </span>
          <span className="text-muted-foreground">· Mol* · RCSB</span>
        </div>
      )}

      {/* top-right: controls */}
      {ready && (
        <div className="absolute right-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center justify-end gap-1.5">
          <Tabs
            value={rep}
            onValueChange={(v) => {
              setRep(v as RepresentationTheme);
              viewerRef.current?.setRepresentation(v as RepresentationTheme);
            }}
          >
            <TabsList className="border border-border bg-background/70 backdrop-blur-md">
              {REPS.map((r) => (
                <TabsTrigger
                  key={r.key}
                  value={r.key}
                  className="px-2.5 text-[11px]"
                >
                  {r.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const next = !spin;
                  setSpin(next);
                  viewerRef.current?.setSpin(next);
                }}
                className={cn(
                  "size-8 rounded-full border-border bg-background/70 backdrop-blur-md dark:bg-background/70",
                  spin && "text-brand hover:text-brand"
                )}
              >
                <Orbit className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {spin ? "Pause rotation" : "Spin structure"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => viewerRef.current?.resetView()}
                className="size-8 rounded-full border-border bg-background/70 text-muted-foreground backdrop-blur-md dark:bg-background/70"
              >
                <RotateCcw className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Reset camera</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* bottom-left: caption / focus state */}
      {structure && ready && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[70%] space-y-1.5">
          <p className="text-xs font-semibold tracking-tight text-foreground">
            {structure.label}
          </p>
          {selected ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">focused</span>
              <span className="font-mono text-[11px] font-medium text-brand">
                {selected.name}
              </span>
              {selected.mutations.map((m) => (
                <span
                  key={m}
                  className="rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-medium text-foreground"
                >
                  {m}
                </span>
              ))}
              <button
                type="button"
                onClick={onDeselect}
                title="Clear focus (Esc)"
                className="pointer-events-auto ml-0.5 inline-flex items-center gap-1 rounded-md border border-border bg-background/70 py-0.5 pl-1 pr-1.5 text-[10px] font-medium text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground"
              >
                <X className="size-3" />
                clear
              </button>
            </div>
          ) : (
            <p className="max-w-md text-[11px] leading-relaxed text-muted-foreground/70">
              {structure.blurb}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
