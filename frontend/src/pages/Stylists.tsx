import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Star, MapPin, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

interface StylistUser {
  id: string;
  email: string;
  username: string;
  phone?: string | null;
  profile_picture?: string | null;
}

interface StylistRecord {
  id: string;
  user: StylistUser;
  bio?: string | null;
  expertise?: string[] | null;
  years_experience?: number | null;
  rating?: number | null;
  rating_count?: number | null;
  hourly_rate?: number | string | null;
  location?: string | null;
  city?: string | null;
  country?: string | null;
}

type StylistListResponse = StylistRecord[] | { results: StylistRecord[] };

interface BookingFormState {
  date: string;
  timeSlot: string;
  duration: number;
  paymentMethod: string;
  notes: string;
}

type BookingStatus = "idle" | "processing" | "success" | "error";
type BookingStepState = "done" | "pending" | "current" | "error";

interface BookingOutcome {
  status: BookingStatus;
  message: string;
  reference?: string;
  stylist: string;
  date: string;
  time: string;
  duration: number;
  total: number | null;
}

const formatLocation = (stylist: StylistRecord) => {
  if (stylist.location) {
    return stylist.location;
  }
  const city = stylist.city?.trim();
  const country = stylist.country?.trim();
  if (city && country) {
    return `${city}, ${country}`;
  }
  if (city) {
    return city;
  }
  if (country) {
    return country;
  }
  return "Available remotely";
};

const parseHourlyRate = (rate: StylistRecord["hourly_rate"]) => {
  if (rate === null || rate === undefined) {
    return null;
  }
  if (typeof rate === "number") {
    return rate;
  }
  const parsed = Number(rate);
  return Number.isFinite(parsed) ? parsed : null;
};

