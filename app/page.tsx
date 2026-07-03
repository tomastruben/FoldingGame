import { Dna, Crosshair } from "lucide-react";
import { OBJECTIVE } from "@/lib/data";
import { Workbench } from "@/components/workbench";
import { HelpOverlay } from "@/components/help-overlay";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col lg:h-full">
      <header className="animate-reveal flex shrink-0 items-center gap-4 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-full bg-secondary text-foreground">
            <Dna className="size-4" strokeWidth={2.25} />
          </div>
          <div className="leading-none">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Foldbench
            </span>
          </div>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="mx-auto hidden max-w-xl min-w-0 cursor-default items-center gap-2 rounded-full border border-border bg-secondary/50 px-3.5 py-1.5 md:flex">
              <Crosshair
                className="size-3.5 shrink-0 text-muted-foreground"
                strokeWidth={2.25}
              />
              <span className="truncate text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Objective</span>
                <span className="mx-2 text-muted-foreground/40">·</span>
                {OBJECTIVE.summary}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-sm">
            {OBJECTIVE.summary}
          </TooltipContent>
        </Tooltip>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <div className="hidden text-right text-[11px] leading-tight text-muted-foreground lg:block">
            <div className="font-medium text-foreground/80">
              Tomas Truben · portfolio demo
            </div>
            <div className="font-mono text-[10px] tracking-tight text-muted-foreground/70">
              shadcn/ui · AI SDK pattern · Mol*
            </div>
          </div>
          <HelpOverlay />
        </div>
      </header>

      <main className="min-h-0 flex-1">
        <Workbench />
      </main>
    </div>
  );
}
