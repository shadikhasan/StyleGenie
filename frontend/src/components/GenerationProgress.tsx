import * as React from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PackageSearch, Shirt, Wand2 } from "lucide-react";

interface GenerationProgressProps {
  show: boolean;
  isGenerating: boolean;
  generationDone: boolean;
  destinationLabel: string;
  compositeProgress: number;
  stepOnePercent: number;
  stepTwoPercent: number;
  hasHydrationProducts: boolean;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const GenerationProgress = ({
  show,
  isGenerating,
  generationDone,
  destinationLabel,
  compositeProgress,
  stepOnePercent,
  stepTwoPercent,
  hasHydrationProducts,
}: GenerationProgressProps) => {
  const [countdown, setCountdown] = React.useState(22);

  React.useEffect(() => {
    if (show && isGenerating) {
      setCountdown(22);
    }
    if (!show) {
      setCountdown(22);
    }
  }, [show, isGenerating]);

  React.useEffect(() => {
    if (!show || generationDone) {
      if (generationDone) setCountdown(0);
      return;
    }

    const interval = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [show, generationDone]);

  if (!show) return null;

  const s1 = clamp(stepOnePercent);
  const s2 = clamp(stepTwoPercent);
  const c = clamp(compositeProgress);

  const stepOneCaption = `Scanning wardrobe + ${destinationLabel || "event"} details.`;
  const stepTwoCaption = hasHydrationProducts
    ? "Pairing pieces and doing a final check."
    : "All items synced. Finalizing outfits.";

  const stageLabel = isGenerating
    ? "Collecting wardrobe data"
    : hasHydrationProducts
    ? "Syncing wardrobe pieces"
    : "Polishing outfits";

  let timelineLabel = "Styled looks ready";
  if (c < 100) {
    timelineLabel =
      countdown > 0
        ? `${stageLabel} · ~${countdown}s remaining`
        : `${stageLabel} · wrapping up`;
  }

  return (
    <Card className="mb-6 rounded-2xl border p-5" aria-live="polite">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Style engine
          </p>
          <h3 className="text-lg font-semibold">
            {isGenerating
              ? "Gathering wardrobe details"
              : hasHydrationProducts
              ? "Matching pieces and polishing"
              : "Looks locked in"}
          </h3>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-2xl font-bold tabular-nums">{c}%</div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">overall</p>
        </div>
      </div>

      {/* Steps */}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {/* Step 1 */}
        <div className="rounded-xl border p-3">
          <div className="flex items-center justify-between text-sm font-medium">
            <div className="flex items-center gap-2">
                <PackageSearch className="h-4 w-4 text-primary" aria-hidden />
              <span>Step 1 · Wardrobe scan</span>
            </div>
            <span className="text-xs text-muted-foreground">{s1 >= 100 ? "Done" : `${s1}%`}</span>
          </div>
          <Progress value={s1} className="mt-2 h-2" />
          <p className="mt-2 text-xs text-muted-foreground">{stepOneCaption}</p>
        </div>

        {/* Step 2 */}
        <div className="rounded-xl border p-3">
          <div className="flex items-center justify-between text-sm font-medium">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" aria-hidden />
                <span>Step 2 · Outfit analysis</span>
              </div>
            <span className="text-xs text-muted-foreground">
              {s2 >= 100 || !hasHydrationProducts ? "Done" : `${s2}%`}
            </span>
          </div>
          <Progress value={s2} className="mt-2 h-2" />
          <p className="mt-2 text-xs text-muted-foreground">{stepTwoCaption}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-muted-foreground">Timeline</span>
          <span className="text-xs text-muted-foreground">{timelineLabel}</span>
        </div>
        <Progress value={c} className="h-3" />
        <div className="flex justify-between text-[11px] tabular-nums text-muted-foreground">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </Card>
  );
};

export default GenerationProgress;