const Stylists = () => {
  const { role, authorizedRequest } = useAuth();
  const isClient = role === "client";

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedStylist, setSelectedStylist] = useState<StylistRecord | null>(null);
  const [bookingForm, setBookingForm] = useState<BookingFormState>({
    date: "",
    timeSlot: "09:00 AM",
    duration: 1,
    paymentMethod: "card",
    notes: "",
  });
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>("idle");
  const [paymentSummary, setPaymentSummary] = useState<{
    status: BookingStatus;
    message: string;
    reference?: string;
  } | null>(null);
  const [lastBookingOutcome, setLastBookingOutcome] = useState<BookingOutcome | null>(null);
  const paymentTimeoutRef = useRef<number | null>(null);
  const [currentStep, setCurrentStep] = useState<"details" | "payment">("details");

  const stylistsQuery = useQuery<StylistListResponse>({
    queryKey: ["stylists", role],
    enabled: isClient,
    queryFn: () => authorizedRequest<StylistListResponse>("/client/stylists/"),
  });

  useEffect(() => {
    if (!stylistsQuery.error) {
      return;
    }

    const error = stylistsQuery.error;
    if (error instanceof ApiError) {
      toast.error(error.message);
    } else {
      toast.error("Unable to load stylists right now.");
    }
  }, [stylistsQuery.error]);

  useEffect(() => {
    return () => {
      if (paymentTimeoutRef.current) {
        window.clearTimeout(paymentTimeoutRef.current);
      }
    };
  }, []);

  const stylists = useMemo<StylistRecord[]>(() => {
    const data = stylistsQuery.data;
    if (!data) {
      return [];
    }

    if (Array.isArray(data)) {
      return data;
    }

    if ("results" in data && Array.isArray(data.results)) {
      return data.results;
    }

    return [];
  }, [stylistsQuery.data]);

  const totalStylists = stylists.length;
  const totalReviews = stylists.reduce((sum, stylist) => sum + (stylist.rating_count ?? 0), 0);
  const averageRating =
    stylists.length > 0
      ? stylists.reduce((sum, stylist) => sum + (stylist.rating ?? 0), 0) / stylists.length
      : null;

  const handleBookingOpen = (stylist: StylistRecord) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().split("T")[0];

    setSelectedStylist(stylist);
    setBookingForm({
      date: defaultDate,
      timeSlot: "09:00 AM",
      duration: 1,
      paymentMethod: "card",
      notes: "",
    });
    setBookingStatus("idle");
    setPaymentSummary(null);
    setIsBookingOpen(true);
    setCurrentStep("details");
  };

  const handleBookingClose = () => {
    setIsBookingOpen(false);
    setSelectedStylist(null);
    setBookingStatus("idle");
    setPaymentSummary(null);
    setBookingForm({
      date: "",
      timeSlot: "09:00 AM",
      duration: 1,
      paymentMethod: "card",
      notes: "",
    });
    setCurrentStep("details");
    if (paymentTimeoutRef.current) {
      window.clearTimeout(paymentTimeoutRef.current);
      paymentTimeoutRef.current = null;
    }
  };

  const canProceedToPayment = Boolean(
    bookingForm.date &&
      bookingForm.timeSlot &&
      bookingForm.duration > 0 &&
      selectedStylist
  );

  const handleProceedToPayment = () => {
    if (!canProceedToPayment) {
      toast.error("Please select date, time, and duration before continuing.");
      return;
    }
    setCurrentStep("payment");
    setBookingStatus("idle");
    setPaymentSummary(null);
  };

  const handlePaymentSubmit = () => {
    if (!selectedStylist) return;
    if (!bookingForm.date || !bookingForm.timeSlot) {
      toast.error("Please select a date and time");
      return;
    }

    const rate = parseHourlyRate(selectedStylist.hourly_rate);
    const total = rate ? rate * bookingForm.duration : null;
    const reference = `SG-${Math.floor(100000 + Math.random() * 900000)}`;
    setBookingStatus("processing");
    setPaymentSummary({
      status: "processing",
      message: "Processing payment...",
      reference,
    });

    if (paymentTimeoutRef.current) {
      window.clearTimeout(paymentTimeoutRef.current);
      paymentTimeoutRef.current = null;
    }

    paymentTimeoutRef.current = window.setTimeout(() => {
      const success = Math.random() > 0.25;
      const amountLabel = total ? `$${total.toFixed(2)}` : "custom rate";
      const summaryMessage = success
        ? `Payment ${amountLabel} confirmed`
        : "Payment failed. Please try another method.";

      setBookingStatus(success ? "success" : "error");
      setPaymentSummary({
        status: success ? "success" : "error",
        message: summaryMessage,
        reference: success ? reference : undefined,
      });
      setLastBookingOutcome({
        status: success ? "success" : "error",
        message: summaryMessage,
        reference: success ? reference : undefined,
        stylist: selectedStylist.user.username,
        date: bookingForm.date,
        time: bookingForm.timeSlot,
        duration: bookingForm.duration,
        total,
      });

      if (success) {
        toast.success(
          `Payment successful • ${selectedStylist.user.username} on ${bookingForm.date} at ${bookingForm.timeSlot}`
        );
      } else {
        toast.error("We couldn't process your payment. Please retry.");
      }

    }, 1500);
  };

  const estimatedTotal = (() => {
    if (!selectedStylist) {
      return null;
    }
    const rate = parseHourlyRate(selectedStylist.hourly_rate);
    if (!rate) {
      return null;
    }
    return rate * bookingForm.duration;
  })();

  const paymentMethodLabels: Record<string, string> = {
    card: "Card (Visa, Mastercard)",
    wallet: "StyleGenie Wallet",
    cash: "Cash after session",
  };

  const sessionSummaryCard = (
    <Card className="p-4 bg-muted/40">
      <p className="text-sm font-semibold mb-1">Session Summary</p>
      <ul className="space-y-1 text-sm text-muted-foreground">
        <li>Date: {bookingForm.date || "Select a date"}</li>
        <li>Time: {bookingForm.timeSlot}</li>
        <li>
          Duration: {bookingForm.duration} hour{bookingForm.duration > 1 ? "s" : ""}
        </li>
        <li>
          Estimated total:{" "}
          {estimatedTotal ? `$${estimatedTotal.toFixed(2)}` : "Contact stylist"}
        </li>
        <li>
          Payment: {paymentMethodLabels[bookingForm.paymentMethod] ?? "Select a method"}
        </li>
      </ul>
    </Card>
  );

  const availableTimeSlots = ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM", "06:00 PM"];
  const durationOptions = [1, 2, 3];

  const bookingSteps: { label: string; status: BookingStepState }[] = [
    {
      label: "Select stylist",
      status: selectedStylist ? "done" : "pending",
    },
    {
      label: "Choose date & time",
      status:
        bookingForm.date && bookingForm.timeSlot && bookingForm.duration > 0
          ? "done"
          : "pending",
    },
    {
      label: "Complete payment",
      status:
        bookingStatus === "success"
          ? "done"
          : bookingStatus === "processing"
          ? "current"
          : bookingStatus === "error"
          ? "error"
          : "pending",
    },
  ];

  const getStepBadge = (status: BookingStepState) => {
    if (status === "done") {
      return { variant: "secondary" as const, label: "Done" };
    }
    if (status === "current") {
      return { variant: "default" as const, label: "In progress" };
    }
    if (status === "error") {
      return { variant: "destructive" as const, label: "Action needed" };
    }
    return { variant: "outline" as const, label: "Pending" };
  };

  const paymentBadgeVariant =
    bookingStatus === "success"
      ? "secondary"
      : bookingStatus === "processing"
      ? "default"
      : bookingStatus === "error"
      ? "destructive"
      : "outline";
  const paymentBadgeLabel =
    bookingStatus === "success"
      ? "Confirmed"
      : bookingStatus === "processing"
      ? "Processing"
      : bookingStatus === "error"
      ? "Failed"
      : "Pending";

  const confirmDisabled =
    bookingStatus === "processing" || bookingStatus === "success";
  const confirmLabel =
    bookingStatus === "processing"
      ? "Processing…"
      : bookingStatus === "success"
      ? "Payment recorded"
      : "Confirm Booking";

  const updateBookingForm = <Field extends keyof BookingFormState>(
    field: Field,
    value: BookingFormState[Field]
  ) => {
    setBookingForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Meet Our Expert{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                Stylists
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Book one-on-one sessions with verified fashion professionals who understand
              your unique style needs
            </p>
          </div>

          {isClient ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                {lastBookingOutcome && (
                  <Card className="p-6 bg-gradient-card border-none shadow-soft">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Last Booking
                        </p>
                        <p className="text-lg font-semibold">
                          {lastBookingOutcome.stylist}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lastBookingOutcome.date} • {lastBookingOutcome.time}
                        </p>
                      </div>
                      <Badge
                        variant={
                          lastBookingOutcome.status === "success"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {lastBookingOutcome.status === "success"
                          ? "Confirmed"
                          : "Failed"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      {lastBookingOutcome.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Duration: {lastBookingOutcome.duration} hour
                      {lastBookingOutcome.duration > 1 ? "s" : ""}
                      {lastBookingOutcome.total
                        ? ` • Total: $${lastBookingOutcome.total.toFixed(2)}`
                        : " • Custom rate"}
                    </p>
                    {lastBookingOutcome.reference && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Reference: {lastBookingOutcome.reference}
                      </p>
                    )}
                  </Card>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-4xl mx-auto">
                <Card className="p-4 text-center bg-gradient-card border-none shadow-soft">
                  <p className="text-3xl font-bold text-primary">
                    {stylistsQuery.isLoading ? "…" : totalStylists}
                  </p>
                  <p className="text-sm text-muted-foreground">Verified Stylists</p>
                </Card>
                <Card className="p-4 text-center bg-gradient-card border-none shadow-soft">
                  <p className="text-3xl font-bold text-secondary">
                    {stylistsQuery.isLoading ? "…" : totalReviews}
                  </p>
                  <p className="text-sm text-muted-foreground">Client Reviews</p>
                </Card>
                <Card className="p-4 text-center bg-gradient-card border-none shadow-soft">
                  <p className="text-3xl font-bold text-accent">
                    {stylistsQuery.isLoading
                      ? "…"
                      : averageRating
                      ? `${averageRating.toFixed(1)}★`
                      : "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                </Card>
              </div>

              {stylistsQuery.isLoading ? (
                <Card className="p-8 text-center bg-gradient-card border-none shadow-soft">
                  <p className="text-muted-foreground">Loading stylists...</p>
                </Card>
              ) : stylists.length === 0 ? (
                <Card className="p-8 text-center bg-gradient-card border-none shadow-soft">
                  <p className="text-muted-foreground">
                    No stylists available yet. Check back soon!
                  </p>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stylists.map((stylist) => {
                    const avatar =
                      stylist.user.profile_picture ??
                      (stylist as { profile_picture?: string | null }).profile_picture ??
                      null;
                    const tags = stylist.expertise ?? [];
                    const rate = parseHourlyRate(stylist.hourly_rate);
                    const rating = stylist.rating ?? 0;
                    const ratingCount = stylist.rating_count ?? 0;
                    const stylistName = stylist.user.username;

                    return (
                      <Card
                        key={stylist.id}
                        className="overflow-hidden hover:shadow-medium transition-all group"
                      >
                        <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 relative flex items-center justify-center">
                          {avatar ? (
                            <img
                              src={avatar}
                              alt={stylistName}
                              className="w-32 h-32 rounded-full object-cover shadow-soft"
                            />
                          ) : (
                            <div className="w-32 h-32 rounded-full bg-gradient-hero flex items-center justify-center text-4xl font-bold text-primary-foreground">
                              {stylistName
                                .split(" ")
                                .map((part) => part[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                          )}

                          <div className="absolute top-4 right-4 bg-card px-3 py-1 rounded-full shadow-soft flex items-center gap-1">
                            <Star className="h-3 w-3 fill-secondary text-secondary" />
                            <span className="text-sm font-bold">
                              {rating ? rating.toFixed(1) : "New"}
                            </span>
                            {ratingCount > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ({ratingCount})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-6">
                          <h3 className="font-bold text-xl mb-1">{stylistName}</h3>
                          {stylist.bio && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {stylist.bio}
                            </p>
                          )}

                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                            <MapPin className="h-4 w-4" />
                            {formatLocation(stylist)}
                          </div>

                          {Array.isArray(tags) && tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="pt-4 border-t border-border">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm text-muted-foreground">Session Rate</span>
                              <span className="text-lg font-bold text-primary">
                                {rate ? `$${rate}/hr` : "Contact for rate"}
                              </span>
                            </div>
                            <Button className="w-full" onClick={() => handleBookingOpen(stylist)}>
                              <Calendar className="h-4 w-4 mr-2" />
                              Book Session
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <Card className="p-8 text-center bg-gradient-card border-none shadow-soft">
              <p className="text-muted-foreground">
                Stylist discovery is only available for client accounts.
              </p>
            </Card>
          )}

          <Card className="mt-12 p-8 text-center bg-gradient-accent border-none shadow-medium">
            <h3 className="text-2xl font-bold text-accent-foreground mb-2">
              Are You a Fashion Stylist?
            </h3>
            <p className="text-accent-foreground/90 mb-4 max-w-2xl mx-auto">
              Join our platform and connect with clients who need your expertise.
              Set your own rates and schedule.
            </p>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => toast.info("Stylist registration coming soon!")}
            >
              Join as a Stylist
            </Button>
          </Card>
        </div>
      </div>

      <Dialog
        open={isBookingOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleBookingClose();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedStylist
                ? `Book ${selectedStylist.user.username}`
                : "Book stylist"}
            </DialogTitle>
            <DialogDescription>
              Choose your preferred session time and complete a quick payment preference
              to request a styling consultation.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {currentStep === "details" ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="booking-date">Session Date</Label>
                  <Input
                    id="booking-date"
                    type="date"
                    value={bookingForm.date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(event) => updateBookingForm("date", event.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Available Time</Label>
                  <Select
                    value={bookingForm.timeSlot}
                    onValueChange={(value) => updateBookingForm("timeSlot", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Session Length</Label>
                  <Select
                    value={bookingForm.duration.toString()}
                    onValueChange={(value) =>
                      updateBookingForm("duration", Number(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((hours) => (
                        <SelectItem key={hours} value={hours.toString()}>
                          {hours} hour{hours > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedStylist && (
                    <p className="text-xs text-muted-foreground">
                      Hourly rate:{" "}
                      {parseHourlyRate(selectedStylist.hourly_rate)
                        ? `$${parseHourlyRate(selectedStylist.hourly_rate)?.toFixed(2)}`
                        : "Contact stylist"}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="booking-notes">Notes (optional)</Label>
                  <Textarea
                    id="booking-notes"
                    placeholder="Share outfit goals, upcoming events, or style inspiration."
                    value={bookingForm.notes}
                    onChange={(event) => updateBookingForm("notes", event.target.value)}
                  />
                </div>

                {sessionSummaryCard}
              </>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label>Payment Preference</Label>
                  <Select
                    value={bookingForm.paymentMethod}
                    onValueChange={(value) =>
                      updateBookingForm("paymentMethod", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">{paymentMethodLabels.card}</SelectItem>
                      <SelectItem value="wallet">{paymentMethodLabels.wallet}</SelectItem>
                      <SelectItem value="cash">{paymentMethodLabels.cash}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {sessionSummaryCard}

                <Card className="p-4 mt-4 bg-muted/40 border border-border/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Payment Status</p>
                      <p className="text-xs text-muted-foreground">
                        {paymentSummary?.message ??
                          (bookingStatus === "processing"
                            ? "Processing payment..."
                            : "Confirm to begin payment")}
                      </p>
                    </div>
                    <Badge variant={paymentBadgeVariant}>{paymentBadgeLabel}</Badge>
                  </div>
                  {paymentSummary?.reference && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Reference: {paymentSummary.reference}
                    </p>
                  )}
                </Card>
              </>
            )}
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={handleBookingClose}>
              Cancel
            </Button>
            {currentStep === "details" ? (
              <Button onClick={handleProceedToPayment} disabled={!canProceedToPayment}>
                Continue to payment
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setCurrentStep("details");
                    setBookingStatus("idle");
                    setPaymentSummary(null);
                  }}
                >
                  Back to details
                </Button>
                <Button onClick={handlePaymentSubmit} disabled={confirmDisabled}>
                  {confirmLabel}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Stylists;
