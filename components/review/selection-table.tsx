"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PARENT } from "@/lib/data";
import { PROPERTIES, PROPERTY_ORDER, goodness, goodnessColor } from "@/lib/properties";
import type { PropertyKey, Variant } from "@/lib/types";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SortKey = PropertyKey | "score" | "name";

interface Props {
  variants: Variant[];
  selectedId: string | null;
  onSelect: (v: Variant) => void;
}

export function SelectionTable({ variants, selectedId, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [asc, setAsc] = useState(false);
  const [round3Only, setRound3Only] = useState(false);

  const heatSet = useMemo(() => [PARENT, ...variants], [variants]);

  const rows = useMemo(() => {
    let r = round3Only ? variants.filter((v) => v.round === 3) : variants.slice();
    r = r.sort((a, b) => {
      let av: number, bv: number;
      if (sortKey === "score") [av, bv] = [a.score, b.score];
      else if (sortKey === "name") return asc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      else {
        av = goodness(sortKey, a.properties[sortKey].predicted, heatSet);
        bv = goodness(sortKey, b.properties[sortKey].predicted, heatSet);
      }
      return asc ? av - bv : bv - av;
    });
    return r;
  }, [variants, round3Only, sortKey, asc, heatSet]);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setAsc((s) => !s);
    else {
      setSortKey(k);
      setAsc(false);
    }
  };

  const sortIcon = (k: SortKey) =>
    k !== sortKey ? (
      <Minus className="size-3 opacity-20" />
    ) : asc ? (
      <ArrowUp className="size-3" />
    ) : (
      <ArrowDown className="size-3" />
    );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5">
        <div className="text-xs text-muted-foreground">
          <span className="font-mono font-medium text-foreground">
            {rows.length}
          </span>{" "}
          candidates ·{" "}
          <span className="text-muted-foreground/70">
            sorted by {labelFor(sortKey)}
          </span>
        </div>
        <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-muted-foreground">
          <Switch
            checked={round3Only}
            onCheckedChange={setRound3Only}
            className="data-[state=checked]:bg-brand"
          />
          round 3 only
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow className="hover:bg-transparent">
              <SortHead onClick={() => toggleSort("name")} className="pl-4">
                Variant {sortIcon("name")}
              </SortHead>
              <TableHead className="h-auto py-2 text-[11px] font-medium text-muted-foreground">
                Mutations
              </TableHead>
              {PROPERTY_ORDER.map((k) => (
                <SortHead
                  key={k}
                  onClick={() => toggleSort(k)}
                  align="right"
                  title={PROPERTIES[k].hint}
                >
                  <div className="flex flex-col items-end leading-tight">
                    <span className="flex items-center gap-1">
                      {PROPERTIES[k].short} {sortIcon(k)}
                    </span>
                    <span className="text-[9px] font-normal text-muted-foreground/50">
                      {PROPERTIES[k].unit || "score"} ·{" "}
                      {PROPERTIES[k].direction === "higher" ? "↑" : "↓"}
                    </span>
                  </div>
                </SortHead>
              ))}
              <SortHead onClick={() => toggleSort("score")} align="right" className="pr-4">
                Score {sortIcon("score")}
              </SortHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Row variant={PARENT} heatSet={heatSet} isParent selected={false} onSelect={() => {}} />
            {rows.map((v, i) => (
              <Row
                key={v.id}
                index={i}
                variant={v}
                heatSet={heatSet}
                selected={v.id === selectedId}
                onSelect={() => onSelect(v)}
              />
            ))}
          </TableBody>
        </table>
      </div>
    </div>
  );
}

function labelFor(k: SortKey) {
  if (k === "score") return "model score";
  if (k === "name") return "name";
  return PROPERTIES[k].short.toLowerCase();
}

function SortHead({
  children,
  onClick,
  align = "left",
  className,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  align?: "left" | "right";
  className?: string;
  title?: string;
}) {
  const head = (
    <TableHead
      onClick={onClick}
      className={cn(
        "h-auto py-2 text-[11px] font-medium text-muted-foreground",
        onClick && "cursor-pointer select-none hover:text-foreground",
        align === "right" && "text-right",
        className
      )}
    >
      {align === "right" ? (
        <div className="flex justify-end">{children}</div>
      ) : (
        <span className="flex items-center gap-1">{children}</span>
      )}
    </TableHead>
  );

  if (!title) return head;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{head}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        {title}
      </TooltipContent>
    </Tooltip>
  );
}

