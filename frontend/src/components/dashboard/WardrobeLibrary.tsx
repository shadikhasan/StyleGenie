import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { LogoMark } from "@/components/LogoMark";
import { Plus, Pencil, Trash2, Shirt, LayoutGrid, List } from "lucide-react";
import type { NewWardrobeItem, WardrobeItem } from "@/types/dashboard";
import { cn } from "@/lib/utils";

const WARDROBE_CATEGORY_OPTIONS = [
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "outerwear", label: "Outerwear" },
  { value: "footwear", label: "Footwear" },
  { value: "accessory", label: "Accessory" },
  { value: "dress", label: "Dress" },
  { value: "suit", label: "Suit" },
  { value: "other", label: "Other" },
];

const WARDROBE_COLOR_OPTIONS = [
  { value: "black", label: "Black" },
  { value: "white", label: "White" },
  { value: "gray", label: "Gray" },
  { value: "blue", label: "Blue" },
  { value: "red", label: "Red" },
  { value: "green", label: "Green" },
  { value: "yellow", label: "Yellow" },
  { value: "beige", label: "Beige" },
  { value: "brown", label: "Brown" },
  { value: "pink", label: "Pink" },
  { value: "purple", label: "Purple" },
  { value: "other", label: "Other" },
];

const categoryLabelMap = Object.fromEntries(
  WARDROBE_CATEGORY_OPTIONS.map((o) => [o.value, o.label])
);
const colorLabelMap = Object.fromEntries(
  WARDROBE_COLOR_OPTIONS.map((o) => [o.value, o.label])
);

interface WardrobeLibraryProps {
  wardrobeItems: WardrobeItem[];
  isLoading: boolean;
  isEmpty: boolean;
  isDialogOpen: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  isEditing: boolean;
  newItem: NewWardrobeItem;
  imageUploading: boolean;
  imageUploadError: string | null;
  onDialogChange: (open: boolean) => void;
  onCreateClick: () => void;
  onEditItem: (item: WardrobeItem) => void;
  onDeleteItem: (item: WardrobeItem) => void;
  onSubmit: () => void;
  onNewItemChange: (field: keyof NewWardrobeItem, value: string) => void;
  onImageFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  formatLabel: (value?: string | null) => string;
  formatDate: (value?: string | null) => string;
}

const VIEW_OPTIONS = [
  { value: "grid", label: "Grid" },
  { value: "list", label: "List" },
] as const;

const PER_PAGE_OPTIONS = [6, 9, 12, 18];

