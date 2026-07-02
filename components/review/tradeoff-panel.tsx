"use client";

import { GitCompare } from "lucide-react";
import { PARENT } from "@/lib/data";
import { PROPERTIES, PROPERTY_ORDER, goodness } from "@/lib/properties";
import type { Variant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

const SERIES = ["#34d399", "#38bdf8", "#f472b6", "#fbbf24"];

interface Props {
  variants: Variant[];
  heatSet: Variant[];
  /** Trigger the copilot to stage a comparison set (populates this view). */
  onWalk?: () => void;
  /** The agent is mid-stream — disable the action so we don't double-fire. */
  busy?: boolean;
}

/**
 * Aligned per-property tracks instead of a radar chart. Every property shares
 * a worst→best baseline, the parent is a fixed reference tick, and each
 * candidate is a labelled dot — so you can read a precise winner per axis
 * (which a radar's area encoding hides).
 */
export function TradeoffPanel({ variants, heatSet, onWalk, busy }: Props) {
  if (variants.length === 0) {
    return (
      <Empty className="h-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <GitCompare className="size-4" strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>Nothing staged to compare</EmptyTitle>
          <EmptyDescription>
            The Selection tab already scores every candidate. The tradeoff is a
            deliberate head-to-head — the copilot lines up the top finalists on a
            shared{" "}
            <span className="text-foreground/80">worst → best</span> scale so you
            can read a precise per-property winner before committing a plate. Pick
            a set to populate it.
          </EmptyDescription>
        </EmptyHeader>
        {onWalk && (
          <EmptyContent>
            <Button
              variant="outline"
              size="sm"
              onClick={onWalk}
              disabled={busy}
              className="gap-1.5"
            >
              <GitCompare className="size-3.5" />
              {busy ? "Comparing…" : "Walk me through the tradeoff"}
            </Button>
          </EmptyContent>
        )}
      </Empty>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground/60">
          worst → best (per property)
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2.5 w-0.5 bg-muted-foreground" /> parent
          </span>
          {variants.map((v, i) => (
            <span key={v.id} className="flex items-center gap-1.5 text-xs">
              <span className="size-2.5 rounded-full" style={{ background: SERIES[i % SERIES.length] }} />
              <span className="font-mono text-foreground/90">{v.name}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-3.5">
        {PROPERTY_ORDER.map((pk) => {
          const meta = PROPERTIES[pk];
          const parentG = goodness(pk, PARENT.properties[pk].predicted, heatSet);
          return (
            <div key={pk} className="grid grid-cols-[92px_1fr] items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-medium text-foreground">{meta.short}</div>
                <div className="text-[10px] text-muted-foreground/60">
                  {meta.unit || "score"} · {meta.direction === "higher" ? "↑" : "↓"}
                </div>
              </div>
              <div className="relative h-8 overflow-hidden rounded-lg bg-muted/40 shadow-inner ring-1 ring-border/50">
                {/* parent reference tick — inset so it never clips at the rail edge */}
                <div
                  className="absolute top-1/2 h-full w-px -translate-x-1/2 -translate-y-1/2 bg-muted-foreground/50"
                  style={{ left: `calc(0.75rem + ${parentG} * (100% - 1.5rem))` }}
                  title={`parent ${meta.format(PARENT.properties[pk].predicted)} ${meta.unit}`}
                />
                {variants.map((v, i) => {
                  const g = goodness(pk, v.properties[pk].predicted, heatSet);
                  return (
                    <div
                      key={v.id}
                      className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `calc(0.75rem + ${g} * (100% - 1.5rem))` }}
                    >
                      <div
                        className="size-3.5 rounded-full shadow-sm ring-2 ring-background transition-transform group-hover:scale-125"
                        style={{ background: SERIES[i % SERIES.length] }}
                      />
                      <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-popover px-1.5 py-0.5 font-mono text-[10px] text-popover-foreground opacity-0 shadow transition-opacity group-hover:opacity-100">
                        {meta.format(v.properties[pk].predicted)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-auto pt-2 text-[11px] leading-relaxed text-muted-foreground/70">
        Deliberately not a radar chart: area encodes nothing real and axis order
        changes the story. Aligned tracks let a scientist read a precise per-axis
        winner before spending a plate.
      </p>
    </div>
  );
}
