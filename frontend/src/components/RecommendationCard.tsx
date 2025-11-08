import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays,
  Heart,
  MapPin,
  Share2,
  Eye,
  KeyRound,
  Shirt,
  ShoppingBag,
  Sparkle,
  PartyPopper,
} from "lucide-react";
import { LogoMark } from "@/components/LogoMark";

export interface RecommendationProductDetails {
  id: number;
  title?: string | null;
  image_url?: string | null;
  category?: string | null;
  color?: string | null;
  description?: string | null;
}

export interface RecommendationProduct {
  productId: number;
  product: RecommendationProductDetails;
}

interface RecommendationCardProps {
  cardId: string;
  outfitName: string;
  outfitDescription: string;
  index: number;
  occasion: string;
  destination: string;
  eventDateLabel: string | null;
  totalPieces: number;
  heroProduct?: RecommendationProductDetails;
  visibleProducts: RecommendationProduct[];
  allProducts: RecommendationProduct[]; // NEW: Full list
  hiddenCount: number;
  isSaved: boolean;
  onToggleSave: () => void;
  onCopy: () => void | Promise<void>;
}

const RecommendationCard = ({
  cardId,
  outfitName,
  outfitDescription,
  index,
  occasion,
  destination,
  eventDateLabel,
  totalPieces,
  heroProduct,
  visibleProducts,
  allProducts, // NEW
  hiddenCount,
  isSaved,
  onToggleSave,
  onCopy,
}: RecommendationCardProps) => {
  return (
    <Card
      role="listitem"
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/40 bg-card/95 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
    >
      {/* HERO IMAGE */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-primary/5 to-background">
        {heroProduct?.image_url ? (
          <img
            src={heroProduct.image_url}
            alt={heroProduct.title || "Outfit hero"}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-muted/40" />
        )}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="text-xs font-medium shadow-sm">
            AI Pick #{index + 1}
          </Badge>
        </div>
      </div>

      {/* CONTENT */}
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <h3 className="text-xl font-semibold leading-tight">{outfitName}</h3>

        {/* Key Pieces */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground uppercase tracking-wide">
              <ShoppingBag  className="h-3.5 w-3.5 text-primary" aria-hidden />
              Key Pieces
            </span>
            <span className="px-2 py-0.5 rounded-full bg-muted text-foreground/80">
              {visibleProducts.length}
            </span>
          </div>
        </div>
      </CardContent>

      {/* FOOTER WITH MODAL */}
      <CardFooter className="border-t border-border/20 p-4">
        <div className="flex w-full gap-2">
          <Button
            variant={isSaved ? "default" : "outline"}
            size="sm"
            onClick={onToggleSave}
            className="flex-1"
          >
            <Heart
              className="mr-1.5 h-4 w-4"
              fill={isSaved ? "currentColor" : "none"}
            />
            {isSaved ? "Saved" : "Save"}
          </Button>

          {/* MODAL TRIGGER */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Eye className="mr-1.5 h-4 w-4" />
                Details
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
              <DialogHeader className="p-6 pb-4">
                <DialogTitle className="text-2xl font-bold">
                  {outfitName}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {outfitDescription}
                </p>
              </DialogHeader>

              <ScrollArea className="max-h-[60vh] px-6">
                {/* Meta */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { icon: PartyPopper, label: "Occasion", value: occasion },
                    {
                      icon: CalendarDays,
                      label: "When",
                      value: eventDateLabel || "Anytime",
                    },
                    {
                      icon: MapPin,
                      label: "Where",
                      value: destination || "Anywhere",
                    },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="text-center">
                      <Icon className="h-5 w-5 mx-auto text-primary mb-1" />
                      <p className="text-xs uppercase text-muted-foreground">
                        {label}
                      </p>
                      <p className="font-medium">{value}</p>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Full Product List */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">
                    All Pieces ({allProducts.length})
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {allProducts.map(({ productId, product }) => {
                      const title = product.title ?? `Item #${productId}`;
                      const meta = [product.category, product.color]
                        .filter(Boolean)
                        .join(" • ");

                      return (
                        <div
                          key={`${cardId}-full-${productId}`}
                          className="flex gap-3 rounded-lg border border-border/40 bg-background/50 p-3"
                        >
                          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={title}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                No Image
                              </div>
                            )}
                            <Badge className="absolute left-1 top-1 text-[9px]">
                              #{productId}
                            </Badge>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{title}</p>
                            {meta && (
                              <p className="text-xs text-muted-foreground">
                                {meta}
                              </p>
                            )}
                            {product.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter className="p-4 border-t">
                <Button onClick={onCopy} className="w-full">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share This Look
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
};

export default RecommendationCard;
