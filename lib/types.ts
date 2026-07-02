// Domain + chat/agent types for the Cradle "Review copilot" demo.

export type PropertyKey =
  | "binding"
  | "stability"
  | "expression"
  | "specificity"
  | "immunogenicity";

export type Direction = "higher" | "lower";

export interface PropertyMeta {
  key: PropertyKey;
  /** Full scientific name. */
  label: string;
  /** Short column header. */
  short: string;
  /** Measurement unit shown next to values. */
  unit: string;
  /** Which direction is "better". */
  direction: Direction;
  /** One-line, non-expert explanation used in tooltips. */
  hint: string;
  /** Value formatting for the table cell. */
  format: (v: number) => string;
}

/** A single predicted property with its calibrated uncertainty + optional wet-lab truth. */
export interface PropertyValue {
  predicted: number;
  /** Model confidence in [0,1]. Drives the uncertainty band. */
  confidence: number;
  /** Wet-lab measured value, present only for variants that have been assayed. */
  measured?: number;
}

export interface Variant {
  id: string;
  /** Human label, e.g. "cr3-014". */
  name: string;
  /** Mutation chips relative to the parent, e.g. ["S31R", "N57Y"]. */
  mutations: string[];
  /** Auth residue seq-ids (in the loaded structure) the mutations map onto. */
  residues: number[];
  properties: Record<PropertyKey, PropertyValue>;
  /** Round in which this candidate was generated. */
  round: number;
  /** true = already ordered/measured in a prior round (has ground truth). */
  assayed: boolean;
  /** Model's aggregate score in [0,1] across the objective. */
  score: number;
}

export interface StructurePreset {
  id: string;
  pdbId: string;
  label: string;
  kind: string;
  chain: string;
  blurb: string;
}

/* ----------------------------- Agent / chat ----------------------------- */

export type ToolName =
  | "load_structure"
  | "propose_variants"
  | "rank_candidates"
  | "inspect_variant"
  | "compare_tradeoff"
  | "set_representation";

export type ToolState = "input-streaming" | "running" | "done" | "error";

export interface ToolPartBase {
  type: "tool";
  id: string;
  name: ToolName;
  title: string;
  state: ToolState;
  input?: Record<string, unknown>;
  /** Short human-readable result summary rendered in the tool card. */
  output?: string;
  /** ms the tool "ran" for — shown as latency, a small trust signal. */
  durationMs?: number;
}

export interface TextPart {
  type: "text";
  id: string;
  text: string;
}

export interface ReasoningPart {
  type: "reasoning";
  id: string;
  text: string;
}

export type MessagePart = TextPart | ReasoningPart | ToolPartBase;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  parts: MessagePart[];
}

/** A side effect the agent asks the workbench to perform (drives the 3D + table). */
export type AgentEffect =
  | { kind: "load"; pdbId: string; chain: string }
  | { kind: "proposeVariants" }
  | { kind: "rank" }
  | { kind: "selectVariant"; variantId: string }
  | { kind: "focusResidues"; residues: number[]; chain: string }
  | { kind: "representation"; theme: RepresentationTheme }
  | { kind: "openTradeoff"; variantIds: string[] }
  | { kind: "proposeOrder" };

export type RepresentationTheme =
  | "chain"
  | "hydrophobicity"
  | "confidence"
  | "bfactor";

/** One streamed chunk from the agent engine. */
export type AgentChunk =
  | { type: "reasoning-delta"; text: string }
  | { type: "text-delta"; text: string }
  | { type: "tool-start"; tool: Omit<ToolPartBase, "type" | "state"> }
  | { type: "tool-finish"; id: string; output: string; durationMs: number }
  | { type: "effect"; effect: AgentEffect };
