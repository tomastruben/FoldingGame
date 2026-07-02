import {
  ALL_VARIANTS,
  CANDIDATES,
  FUNNEL,
  HERO_STRUCTURE,
  OBJECTIVE,
  PARENT,
  TOP_CANDIDATE_ID,
} from "./data";
import { PROPERTIES } from "./properties";
import type { AgentChunk, ToolName } from "./types";

/**
 * A self-contained streaming agent. It emits the same shape of parts a real
 * AI-SDK tool-calling loop would (reasoning deltas, tool-call start/finish,
 * text deltas) plus "effects" that drive the 3D viewer and the Selection
 * table. Swapping this for a real `/api/chat` route + `useChat` is a drop-in:
 * the UI only consumes AgentChunk.
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const TOKEN_MS = 12;
const REASON_MS = 9;

let counter = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${counter++}`;

async function* streamText(
  text: string,
  kind: "text-delta" | "reasoning-delta" = "text-delta"
): AsyncGenerator<AgentChunk> {
  const tokens = text.match(/\S+\s*/g) ?? [text];
  for (const t of tokens) {
    yield { type: kind, text: t };
    await sleep(kind === "reasoning-delta" ? REASON_MS : TOKEN_MS);
  }
}

interface ToolRun {
  name: ToolName;
  title: string;
  input: Record<string, unknown>;
  output: string;
  durationMs: number;
}

async function* runTool(t: ToolRun): AsyncGenerator<AgentChunk> {
  const id = uid("tool");
  yield {
    type: "tool-start",
    tool: { id, name: t.name, title: t.title, input: t.input },
  };
  await sleep(Math.min(t.durationMs, 900));
  yield { type: "tool-finish", id, output: t.output, durationMs: t.durationMs };
}

export interface AgentContext {
  hasStructure: boolean;
  hasVariants: boolean;
  ranked: boolean;
  selectedId: string | null;
}

type Intent =
  | "pipeline"
  | "recommend"
  | "tradeoff"
  | "order"
  | "risk"
  | "help";

function classify(text: string): Intent {
  const t = text.toLowerCase();
  if (/(order|plate|96|wet.?lab|synthes|commit)/.test(t)) return "order";
  if (/(risk|uncertain|confidence|trust|calibrat|wrong)/.test(t)) return "risk";
  if (/(trade.?off|why|which mutation|compare|radar|driver)/.test(t))
    return "tradeoff";
  if (/(recommend|top|best|pick|winner|which (one|candidate)|inspect)/.test(t))
    return "recommend";
  if (/(improve|affinity|binding|tighten|optimi|design|generate|kd|propose)/.test(t))
    return "pipeline";
  return "help";
}

const top = ALL_VARIANTS.find((v) => v.id === TOP_CANDIDATE_ID)!;
// Fold-improvement of binding: parent Kd / candidate Kd (both lower-is-better).
const pct = (parentKd: number, candidateKd: number) =>
  `${(parentKd / candidateKd).toFixed(1)}×`;

/** Ensure a structure is loaded; yields the load tool if needed. */
async function* ensureStructure(
  ctx: AgentContext
): AsyncGenerator<AgentChunk> {
  if (ctx.hasStructure) return;
  yield {
    type: "effect",
    effect: { kind: "load", pdbId: HERO_STRUCTURE.pdbId, chain: HERO_STRUCTURE.chain },
  };
  yield* runTool({
    name: "load_structure",
    title: `Load ${HERO_STRUCTURE.pdbId} — ${HERO_STRUCTURE.label}`,
    input: { pdbId: HERO_STRUCTURE.pdbId, source: "RCSB" },
    output: `Loaded ${HERO_STRUCTURE.pdbId} (${HERO_STRUCTURE.kind}). Heavy-chain CDR loops resolved.`,
    durationMs: 1300,
  });
  ctx.hasStructure = true;
}

