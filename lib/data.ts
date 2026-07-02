import type { PropertyKey, StructurePreset, Variant } from "./types";

/**
 * Demo scenario: round 3 of affinity-maturing an anti-IL-23 Fab.
 * Objective: tighten binding (lower Kd) without giving up stability, titer,
 * specificity, or clean immunogenicity. Rounds 1–2 are already assayed
 * (measured present); round 3 is freshly generated (prediction only).
 */

export const HERO_STRUCTURE: StructurePreset = {
  id: "fab",
  pdbId: "1IGT",
  label: "anti-IL-23 IgG (parent scaffold)",
  kind: "Antibody · IgG",
  chain: "A",
  blurb: "The parent binder. Mutations land in the heavy-chain CDR loops.",
};

export const STRUCTURE_PRESETS: StructurePreset[] = [
  HERO_STRUCTURE,
  {
    id: "gfp",
    pdbId: "1EMA",
    label: "GFP β-barrel",
    kind: "Reporter · fluorescent",
    chain: "A",
    blurb: "A tight β-barrel — useful when the objective is fold stability.",
  },
  {
    id: "lyz",
    pdbId: "1LYZ",
    label: "Lysozyme",
    kind: "Enzyme · hydrolase",
    chain: "A",
    blurb: "Small enzyme scaffold for activity/stability engineering.",
  },
];

export const OBJECTIVE = {
  title: "Tighten binding, hold everything else",
  primary: "binding" as PropertyKey,
  constraints: ["stability", "expression", "specificity", "immunogenicity"] as PropertyKey[],
  summary:
    "Lower Kd by ≥3× versus the parent while keeping Tm ≥ 66 °C, titer ≥ 40 mg/L, and immunogenicity risk flat.",
};

/** Parent / wild-type reference used for improvement deltas. */
export const PARENT: Variant = {
  id: "wt",
  name: "parent (WT)",
  mutations: [],
  residues: [],
  round: 0,
  assayed: true,
  score: 0.42,
  properties: {
    binding: { predicted: 12.0, confidence: 0.95, measured: 11.4 },
    stability: { predicted: 68.0, confidence: 0.92, measured: 67.6 },
    expression: { predicted: 45, confidence: 0.9, measured: 46 },
    specificity: { predicted: 0.71, confidence: 0.88, measured: 0.7 },
    immunogenicity: { predicted: 0.34, confidence: 0.8, measured: 0.36 },
  },
};

