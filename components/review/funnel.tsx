"use client";

import { ChevronRight } from "lucide-react";
import { FUNNEL } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STEPS = [
  { label: "design space", value: FUNNEL.designSpace, hint: "reachable sequences" },
  { label: "scored", value: FUNNEL.generated, hint: "model proposals" },
  { label: "shortlist", value: FUNNEL.shortlist, hint: "clear constraints" },
  { label: "plate", value: FUNNEL.plate, hint: "orderable wells" },
];

function fmt(n: number) {
  return n.toLocaleString();
}

export function Funnel({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2">
      {STEPS.map((s, i) => {
        const isPlate = i === STEPS.length - 1 && active;
        return (
          <div key={s.label} className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "cursor-default rounded-lg border px-2.5 py-1.5 transition-colors",
                    isPlate
                      ? "border-brand/30 bg-brand/10"
                      : "border-border/60 bg-muted/30"
                  )}
                >
                  <div
                    className={cn(
                      "font-mono text-sm leading-none tabular-nums tracking-tight",
                      isPlate ? "text-brand" : "text-foreground",
                      !active && i > 1 && "text-muted-foreground/40"
                    )}
                  >
                    {fmt(s.value)}
                  </div>
                  <div
                    className={cn(
                      "mt-1 whitespace-nowrap text-[9px] font-medium uppercase tracking-wider",
                      isPlate ? "text-muted-foreground" : "text-muted-foreground/60"
                    )}
                  >
                    {s.label}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">{s.hint}</TooltipContent>
            </Tooltip>
            {i < STEPS.length - 1 && (
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/40" />
            )}
          </div>
        );
      })}
    </div>
  );
}