async function* pipeline(ctx: AgentContext): AsyncGenerator<AgentChunk> {
  yield* streamText(
    `Objective is "${OBJECTIVE.title}". I'll ground this in the parent structure, generate against the whole reachable space, then collapse to a shortlist you can actually order. I'll keep every number tied to a confidence signal.`,
    "reasoning-delta"
  );

  yield* ensureStructure(ctx);

  yield* runTool({
    name: "propose_variants",
    title: "Generate candidates against the objective",
    input: {
      objective: OBJECTIVE.summary,
      space: FUNNEL.designSpace,
      hold: OBJECTIVE.constraints,
    },
    output: `Scored ${FUNNEL.generated.toLocaleString()} proposals from a ${FUNNEL.designSpace.toLocaleString()}-sequence space; ${FUNNEL.shortlist} pass the round-3 constraints.`,
    durationMs: 2100,
  });
  yield { type: "effect", effect: { kind: "proposeVariants" } };
  ctx.hasVariants = true;

  yield* runTool({
    name: "rank_candidates",
    title: "Rank by objective + calibrated confidence",
    input: { primary: "binding", penalizeUncertainty: true },
    output: `Ranked ${CANDIDATES.length} variants. Top pick ${top.name} at ${PROPERTIES.binding.format(
      top.properties.binding.predicted
    )} nM predicted (${pct(PARENT.properties.binding.predicted, top.properties.binding.predicted)} tighter than parent).`,
    durationMs: 900,
  });
  yield { type: "effect", effect: { kind: "rank" } };
  ctx.ranked = true;

  yield* streamText(
    `Done. From ~${FUNNEL.designSpace.toLocaleString()} reachable sequences I've narrowed to **${FUNNEL.shortlist}** candidates that clear every constraint. `
  );
  yield* streamText(
    `The standout is **${top.name}** (${top.mutations.join(
      " · "
    )}): predicted **${PROPERTIES.binding.format(
      top.properties.binding.predicted
    )} nM**, about ${pct(
      PARENT.properties.binding.predicted,
      top.properties.binding.predicted
    )} tighter than the parent, and it holds Tm at ${PROPERTIES.stability.format(
      top.properties.stability.predicted
    )} °C. `
  );
  yield* streamText(
    `Ask me to *recommend the top candidate* and I'll show you where those mutations sit on the structure, or *walk the tradeoff* to see what you'd give up.`
  );
}

async function* recommend(ctx: AgentContext): AsyncGenerator<AgentChunk> {
  if (!ctx.hasVariants) {
    // Auto-run the generate/rank pipeline first, then fall through to the
    // requested action so e.g. "walk me through the tradeoff" always ends on
    // the tradeoff (not just the freshly-proposed shortlist).
    yield* pipeline(ctx);
  }
  yield* streamText(
    `Pulling ${top.name} into focus and mapping its mutations onto the CDR loops so you can sanity-check them against the paratope.`,
    "reasoning-delta"
  );
  yield { type: "effect", effect: { kind: "selectVariant", variantId: top.id } };
  yield* runTool({
    name: "inspect_variant",
    title: `Inspect ${top.name} on the structure`,
    input: { variant: top.name, mutations: top.mutations },
    output: `Focused chain ${HERO_STRUCTURE.chain} residues ${top.residues.join(
      ", "
    )}. All three sit in the binding interface, not the core.`,
    durationMs: 1100,
  });
  yield {
    type: "effect",
    effect: {
      kind: "focusResidues",
      residues: top.residues,
      chain: HERO_STRUCTURE.chain,
    },
  };
  yield* streamText(
    `**${top.name}** is my recommendation. The three substitutions — ${top.mutations
      .map((m) => `\`${m}\``)
      .join(", ")} — all fall in the heavy-chain CDR loops at the interface, which is exactly where you want affinity gains to come from. `
  );
  yield* streamText(
    `Confidence on the binding prediction is ${(top.properties.binding.confidence * 100).toFixed(
      0
    )}%. The one thing I'd flag: titer confidence is only ${(top.properties.expression.confidence * 100).toFixed(
      0
    )}% — worth a column on the plate to de-risk. Want the full tradeoff, or shall I stage a plate?`
  );
}

async function* tradeoff(ctx: AgentContext): AsyncGenerator<AgentChunk> {
  if (!ctx.hasVariants) {
    // Auto-run the generate/rank pipeline first, then fall through to the
    // requested action so e.g. "walk me through the tradeoff" always ends on
    // the tradeoff (not just the freshly-proposed shortlist).
    yield* pipeline(ctx);
  }
  yield* streamText(
    `Comparing the two best generations across all five properties. I'll avoid a radar chart here — area encodes nothing real and axis order changes the story. A shared baseline with honest deltas reads truer when you're about to spend a plate.`,
    "reasoning-delta"
  );
  const rivals = ["cr3-014", "cr3-052", "cr3-090"];
  yield {
    type: "effect",
    effect: { kind: "openTradeoff", variantIds: rivals },
  };
  yield* runTool({
    name: "compare_tradeoff",
    title: "Multi-property tradeoff vs parent",
    input: { variants: rivals, encoding: "aligned-bars" },
    output:
      "cr3-014 wins binding decisively; cr3-052 is the safe pick (best titer + stability); cr3-090 barely moves affinity.",
    durationMs: 800,
  });
  yield* streamText(
    `Here's the honest read: **cr3-014** buys the biggest affinity jump (${pct(
      PARENT.properties.binding.predicted,
      top.properties.binding.predicted
    )}) but spends a little titer and runs lower confidence there. **cr3-052** gives up affinity to keep the best stability and expression — the conservative order. `
  );
  yield* streamText(
    `If this plate is your affinity swing, order cr3-014 and hedge with cr3-052. If you can't afford a manufacturing surprise, lead with cr3-052.`
  );
}

