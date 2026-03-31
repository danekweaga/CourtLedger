import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import { resizeImageFile, runBetSlipOcr } from "../../lib/betSlipOcr";
import type { BetDraft } from "../../types/bets";
import { parseBetSlipText } from "../../utils/parseBetSlipText";
import { computePotentialPayout } from "../../utils/profit";

interface BetSlipScannerProps {
  draft: BetDraft;
  onApplyPatch: (next: BetDraft) => void;
  disabled?: boolean;
}

type Phase = "idle" | "processing" | "preview";

function summarizePatch(patch: Partial<BetDraft>): string[] {
  const lines: string[] = [];
  if (patch.sportsbook) {
    lines.push(`Sportsbook: ${patch.sportsbook}`);
  }
  if (patch.matchup) {
    lines.push(`Matchup / selection: ${patch.matchup}`);
  }
  if (patch.player_name) {
    lines.push(`Player: ${patch.player_name}`);
  }
  if (patch.stake !== undefined) {
    lines.push(`Stake: $${patch.stake}`);
  }
  if (patch.odds !== undefined) {
    lines.push(`Odds: ${patch.odds > 0 ? "+" : ""}${patch.odds}`);
  }
  if (patch.line !== undefined && patch.line !== null) {
    lines.push(`Line: ${patch.line}`);
  }
  if (patch.over_under) {
    lines.push(`Side: ${patch.over_under}`);
  }
  if (patch.market_type) {
    lines.push(`Market type: ${patch.market_type}`);
  }
  if (patch.bet_category) {
    lines.push(`Category: ${patch.bet_category}`);
  }
  return lines;
}

export function BetSlipScanner({ draft, onApplyPatch, disabled }: BetSlipScannerProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");
  const [patch, setPatch] = useState<Partial<BetDraft>>({});
  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setPhase("idle");
    setProgress(0);
    setError(null);
    setRawText("");
    setPatch({});
  }, []);

  const processFile = useCallback(async (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setError(null);
    setPhase("processing");
    setProgress(0);
    try {
      const resized = await resizeImageFile(file);
      const text = await runBetSlipOcr(resized, {
        onProgress: (p) => setProgress(Math.round(p * 100)),
      });
      setRawText(text);
      setPatch(parseBetSlipText(text));
      setPhase("preview");
      toast.success("Text extracted — review fields, then apply.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not read this image.";
      setError(message);
      setPhase("idle");
      toast.error(message);
    }
  }, []);

  const handleApply = useCallback(() => {
    const merged: BetDraft = { ...draft, ...patch };
    if (patch.stake !== undefined || patch.odds !== undefined) {
      merged.potential_payout = computePotentialPayout(Number(merged.stake), Number(merged.odds));
    }
    onApplyPatch(merged);
    toast.success("Slip details applied to the form.");
    reset();
  }, [draft, onApplyPatch, patch, reset]);

  const busy = phase === "processing" || disabled;

  return (
    <div className="mb-6 rounded-xl border border-primary/20 bg-surface-container-low/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Scan bet slip</p>
          <p className="mt-0.5 text-[11px] text-on-surface-variant/80">
            OCR runs in your browser; nothing is uploaded to a server.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={uploadRef}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              void processFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              void processFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={busy}
            className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50"
            onClick={() => uploadRef.current?.click()}
          >
            Upload image
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50"
            onClick={() => cameraRef.current?.click()}
          >
            Use camera
          </button>
        </div>
      </div>

      {phase === "processing" && (
        <div className="mt-4 space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${Math.max(progress, 8)}%` }} />
          </div>
          <p className="text-center text-xs text-on-surface-variant">Reading slip… {progress}%</p>
        </div>
      )}

      {error && phase === "idle" && <p className="mt-3 text-xs text-rose-300">{error}</p>}

      {phase === "preview" && (
        <div className="mt-4 space-y-3 rounded-lg border border-slate-700/50 bg-surface-container-lowest/50 p-3">
          <p className="text-xs font-semibold text-slate-200">Detected values</p>
          {summarizePatch(patch).length > 0 ? (
            <ul className="list-inside list-disc text-xs text-on-surface-variant">
              {summarizePatch(patch).map((line, i) => (
                <li key={`${i}-${line}`}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-amber-200/90">No structured fields were inferred. Check raw text below and fill manually.</p>
          )}
          <details className="text-xs">
            <summary className="cursor-pointer font-medium text-slate-400">Raw OCR text</summary>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-slate-950/80 p-2 text-[10px] text-slate-300">{rawText}</pre>
          </details>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              className="primary-gradient rounded-lg px-4 py-2 text-xs font-bold text-[#003915]"
              onClick={handleApply}
            >
              Apply to form
            </button>
            <button type="button" className="rounded-lg border border-slate-600 px-4 py-2 text-xs text-slate-300" onClick={reset}>
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