const WardrobeLibrary = ({
  wardrobeItems,
  isLoading,
  isEmpty,
  isDialogOpen,
  isSaving,
  isDeleting,
  isEditing,
  newItem,
  imageUploading,
  imageUploadError,
  onDialogChange,
  onCreateClick,
  onEditItem,
  onDeleteItem,
  onSubmit,
  onNewItemChange,
  onImageFileChange,
  formatLabel,
  formatDate,
}: WardrobeLibraryProps) => {
  const [viewMode, setViewMode] = useState<(typeof VIEW_OPTIONS)[number]["value"]>("grid");
  const [itemsPerPage, setItemsPerPage] = useState<number>(PER_PAGE_OPTIONS[0]);
  const [page, setPage] = useState(1);

  const totalPages = useMemo(() => {
    if (!wardrobeItems.length || itemsPerPage === 0) return 1;
    return Math.max(1, Math.ceil(wardrobeItems.length / itemsPerPage));
  }, [wardrobeItems.length, itemsPerPage]);

  const paginatedItems = useMemo(() => {
    if (!wardrobeItems.length) return [];
    const start = (page - 1) * itemsPerPage;
    return wardrobeItems.slice(start, start + itemsPerPage);
  }, [wardrobeItems, page, itemsPerPage]);

  const startItem = wardrobeItems.length ? (page - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(page * itemsPerPage, wardrobeItems.length);

  const handlePerPageChange = (value: string) => {
    const parsed = Number(value);
    setItemsPerPage(parsed);
    setPage(1);
  };

  const handlePrev = () => setPage((prev) => Math.max(1, prev - 1));
  const handleNext = () => setPage((prev) => Math.min(totalPages, prev + 1));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
  <Card className="p-6 bg-gradient-card border-none shadow-soft">
    <Dialog open={isDialogOpen} onOpenChange={onDialogChange}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Wardrobe Library</h2>
          <p className="text-sm text-muted-foreground">
            Capture the pieces you love most so StyleGenie can assemble outfits that feel like you.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 lg:w-auto">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 p-2">
              {VIEW_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={viewMode === option.value ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2 px-3"
                  onClick={() => setViewMode(option.value)}
                  aria-pressed={viewMode === option.value}
                >
                  {option.value === "grid" ? (
                    <LayoutGrid className="h-4 w-4" />
                  ) : (
                    <List className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{option.label}</span>
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Per page
              </Label>
              <Select value={String(itemsPerPage)} onValueChange={handlePerPageChange}>
                <SelectTrigger className="h-9 w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PER_PAGE_OPTIONS.map((count) => (
                    <SelectItem key={count} value={String(count)}>
                      {count}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <DialogTrigger asChild>
              <Button type="button" onClick={onCreateClick} className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {isLoading ? (
        <p className="text-muted-foreground">Loading wardrobe...</p>
      ) : isEmpty ? (
        <div className="text-center py-12 border border-dashed rounded-lg bg-background/60">
          <LogoMark className="mx-auto mb-3 h-6 w-6" />
          <p className="font-semibold">Your wardrobe is waiting.</p>
          <p className="text-sm text-muted-foreground">
            Start by adding a favorite piece, and we&apos;ll begin crafting fresh outfits.
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "gap-4",
            viewMode === "grid"
              ? "grid sm:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col"
          )}
        >
          {paginatedItems.map((item) => (
            <Card
              key={item.id}
              className={cn(
                "group flex h-full flex-col gap-3 overflow-hidden border border-border/60 bg-background/80 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg",
                viewMode === "list" && "md:flex-row md:items-center"
              )}
            >
              <div
                className={cn(
                  "relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-muted to-background/60",
                  viewMode === "list"
                    ? "w-full md:max-w-[160px]"
                    : ""
                )}
              >
                <div className={cn("w-full", viewMode === "list" ? "aspect-square" : "aspect-[4/5]")}>
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Shirt className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <span className="absolute left-3 top-3 rounded-full border border-white/50 bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-foreground shadow-sm">
                  {categoryLabelMap[item.category] ?? formatLabel(item.category)}
                </span>
              </div>

              <div className={cn("flex flex-col gap-2", viewMode === "list" && "md:flex-1")}>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-base font-semibold text-foreground line-clamp-1">
                    {item.title}
                  </h4>
                  <time className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    ADDED {formatDate(item.created_at)}
                  </time>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.color && (
                    <Badge variant="secondary" className="text-xs capitalize">
                      {colorLabelMap[item.color] ?? formatLabel(item.color)}
                    </Badge>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>

              <div
                className={cn(
                  "mt-auto flex flex-col gap-2 pt-2 sm:flex-row",
                  viewMode === "list" && "md:w-48"
                )}
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onEditItem(item)}
                  disabled={isSaving || isDeleting}
                  aria-label={`Edit ${item.title}`}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => onDeleteItem(item)}
                  disabled={isDeleting}
                  aria-label={`Delete ${item.title}`}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && !isEmpty && (
        <div className="mt-6 flex flex-col gap-3 border-t border-border/60 pt-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{startItem}</span>-
            <span className="font-semibold text-foreground">{endItem}</span> of{" "}
            <span className="font-semibold text-foreground">{wardrobeItems.length}</span>{" "}
            items
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={page === 1}
            >
              Prev
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Wardrobe Item" : "Add to Wardrobe"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Refine the details so StyleGenie keeps your closet perfectly cataloged."
              : "Upload staple pieces, then let StyleGenie remix them into fresh outfits."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="wardrobe-title">Item Title</Label>
            <Input
              id="wardrobe-title"
              placeholder="e.g., Blue Denim Jacket"
              value={newItem.title}
              onChange={(event) => onNewItemChange("title", event.target.value)}
            />
          </div>
          <div className="grid gap-2 md:grid-cols-2 md:gap-4">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select
                value={newItem.category}
                onValueChange={(value) => onNewItemChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {WARDROBE_CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <Select value={newItem.color} onValueChange={(value) => onNewItemChange("color", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {WARDROBE_COLOR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Image</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={onImageFileChange}
              disabled={imageUploading || isSaving}
            />
            {imageUploading && (
              <p className="text-xs text-muted-foreground">Uploading image to Cloudinary…</p>
            )}
            {imageUploadError && (
              <p className="text-xs text-destructive">{imageUploadError}</p>
            )}
            {newItem.image_url && (
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-muted-foreground/40 p-3">
                <div className="h-14 w-14 overflow-hidden rounded-md bg-muted">
                  <img
                    src={newItem.image_url}
                    alt={newItem.title || "Wardrobe item preview"}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-xs text-muted-foreground">Cloudinary URL</p>
                  <Input
                    id="wardrobe-image"
                    placeholder="https://cdn.app/items/jacket.png"
                    value={newItem.image_url}
                    onChange={(event) => onNewItemChange("image_url", event.target.value)}
                    disabled={imageUploading}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="wardrobe-description">Inspiration / Notes</Label>
            <Textarea
              id="wardrobe-description"
              placeholder="Tell the AI what makes this piece special."
              value={newItem.description}
              onChange={(event) => onNewItemChange("description", event.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" type="button" onClick={() => onDialogChange(false)} className="sm:w-auto">
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={isSaving} className="sm:w-auto">
            {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Save Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Card>
);
};

export default WardrobeLibrary;