async function* risk(): AsyncGenerator<AgentChunk> {
  yield* streamText(
    `The trust question. Every predicted number here carries a calibrated confidence, and rounds 1–2 are already measured — so you can check my calibration before believing round 3.`,
    "reasoning-delta"
  );
  yield* runTool({
    name: "compare_tradeoff",
    title: "Predicted vs measured (calibration on assayed variants)",
    input: { scope: "rounds 1–2", metric: "binding" },
    output:
      "Mean absolute error on measured binding ≈ 0.5 nM; predictions ran slightly optimistic on titer.",
    durationMs: 700,
  });
  yield* streamText(
    `On the four variants we've actually assayed, predicted binding tracked wet-lab within ~0.5 nM, and stability was nearly spot-on. The one honest bias: the model runs a touch optimistic on expression. `
  );
  yield* streamText(
    `That's why the table shows a predicted-vs-measured column and why I'd put a titer check on the plate. The uncertainty isn't hidden — it's the thing you should be steering by.`
  );
}

async function* order(ctx: AgentContext): AsyncGenerator<AgentChunk> {
  if (!ctx.hasVariants) {
    // Auto-run the generate/rank pipeline first, then fall through to the
    // requested action so e.g. "walk me through the tradeoff" always ends on
    // the tradeoff (not just the freshly-proposed shortlist).
    yield* pipeline(ctx);
  }
  yield* streamText(
    `Staging a plate. This is the expensive, irreversible step — a real wet-lab plate — so I'll lay out exactly what goes on it and leave the commit to you.`,
    "reasoning-delta"
  );
  yield { type: "effect", effect: { kind: "proposeOrder" } };
  yield* streamText(
    `I've staged a **${FUNNEL.plate}-well plate**: the ${FUNNEL.shortlist} round-3 shortlist as your affinity swing, the parent and two measured variants as anchors to keep calibration honest, and replicates on the low-confidence titer calls. `
  );
  yield* streamText(
    `Nothing is ordered until you approve it below. Review the plate and hit confirm when you're ready.`
  );
}

async function* help(): AsyncGenerator<AgentChunk> {
  yield* streamText(
    `I'm the Review copilot for this round. I can generate and rank candidates, show where mutations land on the 3D structure, walk the multi-property tradeoff, check the model's calibration against wet-lab truth, and stage a plate to order. `
  );
  yield* streamText(
    `Try: "improve binding without losing stability", "recommend the top candidate", "walk me through the tradeoff", or "how much can I trust these numbers?"`
  );
}

export async function* runAgent(
  userText: string,
  ctx: AgentContext
): AsyncGenerator<AgentChunk> {
  const intent = classify(userText);
  switch (intent) {
    case "pipeline":
      yield* pipeline(ctx);
      break;
    case "recommend":
      yield* recommend(ctx);
      break;
    case "tradeoff":
      yield* tradeoff(ctx);
      break;
    case "risk":
      yield* risk();
      break;
    case "order":
      yield* order(ctx);
      break;
    default:
      yield* help();
  }
}

export const WELCOME_TEXT = `I'm your **Review copilot** for round 3 of the anti-IL-23 Fab. The parent binds at **${PROPERTIES.binding.format(
  PARENT.properties.binding.predicted
)} nM** — your job this round is to make it **tighter** without breaking anything else. Tell me where to point the model.`;

export const SUGGESTIONS = [
  "Improve binding without losing stability",
  "Recommend the top candidate",
  "Walk me through the tradeoff",
  "How much can I trust these numbers?",
];
