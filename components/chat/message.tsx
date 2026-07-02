"use client";

import {
  Atom,
  Brain,
  Check,
  ChevronRight,
  GitCompare,
  ListOrdered,
  Loader2,
  Palette,
  ScanSearch,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ChatMessage,
  MessagePart,
  ToolName,
  ToolPartBase,
} from "@/lib/types";
import { Message as MessageShell, MessageContent } from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { RichText } from "./rich-text";

const TOOL_ICON: Record<ToolName, React.ElementType> = {
  load_structure: Atom,
  propose_variants: Sparkles,
  rank_candidates: ListOrdered,
  inspect_variant: ScanSearch,
  compare_tradeoff: GitCompare,
  set_representation: Palette,
};

function ToolCall({ part }: { part: ToolPartBase }) {
  const Icon = TOOL_ICON[part.name] ?? Sparkles;
  const running = part.state === "running" || part.state === "input-streaming";
  const error = part.state === "error";
  const hasDetail =
    (part.input && Object.keys(part.input).length > 0) || !!part.output;

  return (
    <Collapsible className="overflow-hidden rounded-xl border border-border bg-card text-sm">
      <CollapsibleTrigger className="group/ct flex w-full items-center gap-3 px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-md border transition-colors",
            running && "border-brand/30 bg-brand/10 text-brand",
            !running && !error && "border-border bg-secondary text-muted-foreground",
            error && "border-destructive/40 bg-destructive/10 text-destructive"
          )}
        >
          <Icon className="size-4" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium tracking-tight text-foreground">
            {part.title}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {part.name}
            {part.durationMs != null && !running && (
              <span className="text-muted-foreground/60">
                {" "}
                · {(part.durationMs / 1000).toFixed(1)}s
              </span>
            )}
          </span>
        </span>
        <span className="shrink-0 text-muted-foreground">
          {running ? (
            <Loader2 className="size-4 animate-spin text-brand" />
          ) : error ? (
            <TriangleAlert className="size-4 text-destructive" />
          ) : (
            <Check className="size-4 text-brand" />
          )}
        </span>
        {hasDetail && (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-data-[state=open]/ct:rotate-90" />
        )}
      </CollapsibleTrigger>
      {hasDetail && (
        <CollapsibleContent>
          <div className="space-y-2.5 border-t border-border/60 px-3 py-3 text-xs">
            {part.input && Object.keys(part.input).length > 0 && (
              <div className="space-y-1">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                  input
                </p>
                <pre className="overflow-x-auto rounded-lg bg-background/60 p-2.5 font-mono text-[11px] leading-relaxed text-foreground/80 ring-1 ring-border/50">
                  {JSON.stringify(part.input, null, 2)}
                </pre>
              </div>
            )}
            {part.output && (
              <div className="space-y-1">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                  result
                </p>
                <p className="leading-relaxed text-muted-foreground">
                  {part.output}
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

function Reasoning({ text }: { text: string }) {
  return (
    <Collapsible className="rounded-xl border border-dashed border-border/60 bg-muted/15">
      <CollapsibleTrigger className="group/rs flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
        <Brain className="size-4 text-muted-foreground" strokeWidth={2} />
        <span className="flex-1 font-medium tracking-tight">Reasoning</span>
        <ChevronRight className="size-3.5 transition-transform group-data-[state=open]/rs:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p className="border-t border-border/50 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          <RichText text={text} />
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}

function Part({ part }: { part: MessagePart }) {
  if (part.type === "text") {
    return (
      <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
        <RichText text={part.text} />
      </div>
    );
  }
  if (part.type === "reasoning") return <Reasoning text={part.text} />;
  return <ToolCall part={part} />;
}

export function Message({
  message,
  streaming,
}: {
  message: ChatMessage;
  streaming?: boolean;
}) {
  if (message.role === "user") {
    return (
      <MessageShell align="end">
        <Bubble variant="default">
          <BubbleContent>
            {message.parts.map((p) =>
              p.type === "text" ? <span key={p.id}>{p.text}</span> : null
            )}
          </BubbleContent>
        </Bubble>
      </MessageShell>
    );
  }

  return (
    <MessageShell align="start">
      <MessageContent className="gap-2.5">
        {message.parts.map((p) => (
          <Part key={p.id} part={p} />
        ))}
        {streaming && message.parts.length === 0 && (
          <div className="flex items-center gap-1.5 py-1 text-muted-foreground">
            <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-current" />
          </div>
        )}
      </MessageContent>
    </MessageShell>
  );
}
