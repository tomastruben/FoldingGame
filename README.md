# Foldbench — an AI Review copilot for protein engineering

A design-engineering demo built around one problem: **making dense, uncertain, multi-property model output legible and trustworthy enough that a scientist will spend a real wet-lab plate on it.**

Chat on the left. A live 3D structure and a dense candidate table on the right. Everything on the right is driven by the copilot's **tool calls** — generate, rank, inspect on the structure, compare, and stage an order.

> Built as a portfolio piece for the **Cradle** Design Engineer role. It deliberately targets Cradle's **Review** surface (the third step of their Learn → Generate → Review loop), and uses **Mol\*** — the web molecular viewer created by David Sehnal, who is on Cradle's software team — for the 3D.

## The scenario

Round 3 of affinity-maturing an anti-IL-23 Fab. The parent binds at 12 nM; the objective is to tighten it ≥3× **without** giving up thermostability, expression titer, specificity, or a clean immunogenicity profile. The copilot collapses a ~524k-sequence design space down to a 96-well plate you can actually order.

## What it demonstrates

- **Agentic tool-calling loop** — streamed reasoning, tool-call cards (with inputs, results, and latency), then a synthesised answer. The same message-parts shape a live AI SDK model produces.
- **A dense, honest Selection table** — five properties per variant, each with a **calibrated confidence** underbar and, for already-assayed variants, a **predicted-vs-measured** delta so you can check the model's calibration before trusting round 3.
- **Live 3D that the agent drives** — the copilot loads the real structure from RCSB, then focuses the camera on a candidate's mutation residues in the CDR loops. Recolour by chain / hydrophobicity / flexibility; toggle spin.
- **A tradeoff view that is deliberately not a radar chart** — aligned per-property tracks with a shared worst→best baseline and the parent as a fixed reference. Area encodes nothing real and axis order changes the story; aligned tracks let you read a precise per-axis winner.
- **An approval gate for the irreversible step** — ordering a plate is the expensive, one-way action, so it is staged and explicitly confirmed, never auto-executed.

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript** · **Tailwind v4**
- **shadcn/ui** (Nova preset) for the component layer; chat UI follows the current AI-Elements pattern
- **Mol\*** (`molstar`) for molecular visualisation, embedded chrome-less and driven through an imperative handle
- No API key required — see below

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Try, in order:

1. **"Improve binding without losing stability"** — generates, ranks, and drops a scored shortlist.
2. **"Recommend the top candidate"** — focuses its mutations on the 3D structure.
3. **"Walk me through the tradeoff"** — opens the aligned-track comparison.
4. **"How much can I trust these numbers?"** — the calibration / predicted-vs-measured story.
5. **"Stage a plate to order"** — the approval gate.

You can also click any table row to focus that variant on the structure.

## Notes on the build

- **Why a scripted agent.** The agent (`lib/agent.ts`) is a self-contained async generator that emits AI-SDK-style chunks (`reasoning-delta`, `tool-start`/`tool-finish`, `text-delta`, plus `effect`s that drive the viewer and table). This keeps the demo runnable anywhere with zero setup, while the UI only ever consumes that chunk stream — so swapping in a real `/api/chat` route with `useChat` and live tools is a drop-in, not a rewrite.
- **The data is synthetic.** The variants, properties, and confidences are hand-authored to tell a realistic Review story; the *structure* (PDB `1IGT`) is real and loaded live from RCSB.
- **Resilience.** The Mol\* viewer wraps every operation defensively — if it can't initialise or reach RCSB, the chat and table still work.

## Structure

```
app/                     layout, page (app shell), theme
components/
  workbench.tsx          orchestrates chat state, streaming, viewer + table
  chat/                  message parts, tool-call cards, reasoning, prompt input
  viewer/                Mol* wrapper + floating controls
  review/                selection table, tradeoff, funnel, order gate
lib/
  agent.ts               streaming tool-calling agent (the swap point)
  data.ts                the scenario: structure + candidate set
  properties.ts          property metadata + goodness/heat helpers
  types.ts               domain + chat/agent types
```
