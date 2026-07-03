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
  return n.toLocaleString("en-US");
}

// Mobile: abbreviate the two large counts so all four steps fit at ~320px
// (524,288 → 524K, 1,840 → 1.8K); the small counts stay exact.
function fmtShort(n: number) {
  if (n >= 1000)
    return (
      (n / 1000).toLocaleString("en-US", {
        maximumFractionDigits: n >= 10000 ? 0 : 1,
      }) + "K"
    );
  return n.toLocaleString("en-US");
}

export function Funnel({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-2.5 @2xl/review:px-4 @2xl/review:py-2">
      {STEPS.map((s, i) => {
        const isPlate = i === STEPS.length - 1 && active;
        return (
          <div key={s.label} className="flex shrink-0 items-center gap-1 @2xl/review:gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "cursor-default rounded-md px-1 py-0.5 text-center transition-colors",
                    "@2xl/review:rounded-lg @2xl/review:border @2xl/review:px-2.5 @2xl/review:py-1.5 @2xl/review:text-left",
                    isPlate
                      ? "bg-brand/10 @2xl/review:border-brand/30"
                      : "@2xl/review:border-border/60 @2xl/review:bg-muted/30"
                  )}
                >
                  <div
                    className={cn(
                      "font-mono text-xs leading-none tabular-nums tracking-tight @2xl/review:text-sm",
                      isPlate ? "text-brand" : "text-foreground",
                      !active && i > 1 && "text-muted-foreground/40"
                    )}
                  >
                    <span className="@2xl/review:hidden">{fmtShort(s.value)}</span>
                    <span className="hidden @2xl/review:inline">{fmt(s.value)}</span>
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
              <TooltipContent side="top">
                {fmt(s.value)} · {s.hint}
              </TooltipContent>
            </Tooltip>
            {i < STEPS.length - 1 && (
              <ChevronRight className="size-3 shrink-0 text-muted-foreground/30 @2xl/review:size-3.5 @2xl/review:text-muted-foreground/40" />
            )}
          </div>
        );
      })}
    </div>
  );
}
