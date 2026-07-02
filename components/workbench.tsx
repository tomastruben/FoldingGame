"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePanelRef } from "react-resizable-panels";
import {
  Table2,
  GitCompare,
  FlaskConical,
  PanelLeftOpen,
  MessageSquareText,
} from "lucide-react";
import {
  ALL_VARIANTS,
  CANDIDATES,
  HERO_STRUCTURE,
  PARENT,
  STRUCTURE_PRESETS,
} from "@/lib/data";
import {
  runAgent,
  SUGGESTIONS,
  WELCOME_TEXT,
  type AgentContext,
} from "@/lib/agent";
import type {
  AgentChunk,
  AgentEffect,
  ChatMessage,
  MessagePart,
  StructurePreset,
  Variant,
} from "@/lib/types";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ViewerPanel } from "@/components/viewer/viewer-panel";
import type { MolstarHandle } from "@/components/viewer/molstar-viewer";
import { SelectionTable } from "@/components/review/selection-table";
import { TradeoffPanel } from "@/components/review/tradeoff-panel";
import { Funnel } from "@/components/review/funnel";
import { OrderGate } from "@/components/review/order-gate";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Tracks the lg breakpoint (1024px). Defaults to desktop so SSR + first client
 *  render agree; corrects on mount. */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

type Status = "idle" | "loading" | "ready" | "error";
type Tab = "selection" | "tradeoff";

let idc = 0;
const nid = (p: string) => `${p}-${Date.now().toString(36)}-${idc++}`;

/** Reduce a streamed chunk (never an effect) into the assistant message's parts. */
function reduceParts(parts: MessagePart[], chunk: Exclude<AgentChunk, { type: "effect" }>): MessagePart[] {
  const next = parts.slice();
  const last = next[next.length - 1];
  switch (chunk.type) {
    case "reasoning-delta":
      if (last && last.type === "reasoning") {
        next[next.length - 1] = { ...last, text: last.text + chunk.text };
      } else {
        next.push({ type: "reasoning", id: nid("r"), text: chunk.text });
      }
      return next;
    case "text-delta":
      if (last && last.type === "text") {
        next[next.length - 1] = { ...last, text: last.text + chunk.text };
      } else {
        next.push({ type: "text", id: nid("t"), text: chunk.text });
      }
      return next;
    case "tool-start":
      next.push({ type: "tool", state: "running", ...chunk.tool });
      return next;
    case "tool-finish":
      return next.map((p) =>
        p.type === "tool" && p.id === chunk.id
          ? { ...p, state: "done" as const, output: chunk.output, durationMs: chunk.durationMs }
          : p
      );
  }
}

