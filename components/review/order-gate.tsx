"use client";

import { motion } from "framer-motion";
import { CheckCircle2, FlaskConical, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FUNNEL } from "@/lib/data";

interface Props {
  confirmed: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

const PLATE = [
  { n: FUNNEL.shortlist, label: "round-3 shortlist", sub: "affinity swing" },
  { n: 3, label: "anchors", sub: "parent + 2 measured, keep calibration honest" },
  { n: 2, label: "titer replicates", sub: "de-risk low-confidence expression calls" },
];

export function OrderGate({ confirmed, onConfirm, onDismiss }: Props) {
  if (confirmed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-3 border-t border-brand/30 bg-brand/5 px-4 py-3"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
          <CheckCircle2 className="size-5" strokeWidth={2} />
        </span>
        <div className="flex-1 text-sm">
          <p className="font-semibold tracking-tight text-foreground">
            Plate ordered — round 4 queued
          </p>
          <p className="text-xs text-muted-foreground">
            {FUNNEL.plate} wells sent to the wet lab. Results will feed the next
            Learn step.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease: [0.16, 1, 0.3, 1] }}
      className="border-t border-amber-500/30 bg-amber-500/[0.06] px-4 py-3"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-400">
          <FlaskConical className="size-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold tracking-tight text-foreground">
              Approve wet-lab plate
            </p>
            <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
              <ShieldCheck className="size-3" /> irreversible
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {FUNNEL.plate} wells · nothing is ordered until you confirm.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
            {PLATE.map((p) => (
              <div key={p.label} className="text-xs">
                <span className="font-mono font-medium text-foreground">
                  {p.n}×
                </span>{" "}
                <span className="text-foreground/80">{p.label}</span>{" "}
                <span className="text-muted-foreground/60">— {p.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" className="h-8" onClick={onDismiss}>
          <X className="size-3.5" /> Dismiss
        </Button>
        <Button
          size="sm"
          className="h-8 bg-amber-500 font-medium text-amber-950 hover:bg-amber-400"
          onClick={onConfirm}
        >
          Confirm & order plate
        </Button>
      </div>
    </motion.div>
  );
}