function Row({
  variant,
  heatSet,
  selected,
  isParent,
  index,
  onSelect,
}: {
  variant: Variant;
  heatSet: Variant[];
  selected: boolean;
  isParent?: boolean;
  index?: number;
  onSelect: () => void;
}) {
  return (
    <TableRow
      onClick={onSelect}
      data-state={selected ? "selected" : undefined}
      title={selected ? "Focused — click again or press Esc to clear" : undefined}
      tabIndex={isParent ? undefined : 0}
      role={isParent ? undefined : "button"}
      onKeyDown={
        isParent
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect();
              }
            }
      }
      style={
        isParent ? undefined : { animationDelay: `${Math.min(index ?? 0, 8) * 24}ms` }
      }
      className={cn(
        !isParent &&
          "animate-reveal cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40",
        selected && "data-[state=selected]:bg-brand/10 hover:bg-brand/10",
        isParent && "bg-muted/20 hover:bg-muted/20"
      )}
    >
      <TableCell className="relative py-2.5 pl-4 align-top">
        {selected && (
          <span className="absolute left-0 top-0 h-full w-[3px] rounded-r-full bg-brand" />
        )}
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "font-mono text-xs",
              isParent ? "text-muted-foreground" : "text-foreground",
              selected && "font-medium"
            )}
          >
            {variant.name}
          </span>
          {variant.assayed && !isParent && (
            <span
              className="rounded-md border border-brand/20 bg-brand/10 px-1 text-[9px] font-medium text-brand"
              title="Has wet-lab measurements"
            >
              measured
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="py-2.5 align-top">
        <div className="flex flex-wrap gap-1">
          {variant.mutations.length === 0 ? (
            <span className="text-xs text-muted-foreground/50">—</span>
          ) : (
            variant.mutations.map((m) => (
              <span
                key={m}
                className="rounded-md border border-border/60 bg-muted/50 px-1 font-mono text-[10px] text-foreground/80"
              >
                {m}
              </span>
            ))
          )}
        </div>
      </TableCell>
      {PROPERTY_ORDER.map((k) => (
        <PropertyCell key={k} pk={k} variant={variant} heatSet={heatSet} />
      ))}
      <TableCell className="py-2.5 pr-4 text-right align-top">
        <div className="flex items-center justify-end gap-2">
          <Progress
            value={variant.score * 100}
            className="h-1.5 w-14 [&>[data-slot=progress-indicator]]:bg-brand"
          />
          <span className="w-8 font-mono text-xs font-medium tabular-nums text-foreground">
            {variant.score.toFixed(2)}
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
}

function PropertyCell({
  pk,
  variant,
  heatSet,
}: {
  pk: PropertyKey;
  variant: Variant;
  heatSet: Variant[];
}) {
  const meta = PROPERTIES[pk];
  const val = variant.properties[pk];
  const g = goodness(pk, val.predicted, heatSet);
  const measured = val.measured;
  // predicted-vs-measured error, expressed as a % of the measured value
  const err = measured != null ? ((val.predicted - measured) / measured) * 100 : null;

  return (
    <TableCell className="py-2.5 text-right align-top">
      <div className="flex flex-col items-end gap-1">
        <span
          className="rounded-md px-1.5 py-0.5 font-mono text-xs font-medium tabular-nums text-foreground transition-colors"
          style={{ backgroundColor: goodnessColor(g) }}
        >
          {meta.format(val.predicted)}
        </span>
        {/* confidence underbar */}
        <span
          className="block h-[3px] w-8 overflow-hidden rounded-full bg-muted"
          title={`${(val.confidence * 100).toFixed(0)}% confidence`}
        >
          <span
            className={cn(
              "block h-full rounded-full",
              val.confidence >= 0.8
                ? "bg-emerald-400"
                : val.confidence >= 0.65
                  ? "bg-amber-400"
                  : "bg-rose-400"
            )}
            style={{ width: `${val.confidence * 100}%` }}
          />
        </span>
        {measured != null && err != null && (
          <span
            className={cn(
              "font-mono text-[9px] tabular-nums",
              Math.abs(err) <= 8 ? "text-emerald-400/80" : "text-amber-400/80"
            )}
            title={`Measured ${meta.format(measured)} ${meta.unit} — prediction off by ${err.toFixed(0)}%`}
          >
            meas {meta.format(measured)} ({err > 0 ? "+" : ""}
            {err.toFixed(0)}%)
          </span>
        )}
      </div>
    </TableCell>
  );
}