export function Workbench() {
  const viewerRef = useRef<MolstarHandle>(null);
  const ctxRef = useRef<AgentContext>({
    hasStructure: false,
    hasVariants: false,
    ranked: false,
    selectedId: null,
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", parts: [{ type: "text", id: "w", text: WELCOME_TEXT }] },
  ]);
  const [streaming, setStreaming] = useState(false);

  const [structure, setStructure] = useState<StructurePreset | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("selection");
  const [tradeoffIds, setTradeoffIds] = useState<string[]>([]);
  const [orderStaged, setOrderStaged] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const isDesktop = useIsDesktop();
  const chatPanelRef = usePanelRef();
  const [chatOpen, setChatOpen] = useState(true);

  const selected = useMemo(
    () => ALL_VARIANTS.find((v) => v.id === selectedId) ?? null,
    [selectedId]
  );
  const tradeoffVariants = useMemo(
    () => tradeoffIds.map((id) => ALL_VARIANTS.find((v) => v.id === id)).filter(Boolean) as Variant[],
    [tradeoffIds]
  );
  const heatSet = useMemo(() => [PARENT, ...(variants.length ? variants : CANDIDATES)], [variants]);

  // Auto-load the hero scaffold for an immediate 3D first impression.
  useEffect(() => {
    const t = setTimeout(() => {
      setStructure(HERO_STRUCTURE);
      viewerRef.current?.load(HERO_STRUCTURE.pdbId, HERO_STRUCTURE.chain);
      ctxRef.current.hasStructure = true;
    }, 350);
    return () => clearTimeout(t);
  }, []);

  const applyEffect = useCallback((eff: AgentEffect) => {
    switch (eff.kind) {
      case "load": {
        const preset =
          STRUCTURE_PRESETS.find((p) => p.pdbId === eff.pdbId) ?? HERO_STRUCTURE;
        setStructure(preset);
        setSelectedId(null);
        viewerRef.current?.load(eff.pdbId, eff.chain);
        ctxRef.current.hasStructure = true;
        break;
      }
      case "proposeVariants":
        setVariants(CANDIDATES);
        setTab("selection");
        ctxRef.current.hasVariants = true;
        break;
      case "rank":
        ctxRef.current.ranked = true;
        break;
      case "selectVariant":
        setSelectedId(eff.variantId);
        setTab("selection");
        ctxRef.current.selectedId = eff.variantId;
        break;
      case "focusResidues":
        viewerRef.current?.focusResidues(eff.residues, eff.chain);
        break;
      case "representation":
        viewerRef.current?.setRepresentation(eff.theme);
        break;
      case "openTradeoff":
        setTradeoffIds(eff.variantIds);
        setTab("tradeoff");
        break;
      case "proposeOrder":
        setOrderStaged(true);
        setOrderConfirmed(false);
        break;
    }
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: nid("u"),
        role: "user",
        parts: [{ type: "text", id: nid("ut"), text }],
      };
      const assistantId = nid("a");
      setMessages((m) => [
        ...m,
        userMsg,
        { id: assistantId, role: "assistant", parts: [] },
      ]);
      setStreaming(true);

      try {
        for await (const chunk of runAgent(text, ctxRef.current)) {
          if (chunk.type === "effect") {
            applyEffect(chunk.effect);
            continue;
          }
          setMessages((msgs) =>
            msgs.map((msg) =>
              msg.id === assistantId
                ? { ...msg, parts: reduceParts(msg.parts, chunk) }
                : msg
            )
          );
        }
      } finally {
        setStreaming(false);
      }
    },
    [applyEffect]
  );

  const handleDeselect = useCallback(() => {
    setSelectedId(null);
    ctxRef.current.selectedId = null;
    viewerRef.current?.clearFocus();
    viewerRef.current?.resetView();
    // Clearing the focus returns the structure to its lively idle spin.
    viewerRef.current?.setSpin(true);
  }, []);

  const handleSelectFromTable = useCallback(
    (v: Variant) => {
      // Clicking the already-focused variant clears the selection (toggle).
      if (v.id === selectedId) {
        handleDeselect();
        return;
      }
      setSelectedId(v.id);
      ctxRef.current.selectedId = v.id;
      if (structure && v.residues.length) {
        viewerRef.current?.focusResidues(v.residues, structure.chain);
      }
    },
    [structure, selectedId, handleDeselect]
  );

  // Escape clears the focused variant from anywhere on the surface.
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDeselect();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, handleDeselect]);

  // Single instances of each surface — composed differently per breakpoint so
  // the (expensive, single-WebGL) Mol* viewer never mounts twice.
  const renderChat = (withHide: boolean) => (
    <ChatPanel
      messages={messages}
      streaming={streaming}
      suggestions={SUGGESTIONS}
      onSend={handleSend}
      onHide={withHide ? () => chatPanelRef.current?.collapse() : undefined}
    />
  );

  const viewer = (
    <ViewerPanel
      viewerRef={viewerRef}
      structure={structure}
      status={status}
      selected={selected}
      onDeselect={handleDeselect}
      onStatus={(s) => {
        setStatus(s);
        // On (re)mount — e.g. crossing the breakpoint — re-load the current
        // structure once the fresh plugin is ready.
        if (s === "idle" && structure) {
          viewerRef.current?.load(structure.pdbId, structure.chain);
        }
      }}
    />
  );

  const reviewBottom = (
    <div className="@container/review flex h-full flex-col bg-card/20">
      {/* Container-query driven: funnel + tabs sit side-by-side when the panel is
          wide, and stack (funnel row / tabs row) when it's narrowed — whether by
          the resizable split on desktop or a small screen on mobile. */}
      <div className="flex flex-col border-b border-border @2xl/review:flex-row @2xl/review:items-center @2xl/review:justify-between @2xl/review:pr-4">
        <div className="min-w-0 @2xl/review:flex-1">
          <Funnel active={variants.length > 0} />
        </div>
        <div className="flex shrink-0 justify-end px-3 pb-2 @2xl/review:px-0 @2xl/review:pb-0">
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList>
              <TabsTrigger value="selection" className="gap-1.5 text-xs">
                <Table2 className="size-4" />
                Selection
              </TabsTrigger>
              <TabsTrigger value="tradeoff" className="gap-1.5 text-xs">
                <GitCompare className="size-4" />
                Tradeoff
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {variants.length === 0 ? (
          <EmptyReview />
        ) : tab === "selection" ? (
          <SelectionTable
            variants={variants}
            selectedId={selectedId}
            onSelect={handleSelectFromTable}
          />
        ) : (
          <TradeoffPanel
            variants={tradeoffVariants}
            heatSet={heatSet}
            busy={streaming}
            onWalk={() => handleSend("Walk me through the tradeoff")}
          />
        )}
      </div>

      {orderStaged && (
        <OrderGate
          confirmed={orderConfirmed}
          onConfirm={() => setOrderConfirmed(true)}
          onDismiss={() => setOrderStaged(false)}
        />
      )}
    </div>
  );

  // Desktop (≥lg): resizable chat rail | (resizable viewer / table). Chat is
  // collapsible via the header button, restored via the edge tab.
  if (isDesktop) {
    return (
      <ResizablePanelGroup
        orientation="horizontal"
        className="animate-reveal h-full"
      >
        <ResizablePanel
          panelRef={chatPanelRef}
          collapsible
          collapsedSize="0%"
          defaultSize="32%"
          minSize="22%"
          maxSize="48%"
          onResize={(size) => setChatOpen(size.asPercentage > 0)}
          className="min-w-0"
        >
          {renderChat(true)}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="68%" minSize="40%" className="relative min-w-0">
          {!chatOpen && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => chatPanelRef.current?.expand()}
                  className="absolute left-0 top-1/2 z-30 flex h-14 w-6 -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 border-border bg-card/80 text-muted-foreground opacity-50 shadow-sm backdrop-blur-md transition-all hover:w-7 hover:text-foreground hover:opacity-100"
                >
                  <PanelLeftOpen className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Show copilot</TooltipContent>
            </Tooltip>
          )}
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize="46%" minSize="22%" className="relative">
              {viewer}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="54%" minSize="28%" className="min-h-0">
              {reviewBottom}
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  }

  // Mobile (<lg): stacked viewer over table (page scrolls); chat lives in a
  // bottom sheet reached via a floating button.
  return (
    <>
      {/* Sheet + fixed trigger live OUTSIDE the animated wrapper: .animate-reveal
          retains an identity transform (fill-mode: both) which would otherwise
          become the containing block for the position:fixed button. */}
      <div className="animate-reveal">
        <div className="relative h-[46dvh] min-h-[300px] border-b border-border">
          {viewer}
        </div>
        <div className="h-[58dvh] min-h-[440px]">{reviewBottom}</div>
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button className="fixed bottom-4 right-4 z-40 h-11 gap-2 rounded-full bg-brand px-4 text-brand-foreground shadow-lg hover:bg-brand/90">
            <MessageSquareText className="size-4" />
            Copilot
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] p-0">
          <SheetTitle className="sr-only">Review copilot</SheetTitle>
          <SheetDescription className="sr-only">
            Chat with the AI review copilot to design, rank, and explain protein
            variants.
          </SheetDescription>
          {renderChat(false)}
        </SheetContent>
      </Sheet>
    </>
  );
}

function EmptyReview() {
  return (
    <Empty className="h-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FlaskConical className="size-4" strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle>No candidates yet</EmptyTitle>
        <EmptyDescription>
          Ask the copilot to{" "}
          <span className="font-medium text-foreground">
            “improve binding without losing stability”
          </span>{" "}
          and it will generate, rank, and drop a scored shortlist here.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
