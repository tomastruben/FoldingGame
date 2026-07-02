"use client";

import "molstar/build/viewer/molstar.css";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Loader2 } from "lucide-react";
import type { RepresentationTheme } from "@/lib/types";

export interface MolstarHandle {
  load: (pdbId: string, chain: string) => Promise<void>;
  focusResidues: (residues: number[], chain: string) => Promise<void>;
  clearFocus: () => void;
  setRepresentation: (theme: RepresentationTheme) => Promise<void>;
  setSpin: (on: boolean) => void;
  resetView: () => void;
}

type Status = "idle" | "loading" | "ready" | "error";

const THEME_MAP: Record<RepresentationTheme, string> = {
  chain: "chain-id",
  hydrophobicity: "hydrophobicity",
  confidence: "uncertainty",
  bfactor: "uncertainty",
};

interface Props {
  onStatus?: (s: Status, pdbId?: string) => void;
}

/**
 * Thin, imperative wrapper around Mol* (David Sehnal's viewer, the production
 * lineage of RCSB / PDBe / AlphaFold DB). Chrome is hidden — we drive it
 * entirely through the handle so the agent's tool calls animate the structure.
 */
export const MolstarViewer = forwardRef<MolstarHandle, Props>(
  function MolstarViewer({ onStatus }, ref) {
    const hostRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pluginRef = useRef<any>(null);
    const initedRef = useRef(false);
    const [status, setStatus] = useState<Status>("idle");
    const [errMsg, setErrMsg] = useState<string>("");

    const setStat = (s: Status, pdb?: string) => {
      setStatus(s);
      onStatus?.(s, pdb);
    };

    useEffect(() => {
      if (initedRef.current) return;
      initedRef.current = true;
      let disposed = false;

      (async () => {
        try {
          const [{ createPluginUI }, { renderReact18 }, { DefaultPluginUISpec }, { Color }] =
            await Promise.all([
              import("molstar/lib/mol-plugin-ui"),
              import("molstar/lib/mol-plugin-ui/react18"),
              import("molstar/lib/mol-plugin-ui/spec"),
              import("molstar/lib/mol-util/color"),
            ]);

          if (disposed || !hostRef.current) return;

          const spec = DefaultPluginUISpec();
          // Bare viewport — we build our own controls.
          spec.layout = { initial: { isExpanded: false, showControls: false } };
          spec.components = {
            ...spec.components,
            controls: { top: "none", bottom: "none", left: "none", right: "none" },
          };

          const plugin = await createPluginUI({
            target: hostRef.current,
            spec,
            render: renderReact18,
          });
          if (disposed) {
            plugin.dispose();
            return;
          }
          pluginRef.current = plugin;

          // Match the app background exactly (--background = #0a0a0a) so the
          // canvas reads as part of the surface, with no visible seam.
          plugin.canvas3d?.setProps({
            renderer: { backgroundColor: Color(0x0a0a0a) },
            camera: { helper: { axes: { name: "off", params: {} } } },
          });
          setStat("idle");
        } catch (e) {
          console.error("Mol* init failed", e);
          setErrMsg(e instanceof Error ? e.message : String(e));
          setStat("error");
        }
      })();

      return () => {
        disposed = true;
        try {
          pluginRef.current?.dispose();
        } catch {
          /* ignore */
        }
        pluginRef.current = null;
        initedRef.current = false;
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    async function loadStructure(pdbId: string) {
      const plugin = pluginRef.current;
      if (!plugin) return;
      setStat("loading", pdbId);
      try {
        await plugin.clear();
        const lower = pdbId.toLowerCase();
        let data;
        try {
          data = await plugin.builders.data.download(
            { url: `https://models.rcsb.org/${lower}.bcif`, isBinary: true },
            { state: { isGhost: true } }
          );
          const traj = await plugin.builders.structure.parseTrajectory(data, "mmcif");
          await plugin.builders.structure.hierarchy.applyPreset(traj, "default");
        } catch {
          // Fallback to plain-text CIF from the main RCSB mirror.
          data = await plugin.builders.data.download(
            { url: `https://files.rcsb.org/download/${pdbId}.cif`, isBinary: false },
            { state: { isGhost: true } }
          );
          const traj = await plugin.builders.structure.parseTrajectory(data, "mmcif");
          await plugin.builders.structure.hierarchy.applyPreset(traj, "default");
        }
        setSpinInternal(true);
        setStat("ready", pdbId);
      } catch (e) {
        console.error("load failed", e);
        setErrMsg(e instanceof Error ? e.message : String(e));
        setStat("error", pdbId);
      }
    }

    function setSpinInternal(on: boolean) {
      const plugin = pluginRef.current;
      if (!plugin?.canvas3d) return;
      plugin.canvas3d.setProps({
        trackball: {
          animate: on
            ? { name: "spin", params: { speed: 0.18, axis: [0, 1, 0] } }
            : { name: "off", params: {} },
        },
      });
    }

    async function buildLoci(residues: number[], chain: string) {
      const plugin = pluginRef.current;
      const [{ Script }, { StructureSelection, StructureElement }] = await Promise.all([
        import("molstar/lib/mol-script/script"),
        import("molstar/lib/mol-model/structure"),
      ]);
      const struct = plugin.managers.structure.hierarchy.current.structures[0];
      if (!struct?.cell.obj) return null;
      const data = struct.cell.obj.data;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const withChain = (Q: any) =>
        Q.struct.generator.atomGroups({
          "chain-test": Q.core.rel.eq([Q.ammp("auth_asym_id"), chain]),
          "residue-test": Q.core.set.has([Q.set(...residues), Q.ammp("auth_seq_id")]),
        });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyChain = (Q: any) =>
        Q.struct.generator.atomGroups({
          "residue-test": Q.core.set.has([Q.set(...residues), Q.ammp("auth_seq_id")]),
        });

      let sel = Script.getStructureSelection(withChain, data);
      let loci = StructureSelection.toLociWithSourceUnits(sel);
      if (StructureElement.Loci.isEmpty(loci)) {
        sel = Script.getStructureSelection(anyChain, data);
        loci = StructureSelection.toLociWithSourceUnits(sel);
      }
      return StructureElement.Loci.isEmpty(loci) ? null : loci;
    }

    useImperativeHandle(ref, () => ({
      load: loadStructure,
      setSpin: setSpinInternal,
      resetView: () => {
        try {
          pluginRef.current?.managers.camera.reset();
        } catch {
          /* ignore */
        }
      },
      clearFocus: () => {
        const plugin = pluginRef.current;
        try {
          plugin?.managers.interactivity.lociSelects.deselectAll();
          plugin?.managers.structure.selection.clear();
        } catch {
          /* ignore */
        }
      },
      focusResidues: async (residues, chain) => {
        const plugin = pluginRef.current;
        if (!plugin) return;
        try {
          setSpinInternal(false);
          const loci = await buildLoci(residues, chain);
          if (!loci) return;
          plugin.managers.interactivity.lociSelects.deselectAll();
          plugin.managers.interactivity.lociSelects.selectOnly({ loci });
          plugin.managers.camera.focusLoci(loci);
        } catch (e) {
          console.error("focus failed", e);
        }
      },
      setRepresentation: async (theme) => {
        const plugin = pluginRef.current;
        if (!plugin) return;
        try {
          const structures = plugin.managers.structure.hierarchy.current.structures;
          for (const s of structures) {
            await plugin.managers.structure.component.updateRepresentationsTheme(
              s.components,
              { color: THEME_MAP[theme] }
            );
          }
        } catch (e) {
          console.error("representation failed", e);
        }
      },
    }));

    return (
      <div className="relative h-full w-full overflow-hidden bg-background">
        <div ref={hostRef} className="absolute inset-0" />
        {status === "idle" && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
              <Loader2 className="size-3.5 animate-spin" />
              Preparing the parent scaffold…
            </div>
          </div>
        )}
        {status === "loading" && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs text-foreground/80">
              <Loader2 className="size-3.5 animate-spin" />
              Fetching structure from RCSB…
            </div>
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div className="max-w-xs space-y-1">
              <p className="text-sm font-medium text-destructive">Viewer offline</p>
              <p className="text-xs text-muted-foreground">
                Mol* could not initialise or reach RCSB. The rest of the review
                surface still works. {errMsg && <span className="opacity-60">({errMsg})</span>}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
);
