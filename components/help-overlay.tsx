"use client";

import { useEffect, useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  Compass,
  Dna,
  Info,
  MousePointerClick,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * An "about this prototype" overlay — the concept, the design reasoning, and a
 * 20-second guide. Meant to be opened live in front of an audience, so it's
 * reachable by a visible header control and by pressing H anywhere.
 */
export function HelpOverlay() {
  const [open, setOpen] = useState(false);

  // Press H (or ?) anywhere to toggle — unless the user is typing in the chat.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      )
        return;
      if (e.key === "h" || e.key === "H" || e.key === "?") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogPrimitive.Trigger asChild>
            <button
              type="button"
              className="group inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-2.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Info className="size-3.5" strokeWidth={2.25} />
              <span className="hidden sm:inline">About</span>
              <kbd className="hidden rounded border border-border bg-background px-1 font-mono text-[10px] leading-4 text-muted-foreground sm:inline">
                H
              </kbd>
            </button>
          </DialogPrimitive.Trigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          About this prototype · press H
        </TooltipContent>
      </Tooltip>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/60 backdrop-blur-md data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-popover/95 shadow-2xl backdrop-blur-xl duration-200 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
          {/* header */}
          <div className="flex items-start gap-3 border-b border-border p-5">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-foreground">
              <Dna className="size-4.5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
                Foldbench
                <Badge
                  variant="outline"
                  className="h-4 px-1.5 text-[10px] uppercase tracking-wider text-muted-foreground"
                >
                  demo
                </Badge>
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-0.5 text-xs text-muted-foreground">
                An AI review copilot for antibody engineering — a portfolio
                prototype by Tomas Truben.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>

          {/* body */}
          <div className="space-y-6 overflow-y-auto p-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Protein engineering runs on the Design–Build–Test–Learn loop, and
              modern models now propose thousands of candidate sequences per
              round. The bottleneck has moved to{" "}
              <span className="font-medium text-foreground">review</span> —
              deciding which handful of designs are worth an expensive wet-lab
              plate. Foldbench imagines that review surface: a copilot that sits
              between the scientist and the model, grounding every suggestion in
              the 3D structure and the numbers that decide a program.
            </p>

            <Section icon={Compass} title="Why it's built this way">
              <ul className="space-y-2.5">
                <Reason lead="One glance, three sources of truth.">
                  The copilot drives the Mol* structure viewer and the candidate
                  table through streamed tool calls — the same loop a live
                  AI-SDK agent runs.
                </Reason>
                <Reason lead="Uncertainty is first-class.">
                  Every prediction carries a calibrated confidence, and earlier
                  rounds are shown predicted-vs-measured, so you can audit the
                  model before trusting round 3.
                </Reason>
                <Reason lead="Tradeoffs you can actually read.">
                  Aligned per-property tracks share one worst→best baseline
                  instead of a radar chart, whose area encodes nothing real.
                </Reason>
                <Reason lead="A deliberate point of no return.">
                  Ordering a 96-well plate is irreversible, so it lives behind
                  an explicit confirmation gate.
                </Reason>
              </ul>
            </Section>

            <Section icon={MousePointerClick} title="Try it in ~20 seconds">
              <ol className="space-y-2.5">
                <Step n={1}>
                  Ask the copilot to{" "}
                  <span className="font-medium text-foreground">
                    “improve binding without losing stability”
                  </span>{" "}
                  — it generates, ranks, and drops a scored shortlist.
                </Step>
                <Step n={2}>
                  <span className="font-medium text-foreground">
                    Click any candidate
                  </span>{" "}
                  to focus its mutations on the structure ( <Kbd>Esc</Kbd> or the
                  × to clear ).
                </Step>
                <Step n={3}>
                  Open <span className="font-medium text-foreground">Tradeoff</span>{" "}
                  to compare the finalists head-to-head.
                </Step>
                <Step n={4}>
                  When you’re convinced,{" "}
                  <span className="font-medium text-foreground">
                    stage and confirm a plate
                  </span>
                  .
                </Step>
              </ol>
            </Section>

            <p className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              Every response is scripted for the demo — the streaming, tool
              calls, and viewer effects mirror a live agent. Swapping in a real{" "}
              <code className="font-mono text-[11px] text-foreground">
                /api/chat
              </code>{" "}
              route is a drop-in.
            </p>
          </div>

          {/* footer */}
          <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Kbd>H</Kbd>
              <span>toggle</span>
              <span className="text-muted-foreground/40">·</span>
              <Kbd>Esc</Kbd>
              <span>close</span>
            </div>
            <span className="hidden font-mono tracking-tight text-muted-foreground/70 sm:inline">
              Next.js · shadcn/ui · Mol* · AI SDK pattern
            </span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-brand" />
        <h3 className="text-sm font-medium tracking-tight text-foreground">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function Reason({
  lead,
  children,
}: {
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-brand" />
      <span className="text-sm leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">{lead}</span> {children}
      </span>
    </li>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-medium text-foreground">
        {n}
      </span>
      <span className="pt-px text-sm leading-relaxed text-muted-foreground">
        {children}
      </span>
    </li>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-background px-1 py-px font-mono text-[10px] leading-4 text-muted-foreground">
      {children}
    </kbd>
  );
}