export const CANDIDATES: Variant[] = [
  // ---- Round 3: fresh generations (prediction only) ----
  {
    id: "cr3-014",
    name: "cr3-014",
    mutations: ["S31R", "N57Y", "T96W"],
    residues: [31, 57, 96],
    round: 3,
    assayed: false,
    score: 0.91,
    properties: {
      binding: { predicted: 2.1, confidence: 0.86 },
      stability: { predicted: 67.4, confidence: 0.82 },
      expression: { predicted: 43, confidence: 0.74 },
      specificity: { predicted: 0.79, confidence: 0.7 },
      immunogenicity: { predicted: 0.33, confidence: 0.66 },
    },
  },
  {
    id: "cr3-041",
    name: "cr3-041",
    mutations: ["S31R", "Y33F", "T96W"],
    residues: [31, 33, 96],
    round: 3,
    assayed: false,
    score: 0.88,
    properties: {
      binding: { predicted: 1.7, confidence: 0.71 },
      stability: { predicted: 64.9, confidence: 0.78 },
      expression: { predicted: 38, confidence: 0.7 },
      specificity: { predicted: 0.82, confidence: 0.72 },
      immunogenicity: { predicted: 0.35, confidence: 0.6 },
    },
  },
  {
    id: "cr3-052",
    name: "cr3-052",
    mutations: ["N57Y", "T96W", "S99A"],
    residues: [57, 96, 99],
    round: 3,
    assayed: false,
    score: 0.83,
    properties: {
      binding: { predicted: 3.0, confidence: 0.8 },
      stability: { predicted: 69.1, confidence: 0.85 },
      expression: { predicted: 47, confidence: 0.8 },
      specificity: { predicted: 0.74, confidence: 0.68 },
      immunogenicity: { predicted: 0.31, confidence: 0.64 },
    },
  },
  {
    id: "cr3-077",
    name: "cr3-077",
    mutations: ["S31R", "N57Y", "T96W", "D101E"],
    residues: [31, 57, 96, 101],
    round: 3,
    assayed: false,
    score: 0.79,
    properties: {
      binding: { predicted: 1.9, confidence: 0.58 },
      stability: { predicted: 63.2, confidence: 0.6 },
      expression: { predicted: 31, confidence: 0.55 },
      specificity: { predicted: 0.8, confidence: 0.62 },
      immunogenicity: { predicted: 0.42, confidence: 0.5 },
    },
  },
  {
    id: "cr3-090",
    name: "cr3-090",
    mutations: ["Y33W", "N57Y"],
    residues: [33, 57],
    round: 3,
    assayed: false,
    score: 0.72,
    properties: {
      binding: { predicted: 4.4, confidence: 0.83 },
      stability: { predicted: 70.2, confidence: 0.88 },
      expression: { predicted: 49, confidence: 0.82 },
      specificity: { predicted: 0.73, confidence: 0.75 },
      immunogenicity: { predicted: 0.3, confidence: 0.7 },
    },
  },
  {
    id: "cr3-103",
    name: "cr3-103",
    mutations: ["S31R", "T96W"],
    residues: [31, 96],
    round: 3,
    assayed: false,
    score: 0.7,
    properties: {
      binding: { predicted: 5.1, confidence: 0.87 },
      stability: { predicted: 67.9, confidence: 0.86 },
      expression: { predicted: 44, confidence: 0.83 },
      specificity: { predicted: 0.72, confidence: 0.74 },
      immunogenicity: { predicted: 0.32, confidence: 0.72 },
    },
  },
  // ---- Rounds 1–2: already ordered + measured (ground truth present) ----
  {
    id: "cr2-006",
    name: "cr2-006",
    mutations: ["N57Y", "T96W"],
    residues: [57, 96],
    round: 2,
    assayed: true,
    score: 0.77,
    properties: {
      binding: { predicted: 3.6, confidence: 0.84, measured: 3.9 },
      stability: { predicted: 68.5, confidence: 0.85, measured: 68.1 },
      expression: { predicted: 46, confidence: 0.82, measured: 44 },
      specificity: { predicted: 0.75, confidence: 0.7, measured: 0.73 },
      immunogenicity: { predicted: 0.32, confidence: 0.66, measured: 0.35 },
    },
  },
  {
    id: "cr2-018",
    name: "cr2-018",
    mutations: ["S31R", "N57Y"],
    residues: [31, 57],
    round: 2,
    assayed: true,
    score: 0.68,
    properties: {
      binding: { predicted: 4.9, confidence: 0.8, measured: 4.2 },
      stability: { predicted: 66.8, confidence: 0.82, measured: 67.2 },
      expression: { predicted: 42, confidence: 0.78, measured: 45 },
      specificity: { predicted: 0.77, confidence: 0.72, measured: 0.78 },
      immunogenicity: { predicted: 0.33, confidence: 0.64, measured: 0.31 },
    },
  },
  {
    id: "cr1-002",
    name: "cr1-002",
    mutations: ["T96W"],
    residues: [96],
    round: 1,
    assayed: true,
    score: 0.58,
    properties: {
      binding: { predicted: 7.2, confidence: 0.78, measured: 6.8 },
      stability: { predicted: 68.1, confidence: 0.84, measured: 68.4 },
      expression: { predicted: 45, confidence: 0.83, measured: 47 },
      specificity: { predicted: 0.72, confidence: 0.7, measured: 0.71 },
      immunogenicity: { predicted: 0.34, confidence: 0.68, measured: 0.33 },
    },
  },
  {
    id: "cr1-009",
    name: "cr1-009",
    mutations: ["N57Y"],
    residues: [57],
    round: 1,
    assayed: true,
    score: 0.55,
    properties: {
      binding: { predicted: 8.0, confidence: 0.82, measured: 8.6 },
      stability: { predicted: 69.0, confidence: 0.86, measured: 68.7 },
      expression: { predicted: 48, confidence: 0.84, measured: 46 },
      specificity: { predicted: 0.73, confidence: 0.71, measured: 0.72 },
      immunogenicity: { predicted: 0.31, confidence: 0.7, measured: 0.32 },
    },
  },
];

export const ALL_VARIANTS: Variant[] = [PARENT, ...CANDIDATES];

export const TOP_CANDIDATE_ID = "cr3-014";

/** The "collapse" headline numbers the Selection view is built to justify. */
export const FUNNEL = {
  designSpace: 524288, // 2^19 — the reachable sequence space this round
  generated: 1840, // model-scored proposals
  shortlist: CANDIDATES.filter((c) => c.round === 3).length,
  plate: 96, // an orderable wet-lab plate
};
