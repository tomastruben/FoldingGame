import type { PropertyKey, PropertyMeta, Variant } from "./types";

export const PROPERTY_ORDER: PropertyKey[] = [
  "binding",
  "stability",
  "expression",
  "specificity",
  "immunogenicity",
];

export const PROPERTIES: Record<PropertyKey, PropertyMeta> = {
  binding: {
    key: "binding",
    label: "Binding affinity",
    short: "Binding",
    unit: "nM",
    direction: "lower",
    hint: "Dissociation constant Kd. Lower is tighter binding — nanomolar is strong, micromolar is weak.",
    format: (v) => (v < 1 ? v.toFixed(2) : v.toFixed(1)),
  },
  stability: {
    key: "stability",
    label: "Thermostability",
    short: "Stability",
    unit: "°C",
    direction: "higher",
    hint: "Melting temperature Tm. Higher means the fold survives more heat — a proxy for shelf life.",
    format: (v) => v.toFixed(1),
  },
  expression: {
    key: "expression",
    label: "Expression titer",
    short: "Titer",
    unit: "mg/L",
    direction: "higher",
    hint: "How much usable protein the cells make. Higher is cheaper and easier to manufacture.",
    format: (v) => v.toFixed(0),
  },
  specificity: {
    key: "specificity",
    label: "Specificity",
    short: "Specificity",
    unit: "",
    direction: "higher",
    hint: "How cleanly it hits the intended target versus off-targets. Higher is more selective.",
    format: (v) => v.toFixed(2),
  },
  immunogenicity: {
    key: "immunogenicity",
    label: "Immunogenicity risk",
    short: "Immuno.",
    unit: "",
    direction: "lower",
    hint: "Predicted risk the immune system reacts to the molecule. Lower is safer as a therapeutic.",
    format: (v) => v.toFixed(2),
  },
};

/** Map a raw property value to a 0..1 "goodness" across the candidate set, honoring direction. */
export function goodness(
  key: PropertyKey,
  value: number,
  variants: Variant[]
): number {
  const vals = variants.map((v) => v.properties[key].predicted);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  if (max === min) return 0.5;
  const t = (value - min) / (max - min);
  return PROPERTIES[key].direction === "higher" ? t : 1 - t;
}

/** Signed improvement of a variant's property vs the parent (positive = better). */
export function improvement(
  key: PropertyKey,
  value: number,
  parent: number
): number {
  const dir = PROPERTIES[key].direction === "higher" ? 1 : -1;
  return ((value - parent) / parent) * 100 * dir;
}

/** Color for a goodness score — perceptual rose→amber→emerald ramp used across viz.
 * A constant, subtle alpha keeps the white value legible on every cell (bright
 * cells at full alpha previously washed the text out); the hue carries the signal. */
export function goodnessColor(g: number): string {
  // hue 25 (rose) → 90 (amber) → 152 (emerald)
  const hue = 25 + g * (152 - 25);
  return `oklch(0.72 0.2 ${hue.toFixed(0)} / 0.3)`;
}
