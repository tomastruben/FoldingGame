# Foldbench — design decisions

A design-engineering prototype: an **AI review copilot for antibody engineering**. A
chat rail sits beside a live [Mol\*](https://molstar.org) 3D viewer and a dense
multi-property candidate table. A streamed tool-call agent drives all three.

This document is the *why* behind the build — the decisions, the alternatives I
rejected, and the trade-offs I accepted. It's written so I can talk through it in
an interview, not as marketing.

---

## The one-minute version

Modern models can propose thousands of antibody variants per round. Generation is
no longer the hard part — **review is**: deciding which handful of designs are
worth an expensive wet-lab plate. Foldbench is a concept for that review surface.
Every decision below serves one goal: **help a scientist make a confident,
auditable ordering decision faster**, without pretending the model is more certain
than it is.

---

## 1. The thesis: the bottleneck is review, not generation

**Decision.** Build the *review* surface, not another sequence generator.

**Why.** The DBTL (Design–Build–Test–Learn) loop has been rebalanced by ML. The
scarce, expensive resource is now the human judgment call — and the plate — at the
end of "Design." That's where a copilot earns its keep.

**Trade-off.** Less flashy than "generate a protein from a prompt," but it's the
part of the workflow where a tool actually changes an outcome.

## 2. One surface, three coordinated views

**Decision.** Conversation, 3D structure, and the candidate table live together in
a single view. The AI's actions move all three at once.

**Why.** Reviewing a candidate means holding three things in your head
simultaneously — *where* the mutations sit on the structure, *what* the numbers
say, and *why* the model proposed them. Splitting these across tabs or pages forces
the reviewer to rebuild context on every switch, which is exactly the cost review
can't afford.

**Trade-off.** Higher information density and a harder responsive layout (solved
with a resizable split on desktop, stacked panels + a bottom-sheet chat on mobile).

## 3. The AI operates the tools — it isn't a sidecar chatbot

**Decision.** The copilot drives the viewer and the table through a **streamed
tool-call loop** (reasoning deltas → `propose_variants` → `rank_candidates` →
`compare_tradeoff` → viewer effects → text). It emits the exact chunk shape a live
[AI SDK](https://sdk.vercel.ai) agent produces.

**Why.** A chatbot that *describes* results is a demo; an agent that *performs* the
review — loads the structure, focuses residues, ranks, stages a plate — is a
product. Modeling the real streaming contract keeps the prototype honest: the demo
is scripted, but swapping in a real `/api/chat` route is a drop-in, not a rewrite.

**Trade-off.** The scripted agent is deterministic (great for a demo, and I say so
in the UI) rather than genuinely reasoning. The architecture, not the intelligence,
is what's real here.

## 4. Never show a number without its confidence

**Decision.** Every predicted property carries a **calibrated confidence** bar, and
earlier rounds show **predicted-vs-measured** error inline (`meas 11.4 (+5%)`).

**Why.** A scientific audience does not — and should not — trust a bare point
estimate. Showing calibration against wet-lab truth from prior rounds lets the
reviewer audit the model *before* betting a plate on round 3. Uncertainty is the
thing you steer by, so it's first-class, not a footnote.

**Trade-off.** More visual load per cell. I bought it back with a heatmap so the
table is still scannable at a glance (see §7).

## 5. Aligned tradeoff tracks, not a radar chart

**Decision.** The multi-property tradeoff is shown as **aligned per-property tracks
on a shared worst→best baseline**, with the parent as a fixed reference tick — not a
radar/spider chart.

**Why.** A radar chart's *area* encodes nothing real, and its shape changes
depending on the arbitrary order you place the axes — it looks analytical while
actively misleading. Aligned tracks let a scientist read a precise per-axis winner
("cr3-014 wins binding, cr3-052 wins stability") before spending money.

**Trade-off.** Less immediately "chart-like." I consider that a feature: I'd rather
the visualization be honest than familiar. This is the decision I'd most want to
defend in a design review.

## 6. The irreversible step gets friction

**Decision.** Ordering a 96-well plate is gated behind an explicit confirmation.
It's the only place in the flow with a hard stop.

**Why.** Interface friction should match real-world consequence. Everything up to
the plate is reversible exploration and should feel fast and fluid; the plate is
real money and real time, so it gets a deliberate, unmissable gate. Matching the
UI's "weight" to the stakes is a core interaction-design principle.

**Trade-off.** One extra click on the one action where an extra click is correct.

## 7. Restraint as a design language — the data is the hero

**Decision.** Neutral dark base (shadcn/ui) + **one** flat blue accent. No
gradients, no glow, no serif display type, no texture. Color is spent only where it
carries meaning: the goodness heatmap, confidence bars (emerald/amber/rose), the
tradeoff series, and the semantic amber of the order gate.

**Why.** In a data tool, ornament competes with the data for attention and erodes
trust — it reads as "designed to impress" rather than "designed to be read." Apple's
restraint is the right reference: reduce until only the meaningful remains. (This was
an explicit course-correction after a first pass that looked like generic "AI slop.")

**Trade-off.** Less obviously "designed" at a glance; the craft shows up in spacing,
hierarchy, motion, and consistency instead of in decoration.

## 8. Every selection has an obvious exit

**Decision.** Selecting a candidate focuses its residue segment on the structure;
it can be cleared three ways — click the row again, a visible **× clear** control on
the viewer, or **Esc** — and clearing resets the camera and resumes the idle spin.

**Why.** A state you can enter but not obviously leave is a small trap. Reversibility
and clear affordances are cheap to build and disproportionately affect how
trustworthy an interface feels.

**Trade-off.** Three redundant paths to the same action — intentional redundancy for
discoverability.

## 9. Engineering: making Mol\* production-grade

Two decisions worth mentioning because they show the gap between "works on my
machine" and "ships":

- **Production build.** Turbopack's production minifier reorders Mol\*'s circular
  ESM modules so an internal reference resolves to `undefined` at eval time — the
  viewer crashed *only* in prod builds. Fixed by building with the webpack builder
  (`next build --webpack`) + `transpilePackages: ["molstar"]`. Dev-vs-prod parity
  bugs are the ones that bite after you think you're done.

- **A real load race.** The viewer auto-loaded on a fixed 350 ms timer, but Mol\*'s
  async init often finishes later, so the load was silently dropped — and the
  recovery read its target from a stale closure, so it never retried. It stuck on
  "Preparing…" until a refresh. Fixed by driving the reload from a ref, plus a fetch
  timeout and a Retry button so a stalled RCSB request is always recoverable without
  a refresh. Intermittent races are worth chasing to root cause, not papering over.

---

## What's real vs. faked (so I can be honest about it)

- **Real:** the whole front end, the streaming agent *contract*, the Mol\* wiring to
  RCSB, the responsive layout, the production build pipeline, and the interaction
  design.
- **Scripted:** the agent's "reasoning" and the candidate data are authored, not
  model-generated. The UI says so in the composer footer.
- **What production adds:** a real `/api/chat` route behind the same `AgentChunk`
  contract, real model inference + assay data, and auth — none of which change the
  interface.

## What I'd do next

- Wire the scripted loop to a live model behind the existing streaming contract.
- Let the reviewer edit the objective/constraints and re-rank live.
- Add a diff view across DBTL rounds (what changed, what the model learned).
- Persist decisions so "why did we order this plate?" is answerable months later.

---

*Prototype by Tomas Truben. Stack: Next.js (App Router) · shadcn/ui · Tailwind ·
Mol\* · AI SDK streaming pattern. Press **H** in the app for the in-product version
of this summary.*
