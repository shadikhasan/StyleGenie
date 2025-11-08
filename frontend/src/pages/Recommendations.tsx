import { useEffect, useMemo, useRef, useState } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, CalendarDays, Sparkle, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import RecommendationCard from "@/components/RecommendationCard";
import GenerationProgress from "@/components/GenerationProgress";
import { LogoMark } from "@/components/LogoMark";

interface OutfitRecommendation {
  name: string;
  description: string;
  product_ids: number[];
}

interface RecommendationResponse {
  recommendations: OutfitRecommendation[];
}

interface WardrobeItemDetails {
  id: number;
  title: string;
  image_url?: string | null;
  category?: string | null;
  color?: string | null;
  description?: string | null;
}

const getDefaultDateTimeLocal = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

const SAVED_OUTFITS_KEY = "style-genie:saved-outfits";

interface SavedLookEntry {
  id: string;
  name: string;
  description: string;
  savedAt: string;
}

const Recommendations = () => {
  const { authorizedRequest, isAuthenticated } = useAuth();

  // UX: only the fields we actually use server-side
  const [occasion, setOccasion] = useState("casual");
  const [destination, setDestination] = useState("Dhaka");
  const [eventDateTime, setEventDateTime] = useState(getDefaultDateTimeLocal);

  // Results & loading state
  const [showResults, setShowResults] = useState(false);
  const [recommendations, setRecommendations] = useState<
    OutfitRecommendation[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // UI/UX additions
  const [showAll, setShowAll] = useState(false);
  const [savedLooks, setSavedLooks] = useState<Record<string, SavedLookEntry>>({});
  const [savedModalOpen, setSavedModalOpen] = useState(false);

  // Wardrobe item hydration
  const [wardrobeDetails, setWardrobeDetails] = useState<
    Record<number, WardrobeItemDetails>
  >({});
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Accurate multi-stage progress
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationDone, setGenerationDone] = useState(false);
  const [stageOneProgress, setStageOneProgress] = useState(0);
  const [stageTwoProgress, setStageTwoProgress] = useState(0);
  const errorRef = useRef<HTMLDivElement | null>(null);

  const canGenerate = useMemo(() => {
    if (!isAuthenticated) return false;
    const hasDestination = destination.trim().length > 0;
    const d = new Date(eventDateTime);
    const validDate = !Number.isNaN(d.getTime());
    return hasDestination && validDate && !isLoading;
  }, [destination, eventDateTime, isAuthenticated, isLoading]);

  const handleGenerate = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to request personalized recommendations.");
      return;
    }

    const dateValue = new Date(eventDateTime);
    if (!destination.trim()) {
      toast.error("Please enter a destination.");
      return;
    }
    if (Number.isNaN(dateValue.getTime())) {
      toast.error("Please provide a valid date and time.");
      return;
    }

    setShowResults(true);
    setIsLoading(true);
    setIsGenerating(true);
    setGenerationDone(false);
    setErrorMessage(null);
    setStageOneProgress(0);
    setStageTwoProgress(0);

    try {
      const response = await authorizedRequest<RecommendationResponse>(
        "/client/recommendations/",
        {
          method: "POST",
          data: {
            destination: destination.trim(),
            occasion,
            datetime: dateValue.toISOString(),
          },
        }
      );

      const fetched = response?.recommendations ?? [];
      setRecommendations(fetched);

      if (!fetched.length) {
        toast.info(
          "No recommendations available yet. Try a different occasion or date."
        );
      } else {
        toast.success("AI generated your outfits!");
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
          ? error.message
          : "Unable to generate recommendations right now.";

      setErrorMessage(message);
      setTimeout(() => errorRef.current?.focus(), 0);
      toast.error(message);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
      setGenerationDone(true);
    }
  };

  const eventDateLabel = useMemo(() => {
    const date = new Date(eventDateTime);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  }, [eventDateTime]);

  const summaryChips = useMemo(() => {
    return [
      {
        label: "Destination",
        value: destination || "Anywhere",
        icon: <MapPin aria-hidden className="h-3.5 w-3.5 text-primary" />,
      },
      {
        label: "Occasion",
        value: occasion,
        icon: <PartyPopper aria-hidden className="h-3.5 w-3.5 text-primary" />,
      },
      eventDateLabel
        ? {
            label: "Event",
            value: eventDateLabel,
            icon: (
              <CalendarDays aria-hidden className="h-3.5 w-3.5 text-primary" />
            ),
          }
        : null,
    ].filter(
      (chip): chip is { label: string; value: string; icon: JSX.Element } =>
        Boolean(chip)
    );
  }, [destination, occasion, eventDateLabel]);

  const visibleRecommendations = useMemo(
    () => (showAll ? recommendations : recommendations.slice(0, 6)),
    [recommendations, showAll]
  );

  const hasRecommendations = visibleRecommendations.length > 0;

  const productsSummary = useMemo(() => {
    if (!hasRecommendations) return 0;
    const uniqueProducts = new Set<number>();
    visibleRecommendations.forEach((rec) => {
      rec.product_ids.forEach((id) => uniqueProducts.add(id));
    });
    return uniqueProducts.size;
  }, [visibleRecommendations, hasRecommendations]);

  const productIds = useMemo(() => {
    const ids = new Set<number>();
    visibleRecommendations.forEach((rec) => {
      rec.product_ids.forEach((id) => {
        if (typeof id === "number") ids.add(id);
      });
    });
    return Array.from(ids);
  }, [visibleRecommendations]);

  const { loadedCount, progressValue } = useMemo(() => {
    if (!productIds.length) return { loadedCount: 0, progressValue: 0 };
    const loaded = productIds.reduce(
      (count, id) => (wardrobeDetails[id] ? count + 1 : count),
      0
    );
    const value = Math.round((loaded / productIds.length) * 100);
    return { loadedCount: loaded, progressValue: value };
  }, [productIds, wardrobeDetails]);

  // Composite accurate progress: 2 stages (50/50)
  const compositeProgress = useMemo(() => {
    if (!showResults) return 0;
    const stageOne = Math.min(stageOneProgress, 50);
    const stageTwo = Math.min(stageTwoProgress, 50);
    const total = stageOne + (generationDone ? stageTwo : 0);
    if (errorMessage) return 0;
    return Math.max(0, Math.min(100, total));
  }, [showResults, stageOneProgress, stageTwoProgress, generationDone, errorMessage]);

  const stepOnePercent = useMemo(
    () => Math.round((Math.min(stageOneProgress, 50) / 50) * 100),
    [stageOneProgress]
  );

  const stepTwoPercent = useMemo(
    () => Math.round((Math.min(stageTwoProgress, 50) / 50) * 100),
    [stageTwoProgress]
  );

  const progressComplete =
    generationDone && (productIds.length ? stageTwoProgress >= 50 : true);
  const canDisplayResults = showResults && progressComplete && !errorMessage;

  const savedCount = Object.keys(savedLooks).length;
  const savedList = Object.values(savedLooks).sort((a, b) =>
    new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );

  const handleToggleSave = (
    id: string,
    info?: { name: string; description?: string }
  ) => {
    setSavedLooks((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
        toast.info("Removed from saved looks");
      } else if (info) {
        next[id] = {
          id,
          name: info.name || "Saved look",
          description: info.description || "",
          savedAt: new Date().toISOString(),
        };
        toast.success("Saved for quick access");
      }
      return next;
    });
  };

  // Animate stage one progress so users see 0 -> 50%
  useEffect(() => {
    if (!showResults) {
      setStageOneProgress(0);
      return undefined;
    }

    if (isGenerating) {
      let timeoutId: number;
      const tick = () => {
        let reachedCap = false;
        setStageOneProgress((current) => {
          const capWhileGenerating = 45;
          if (current >= capWhileGenerating) {
            reachedCap = true;
            return current;
          }
          const increment = 2 + Math.random() * 4;
          const nextValue = Math.min(
            capWhileGenerating,
            Number((current + increment).toFixed(1))
          );
          if (nextValue >= capWhileGenerating) {
            reachedCap = true;
          }
          return nextValue;
        });
        if (!reachedCap) {
          const nextDelay = 260 + Math.random() * 320;
          timeoutId = window.setTimeout(tick, nextDelay);
        }
      };

      timeoutId = window.setTimeout(tick, 200);
      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    const settleIntervalId = window.setInterval(() => {
      setStageOneProgress((current) => {
        if (current >= 50) {
          window.clearInterval(settleIntervalId);
          return 50;
        }
        return Math.min(50, current + 5);
      });
    }, 120);

    return () => {
      window.clearInterval(settleIntervalId);
    };
  }, [isGenerating, showResults]);

  // Animate stage two (50 -> 100%) so hydration progress eases visibly
  useEffect(() => {
    if (!showResults || errorMessage) {
      setStageTwoProgress(0);
      return undefined;
    }

    if (!generationDone || stageOneProgress < 50) {
      setStageTwoProgress(0);
      return undefined;
    }

    const desired = productIds.length
      ? Math.round((progressValue / 100) * 50)
      : 50;

    if (desired <= stageTwoProgress) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setStageTwoProgress((current) => {
        if (desired <= current) return current;
        const remaining = desired - current;
        const step = Math.max(3, Math.min(8, Math.round(remaining / 2)));
        return Math.min(desired, current + step);
      });
    }, 220 + Math.random() * 220);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    showResults,
    generationDone,
    stageOneProgress,
    progressValue,
    productIds.length,
    stageTwoProgress,
    errorMessage,
  ]);

  // Hydrate wardrobe items for visible recs
  useEffect(() => {
    if (!productIds.length || !isAuthenticated) {
      setProductsLoading(false);
      return;
    }

    const missingIds = productIds.filter((id) => !wardrobeDetails[id]);
    if (!missingIds.length) {
      setProductsLoading(false);
      return;
    }

    let cancelled = false;
    setProductsLoading(true);
    setProductsError(null);

    const fetchWardrobeItems = async () => {
      const pending = await Promise.all(
        missingIds.map(async (productId) => {
          try {
            const item = await authorizedRequest<WardrobeItemDetails>(
              `/client/wardrobe/${productId}/`
            );
            const normalizedId =
              typeof item.id === "number" ? item.id : Number(item.id);
            return {
              id: Number.isFinite(normalizedId) ? normalizedId : productId,
              item,
            };
          } catch (error) {
            const message =
              error instanceof ApiError
                ? error.message
                : error instanceof Error
                ? error.message
                : "Unable to fetch wardrobe item.";
            setProductsError(message);
            return null;
          }
        })
      );

      if (cancelled) return;

      setWardrobeDetails((current) => {
        const next = { ...current };
        pending.forEach((entry) => {
          if (!entry) return;
          next[entry.id] = entry.item;
        });
        return next;
      });
      setProductsLoading(false);
    };

    fetchWardrobeItems();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productIds, authorizedRequest, isAuthenticated]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_OUTFITS_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const map: Record<string, SavedLookEntry> = {};
        parsed.forEach((entry) => {
          if (entry && typeof entry === "object" && "id" in entry) {
            const safe = entry as Partial<SavedLookEntry> & { id: string };
            map[safe.id] = {
              id: safe.id,
              name: safe.name || "Saved look",
              description: safe.description || "",
              savedAt: safe.savedAt || new Date().toISOString(),
            };
          } else if (typeof entry === "string") {
            map[entry] = {
              id: entry,
              name: entry.replace(/-\d+$/, "") || "Saved look",
              description: "",
              savedAt: new Date().toISOString(),
            };
          }
        });
        setSavedLooks(map);
      }
    } catch {
      // ignore hydration errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        SAVED_OUTFITS_KEY,
        JSON.stringify(Object.values(savedLooks))
      );
    } catch {
      // ignore persistence errors
    }
  }, [savedLooks]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
              <LogoMark className="h-4 w-4" aria-hidden />
              <span className="text-sm font-medium text-primary">
                AI-Powered Styling
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Discover Your Perfect{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                Outfits
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our AI analyzes your wardrobe and creates stunning outfit
              combinations tailored to you.
            </p>
          </div>

          {/* Controls */}
          <Card className="p-6 mb-8 bg-gradient-card border-none shadow-soft">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="occasion">Occasion</Label>
                <Select value={occasion} onValueChange={setOccasion}>
                  <SelectTrigger id="occasion" aria-label="Occasion">
                    <SelectValue placeholder="Select an occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="work">Work/Professional</SelectItem>
                    <SelectItem value="formal">Formal Event</SelectItem>
                    <SelectItem value="party">Party/Night Out</SelectItem>
                    <SelectItem value="date">Date Night</SelectItem>
                    <SelectItem value="sport">Athletic/Sporty</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Dhaka"
                  aria-invalid={!destination.trim()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventDateTime">Event Date & Time</Label>
                <Input
                  id="eventDateTime"
                  type="datetime-local"
                  value={eventDateTime}
                  onChange={(e) => setEventDateTime(e.target.value)}
                />
              </div>

              <div className="flex items-end gap-3 col-span-1 md:col-span-2 lg:col-span-2">
                <Button
                  onClick={handleGenerate}
                  className="w-full"
                  size="lg"
                  disabled={!canGenerate}
                  aria-disabled={!canGenerate}
                >
                  <LogoMark className="h-4 w-4 mr-2" aria-hidden />
                  {isLoading ? "Generating…" : "Generate Outfits"}
                </Button>
                {showResults && (
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      setRecommendations([]);
                      setWardrobeDetails({});
                      setErrorMessage(null);
                      setShowResults(false);
                    }}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Summary chips */}
          <Card className="mb-8 p-3 border border-border/60 bg-card/70 backdrop-blur">
            <div className="flex flex-wrap items-center gap-4">
              {summaryChips.map((chip) => (
                <div
                  key={chip.label}
                  className="flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-4 py-2 text-sm"
                >
                  {chip.icon}
                  <div className="flex flex-col leading-tight">
                    <span className="text-[11px] uppercase text-muted-foreground tracking-wide">
                      {chip.label}
                    </span>
                    <span className="font-semibold capitalize">
                      {chip.value}
                    </span>
                  </div>
                </div>
              ))}
              <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                {showResults
                  ? isLoading
                    ? "Generating…"
                    : `${recommendations.length} total recommendations`
                  : "Plan your next outfit"}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  disabled={savedCount === 0}
                  onClick={() => setSavedModalOpen(true)}
                >
                  {savedCount ? `Saved (${savedCount})` : "No saved looks"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Generation progress */}
          <GenerationProgress
            show={showResults && (isGenerating || generationDone) && !errorMessage}
            isGenerating={isGenerating}
            generationDone={generationDone}
            destinationLabel={destination}
            compositeProgress={compositeProgress}
            stepOnePercent={stepOnePercent}
            stepTwoPercent={stepTwoPercent}
            hasHydrationProducts={productIds.length > 0}
          />

          {/* Results */}
          {canDisplayResults && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Your AI‑Styled Outfits</h2>
                <span className="text-sm text-muted-foreground">
                  Showing {visibleRecommendations.length} of{" "}
                  {recommendations.length} recommendations
                  {productsSummary
                    ? ` • ${productsSummary} unique products`
                    : ""}
                </span>
              </div>

              {errorMessage && (
                <Card
                  ref={errorRef as any}
                  tabIndex={-1}
                  className="mb-6 border-destructive text-destructive bg-destructive/5 p-4 focus:outline-none focus:ring-2 focus:ring-destructive"
                  aria-live="assertive"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm">{errorMessage}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleGenerate}
                      disabled={isLoading}
                    >
                      Retry
                    </Button>
                  </div>
                </Card>
              )}

              {productsLoading && (
                <Card className="mb-6 border border-dashed bg-muted/30 p-4 animate-pulse">
                  <p className="text-sm text-muted-foreground">
                    Loading wardrobe pieces…
                  </p>
                </Card>
              )}

              {productsError && !errorMessage && (
                <Card className="mb-6 border-destructive text-destructive bg-destructive/5 p-4">
                  <p className="text-sm">{productsError}</p>
                </Card>
              )}

              {!hasRecommendations && !isLoading && !errorMessage && (
                <Card className="p-10 text-center border-dashed">
                  <p className="text-lg font-semibold mb-2">No outfits yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try another occasion, date, or destination.
                  </p>
                  <Button onClick={handleGenerate} disabled={!canGenerate}>
                    <LogoMark className="h-4 w-4 mr-2" /> Generate again
                  </Button>
                </Card>
              )}

              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-muted-foreground">
                  {showAll
                    ? `Showing all ${recommendations.length}`
                    : `Showing ${visibleRecommendations.length} of ${recommendations.length}`}{" "}
                  recommendations
                </div>
                {recommendations.length > 6 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAll((v) => !v)}
                  >
                    {showAll ? "Collapse" : "Show all"}
                  </Button>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-6" role="list">
                {visibleRecommendations.map((outfit, index) => {
                  const recommendedProducts = outfit.product_ids
                    .map((productId) => ({
                      productId,
                      product: wardrobeDetails[productId],
                    }))
                    .filter(
                      (
                        entry
                      ): entry is {
                        productId: number;
                        product: WardrobeItemDetails;
                      } => Boolean(entry.product)
                    );
                  const visibleProducts = recommendedProducts.slice(0, 5);
                  const hiddenCount = Math.max(
                    0,
                    recommendedProducts.length - visibleProducts.length
                  );
                  const heroProduct = recommendedProducts.find(
                    ({ product }) => product.image_url
                  )?.product;

                  const cardId = `${outfit.name}-${index}`;
                  const isSaved = Boolean(savedLooks[cardId]);
                  const descriptionText =
                    outfit.description?.trim() ||
                    "Your AI stylist is polishing the finishing notes for this look.";
                  const totalPieces =
                    recommendedProducts.length || outfit.product_ids.length;

                  const copyOutfit = async () => {
                    const lines = [
                      `Outfit: ${outfit.name}`,
                      outfit.description || "",
                      ...visibleProducts.map(
                        ({ productId, product }) =>
                          `#${productId}: ${
                            product.title ?? "Wardrobe item"
                          } (${[product.category, product.color]
                            .filter(Boolean)
                            .join(" • ")})`
                      ),
                      hiddenCount ? `+${hiddenCount} more…` : "",
                    ].filter(Boolean);
                    try {
                      await navigator.clipboard.writeText(lines.join("\n"));
                      toast.success("Outfit copied to clipboard");
                    } catch {
                      toast.error("Could not copy to clipboard");
                    }
                  };

                  return (
                    <RecommendationCard
                      key={cardId}
                      cardId={cardId}
                      index={index}
                      outfitName={outfit.name}
                      outfitDescription={descriptionText}
                      occasion={occasion}
                      destination={destination}
                      eventDateLabel={eventDateLabel}
                      totalPieces={totalPieces}
                      heroProduct={heroProduct}
                      allProducts={recommendedProducts}
                      visibleProducts={visibleProducts}
                      hiddenCount={hiddenCount}
                      isSaved={isSaved}
                      onToggleSave={() =>
                        handleToggleSave(cardId, {
                          name: outfit.name,
                          description: outfit.description,
                        })
                      }
                      onCopy={copyOutfit}
                    />
                  );
                })}
              </div>
              {/* CTA */}
              <Card className="mt-8 p-8 text-center bg-gradient-hero border-none shadow-medium">
                <h3 className="text-2xl font-bold text-primary-foreground mb-2">
                  Want more personalized advice?
                </h3>
                <p className="text-primary-foreground/90 mb-4">
                  Book a session with our expert stylists for tailored
                  recommendations.
                </p>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() =>
                    toast.info("Stylist booking is coming soon. Stay tuned!")
                  }
                >
                  Find a Stylist
                </Button>
              </Card>
            </div>
          )}
        </div>
      </div>
      <Dialog open={savedModalOpen} onOpenChange={setSavedModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Saved looks</DialogTitle>
            <DialogDescription>
              These outfits are stored locally in your browser for quick access.
            </DialogDescription>
          </DialogHeader>
          {savedCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven&apos;t saved any looks yet. Tap the heart icon on a recommendation to pin it here.
            </p>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {savedList.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-border/60 bg-background/80 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{entry.name}</p>
                      {entry.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {entry.description}
                        </p>
                      )}
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mt-2">
                        Saved {new Date(entry.savedAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleSave(entry.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setSavedModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recommendations;
