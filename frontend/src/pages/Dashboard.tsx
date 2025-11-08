import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Shirt,
  Target,
  Palette,
  Ruler,
  Clock,
  TrendingUp,
  UserRound,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { LogoMark } from "@/components/LogoMark";
import StyleProfileCard from "@/components/dashboard/StyleProfileCard";
import PersonalSnapshotCard, {
  type ClientInsight,
} from "@/components/dashboard/PersonalSnapshotCard";
import AccountSecurityCard from "@/components/dashboard/AccountSecurityCard";
import WardrobeLibrary from "@/components/dashboard/WardrobeLibrary";
import {
  BODY_SHAPE_OPTIONS,
  FACE_SHAPE_OPTIONS,
  GENDER_OPTIONS,
  SKIN_TONE_OPTIONS,
} from "@/constants/styleProfile";
import type {
  BodyShape,
  ClientProfile,
  FaceShape,
  Gender,
  NewWardrobeItem,
  PasswordFormState,
  ProfileFormState,
  SkinTone,
  StylistFormState,
  StylistProfile,
  WardrobeItem,
  WardrobeList,
} from "@/types/dashboard";

const humanList = (items: string[]) => {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  const last = items[items.length - 1];
  return `${items.slice(0, -1).join(", ")} and ${last}`;
};

const STYLE_PROFILE_FIELD_META: Array<{
  key: keyof ClientProfile;
  label: string;
}> = [
  { key: "gender", label: "Gender" },
  { key: "date_of_birth", label: "Date of Birth" },
  { key: "body_shape", label: "Body Shape" },
  { key: "face_shape", label: "Face Shape" },
  { key: "skin_tone", label: "Skin Tone" },
];

/** ============================
 * Utility validators vs enums
 * ============================ */
const inOpts = <T extends readonly { value: string }[]>(
  opts: T,
  v?: string | null
) => !!v && opts.some((o) => o.value === v);

const createEmptyNewItem = (): NewWardrobeItem => ({
  title: "",
  category: "",
  color: "",
  image_url: "",
  description: "",
});

const Dashboard = () => {
  const { role, authorizedRequest, updateUser } = useAuth();
  const queryClient = useQueryClient();

  const [isWardrobeDialogOpen, setIsWardrobeDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    body_shape: "",
    face_shape: "",
    skin_tone: "",
    gender: "",
    date_of_birth: "", // yyyy-mm-dd or empty
  });
  const [stylistForm, setStylistForm] = useState<StylistFormState>({
    bio: "",
    expertise: "",
    years_experience: "",
  });
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<NewWardrobeItem>(createEmptyNewItem());

  const isClient = role === "client";
  const isStylist = role === "stylist";
  const isEditingWardrobe = Boolean(editingItem);

  const formatLabel = (value: string | null | undefined) => {
    if (!value) return "—";
    return value
      .split("_")
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  };
  const formatDate = (value?: string | null) =>
    value
      ? new Date(value).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—";

  const profileQuery = useQuery<ClientProfile | StylistProfile>({
    queryKey: ["profile", role],
    enabled: Boolean(role),
    queryFn: async () => {
      if (!role) throw new Error("Missing user role");
      return authorizedRequest<ClientProfile | StylistProfile>(`/${role}/me/`);
    },
  });

  const wardrobeQuery = useQuery<WardrobeList>({
    queryKey: ["wardrobe", role],
    enabled: isClient,
    queryFn: async () => authorizedRequest<WardrobeList>("/client/wardrobe/"),
  });

  const profileMutation = useMutation({
    mutationFn: async (payload: ProfileFormState) => {
      if (!isClient) throw new Error("Only clients can update this profile");
      // Compose PATCH strictly with backend fields
      const response = await authorizedRequest<ClientProfile>("/client/me/", {
        method: "PATCH",
        data: {
          body_shape: payload.body_shape || null,
          face_shape: payload.face_shape || null,
          skin_tone: payload.skin_tone || null,
          gender: payload.gender || null,
          // Send null if empty string to satisfy DRF serializer
          date_of_birth: payload.date_of_birth ? payload.date_of_birth : null,
        },
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["profile", role], data);
      updateUser(data.user);
      toast.success("Profile updated!");
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
        return;
      }
      toast.error("Failed to update profile. Please try again.");
    },
  });

  const stylistProfileMutation = useMutation({
    mutationFn: async (payload: {
      bio: string;
      expertise: string[];
      years_experience: number | null;
    }) => {
      if (role !== "stylist")
        throw new Error("Only stylists can update this profile");
      const response = await authorizedRequest<StylistProfile>("/stylist/me/", {
        method: "PATCH",
        data: {
          bio: payload.bio,
          expertise: payload.expertise,
          years_experience: payload.years_experience,
        },
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["profile", role], data);
      updateUser(data.user);
      toast.success("Profile updated!");
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
        return;
      }
      toast.error("Failed to update profile. Please try again.");
    },
  });

  const createWardrobeMutation = useMutation({
    mutationFn: async (payload: NewWardrobeItem) => {
      if (!isClient) throw new Error("Only clients can manage wardrobe items");
      const response = await authorizedRequest<WardrobeItem>(
        "/client/wardrobe/",
        {
          method: "POST",
          data: {
            image_url: payload.image_url,
            title: payload.title,
            color: payload.color,
            category: payload.category,
            description: payload.description || null,
          },
        }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wardrobe", role] });
      setIsWardrobeDialogOpen(false);
      setEditingItem(null);
      setNewItem(createEmptyNewItem());
      setImageUploadError(null);
      setImageUploading(false);
      toast.success("Item added to wardrobe!");
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
        return;
      }
      toast.error("Failed to add item. Please try again.");
    },
  });

  const updateWardrobeMutation = useMutation({
    mutationFn: async (input: { id: string; data: NewWardrobeItem }) => {
      if (!isClient) throw new Error("Only clients can manage wardrobe items");
      const response = await authorizedRequest<WardrobeItem>(
        `/client/wardrobe/${input.id}/`,
        {
          method: "PATCH",
          data: {
            image_url: input.data.image_url,
            title: input.data.title,
            color: input.data.color,
            category: input.data.category,
            description: input.data.description || null,
          },
        }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wardrobe", role] });
      setIsWardrobeDialogOpen(false);
      setEditingItem(null);
      setNewItem(createEmptyNewItem());
      setImageUploadError(null);
      setImageUploading(false);
      toast.success("Item updated!");
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
        return;
      }
      toast.error("Failed to update item. Please try again.");
    },
  });

  const deleteWardrobeMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!isClient) throw new Error("Only clients can manage wardrobe items");
      await authorizedRequest<void>(`/client/wardrobe/${id}/`, {
        method: "DELETE",
      });
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["wardrobe", role] });
      if (editingItem && editingItem.id === id) {
        setIsWardrobeDialogOpen(false);
        setEditingItem(null);
        setNewItem(createEmptyNewItem());
        setImageUploadError(null);
        setImageUploading(false);
      }
      toast.success("Item removed from wardrobe.");
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
        return;
      }
      toast.error("Failed to delete item. Please try again.");
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (payload: {
      old_password: string;
      new_password: string;
    }) => {
      if (!role) throw new Error("Missing user role");
      return authorizedRequest<void>(`/${role}/auth/change-password/`, {
        method: "POST",
        data: payload,
      });
    },
    onSuccess: () => {
      toast.success("Password updated successfully!");
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsPasswordDialogOpen(false);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
        return;
      }
      toast.error("Failed to change password. Please try again.");
    },
  });

  /** Seed form from backend profile */
  useEffect(() => {
    const profileData = profileQuery.data;
    if (!profileData) return;

    if (profileData.user) {
      updateUser(profileData.user);
    }

    if (isClient) {
      const p = profileData as ClientProfile;
      setProfileForm({
        body_shape: inOpts(BODY_SHAPE_OPTIONS, p.body_shape)
          ? (p.body_shape as BodyShape)
          : "",
        face_shape: inOpts(FACE_SHAPE_OPTIONS, p.face_shape)
          ? (p.face_shape as FaceShape)
          : "",
        skin_tone: inOpts(SKIN_TONE_OPTIONS, p.skin_tone)
          ? (p.skin_tone as SkinTone)
          : "",
        gender: inOpts(GENDER_OPTIONS, p.gender) ? (p.gender as Gender) : "",
        date_of_birth: p.date_of_birth ?? "", // keep empty if null
      });
    } else if (role === "stylist") {
      const p = profileData as StylistProfile;
      setStylistForm({
        bio: p.bio ?? "",
        expertise: Array.isArray(p.expertise) ? p.expertise.join(", ") : "",
        years_experience:
          p.years_experience != null ? String(p.years_experience) : "",
      });
    }
  }, [profileQuery.data, isClient, role, updateUser]);

  /** Toast errors */
  useEffect(() => {
    if (!profileQuery.error) return;
    const error = profileQuery.error;
    if (error instanceof ApiError) toast.error(error.message);
    else toast.error("Failed to load profile information.");
  }, [profileQuery.error]);

  useEffect(() => {
    if (!wardrobeQuery.error) return;
    const error = wardrobeQuery.error;
    if (error instanceof ApiError) toast.error(error.message);
    else toast.error("Failed to load wardrobe items.");
  }, [wardrobeQuery.error]);

  const wardrobeItems = useMemo<WardrobeItem[]>(() => {
    const data = wardrobeQuery.data;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if ("results" in data && Array.isArray(data.results)) return data.results;
    return [];
  }, [wardrobeQuery.data]);

  const clientInsights: ClientInsight[] = isClient
    ? [
        {
          label: "Wardrobe Items",
          value: wardrobeItems.length.toString(),
          icon: Shirt,
        },
        {
          label: "Body Shape",
          value: formatLabel(profileForm.body_shape),
          icon: Target,
        },
        {
          label: "Skin Tone",
          value: formatLabel(profileForm.skin_tone),
          icon: Palette,
        },
        {
          label: "Face Shape",
          value: formatLabel(profileForm.face_shape),
          icon: Ruler,
        },
      ]
    : [];

  const isWardrobeEmpty = wardrobeItems.length === 0;
  const isSavingWardrobe =
    createWardrobeMutation.isPending || updateWardrobeMutation.isPending;

  const handleProfileSave = () => {
    if (!isClient) return;
    profileMutation.mutate(profileForm);
  };

  const handleStylistProfileSave = () => {
    if (role !== "stylist") return;
    const years = stylistForm.years_experience.trim()
      ? Number(stylistForm.years_experience)
      : null;

    if (years !== null && (Number.isNaN(years) || years < 0)) {
      toast.error("Years of experience must be a positive number");
      return;
    }

    const expertiseList = stylistForm.expertise
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    stylistProfileMutation.mutate({
      bio: stylistForm.bio,
      expertise: expertiseList,
      years_experience: years,
    });
  };

  const handlePasswordSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!role) return;

    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      toast.error("Please fill in both password fields");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    passwordMutation.mutate({
      old_password: passwordForm.oldPassword,
      new_password: passwordForm.newPassword,
    });
  };

  const handleWardrobeSubmit = () => {
    if (imageUploading) {
      toast.error("Please wait for the image upload to finish.");
      return;
    }

    if (
      !newItem.title ||
      !newItem.category ||
      !newItem.color ||
      !newItem.image_url
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (isEditingWardrobe && editingItem) {
      updateWardrobeMutation.mutate({ id: editingItem.id, data: newItem });
    } else {
      createWardrobeMutation.mutate(newItem);
    }
  };

  const handleNewItemChange = (field: keyof NewWardrobeItem, value: string) => {
    setNewItem((current) => ({ ...current, [field]: value }));
  };

  const updateStylistForm = (field: keyof StylistFormState, value: string) => {
    setStylistForm((current) => ({ ...current, [field]: value }));
  };

  const updatePasswordForm = (
    field: keyof PasswordFormState,
    value: string
  ) => {
    setPasswordForm((current) => ({ ...current, [field]: value }));
  };

  const handleImageFileUpload = async (file: File) => {
    setImageUploadError(null);
    setImageUploading(true);
    try {
      const secureUrl = await uploadImageToCloudinary(file);
      setNewItem((current) => ({ ...current, image_url: secureUrl }));
      toast.success("Image uploaded successfully.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to upload image. Please try again.";
      setImageUploadError(message);
      toast.error(message);
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    void handleImageFileUpload(file);
    event.target.value = "";
  };

  const openCreateWardrobeDialog = () => {
    setEditingItem(null);
    setNewItem(createEmptyNewItem());
    setImageUploadError(null);
    setImageUploading(false);
    setIsWardrobeDialogOpen(true);
  };

  const openEditWardrobeDialog = (item: WardrobeItem) => {
    setEditingItem(item);
    setNewItem({
      title: item.title,
      category: item.category,
      color: item.color,
      image_url: item.image_url,
      description: item.description ?? "",
    });
    setImageUploadError(null);
    setImageUploading(false);
    setIsWardrobeDialogOpen(true);
  };

  const handleDeleteWardrobeItem = (item: WardrobeItem) => {
    const confirmed = window.confirm(
      `Remove "${item.title}" from your wardrobe?`
    );
    if (!confirmed) return;
    deleteWardrobeMutation.mutate(item.id);
  };

  const handleWardrobeDialogChange = (open: boolean) => {
    setIsWardrobeDialogOpen(open);
    if (!open) {
      setEditingItem(null);
      setNewItem(createEmptyNewItem());
      setImageUploadError(null);
      setImageUploading(false);
    }
  };

  const passwordDialog = (
    <Dialog
      open={isPasswordDialogOpen}
      onOpenChange={(open) => {
        setIsPasswordDialogOpen(open);
        if (!open) {
          setPasswordForm({
            oldPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            handlePasswordSubmit(event);
          }}
        >
          <DialogHeader>
            <DialogTitle>Update Password</DialogTitle>
            <DialogDescription>
              Strengthen your account security with a fresh password. Updates
              take effect immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={passwordForm.oldPassword}
              onChange={(event) =>
                updatePasswordForm("oldPassword", event.target.value)
              }
              autoComplete="current-password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) =>
                updatePasswordForm("newPassword", event.target.value)
              }
              autoComplete="new-password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) =>
                updatePasswordForm("confirmPassword", event.target.value)
              }
              autoComplete="new-password"
              required
            />
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPasswordDialogOpen(false)}
              className="sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="sm:w-auto"
              disabled={passwordMutation.isPending}
            >
              {passwordMutation.isPending ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
          <p className="text-xs text-muted-foreground text-center">
            Password changes apply instantly across all of your devices.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );

  if (!role) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 pb-16 px-4">
          <div className="container mx-auto">
            <Card className="p-6 bg-gradient-card border-none shadow-soft">
              <p className="text-muted-foreground">Loading your dashboard...</p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const profileData = profileQuery.data;
  const clientProfile = isClient
    ? (profileData as ClientProfile | undefined)
    : undefined;
  const stylistProfile = isStylist
    ? (profileData as StylistProfile | undefined)
    : undefined;

  const missingStyleProfileFields = useMemo(() => {
    if (!clientProfile) return [] as string[];
    return STYLE_PROFILE_FIELD_META.filter(({ key }) => {
      const value = clientProfile[key];
      if (value == null) return true;
      if (typeof value === "string") return value.trim().length === 0;
      return false;
    }).map(({ label }) => label);
  }, [clientProfile]);

  const shouldShowStyleProfileWarning = Boolean(
    isClient && clientProfile && missingStyleProfileFields.length > 0
  );
  const missingStyleProfileFieldsText = humanList(missingStyleProfileFields);

  const firstName = profileData?.user?.first_name;
  const lastName = profileData?.user?.last_name;
  const fullName =
    firstName && lastName
      ? `${firstName} ${lastName}`
      : firstName || lastName || profileData?.user?.username;
  const profileEmail = profileData?.user?.email ?? "—";
  const memberStatus = formatLabel(profileData?.user?.status);

  const greetingName = fullName ?? "StyleGenie Member";
  const roleDisplay = isClient ? "Client" : isStylist ? "Stylist" : "Member";
  const createdAt = profileData?.created_at;
  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : null;
  const pageSubtitle = isClient
    ? "Fine-tune your style profile, curate wardrobe staples, and get ready for smarter AI picks."
    : "Showcase your expertise, track performance, and keep your account secure.";
  const earningsTotal = stylistProfile?.earnings_total
    ? Number(stylistProfile.earnings_total)
    : null;
  const stylistMetrics = isStylist
    ? [
        {
          label: "Rating",
          value: stylistProfile?.rating
            ? `${stylistProfile.rating.toFixed(1)}★`
            : "New",
          helper: `${stylistProfile?.rating_count ?? 0} review${
            (stylistProfile?.rating_count ?? 0) === 1 ? "" : "s"
          }`,
          icon: LogoMark,
        },
        {
          label: "Experience",
          value: `${stylistProfile?.years_experience ?? 0} yrs`,
          helper: "Hands-on styling",
          icon: Ruler,
        },
        {
          label: "Earnings",
          value: earningsTotal ? `$${earningsTotal.toLocaleString()}` : "—",
          helper: "Total to date",
          icon: TrendingUp,
        },
        {
          label: "Member Since",
          value: memberSince ?? "—",
          helper: "Active stylist",
          icon: Clock,
        },
      ]
    : [];
  const expertiseList =
    Array.isArray(stylistProfile?.expertise) &&
    stylistProfile?.expertise?.length
      ? stylistProfile.expertise
      : [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
            <p className="text-muted-foreground max-w-2xl">{pageSubtitle}</p>
          </div>

          {profileData && (
            <Card className="mb-10 border-none bg-gradient-to-br from-primary/10 via-background to-secondary/10 shadow-soft">
              <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    <LogoMark className="h-4 w-4" />
                    Welcome back
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight">
                    {greetingName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <Badge
                      variant="secondary"
                      className="uppercase tracking-wide"
                    >
                      {roleDisplay}
                    </Badge>
                    {memberSince && (
                      <span className="inline-flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Joined {memberSince}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-2">
                      <UserRound className="h-4 w-4" />
                      {profileEmail}
                    </span>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
                  <p className="text-sm text-muted-foreground max-w-sm text-left md:text-right">
                    {isClient
                      ? "Add new wardrobe favorites or refresh your style preferences to unlock sharper recommendations."
                      : "Share your latest expertise so clients know exactly how you elevate their look."}
                  </p>
                  {isClient ? (
                    <Button
                      variant="secondary"
                      onClick={openCreateWardrobeDialog}
                      className="w-full md:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Wardrobe Item
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        toast.info("Booking requests will arrive soon!")
                      }
                      className="w-full md:w-auto"
                    >
                      <LogoMark className="h-4 w-4 mr-2" />
                      Preview Booking Flow
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}

          {isClient ? (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Profile card */}
              <div className="lg:col-span-1 space-y-6">
                <StyleProfileCard
                  profileForm={profileForm}
                  setProfileForm={setProfileForm}
                  onSave={handleProfileSave}
                  isSaving={profileMutation.isPending}
                  showWarning={shouldShowStyleProfileWarning}
                  missingFieldsText={missingStyleProfileFieldsText}
                  missingFieldLabels={missingStyleProfileFields}
                />
                <PersonalSnapshotCard
                  insights={clientInsights}
                  primaryEmail={profileEmail}
                  memberStatus={memberStatus}
                />

                <AccountSecurityCard
                  onManagePassword={() => setIsPasswordDialogOpen(true)}
                />
              </div>

              {/* Wardrobe */}
              <div className="lg:col-span-2">
                <WardrobeLibrary
                  wardrobeItems={wardrobeItems}
                  isLoading={wardrobeQuery.isLoading}
                  isEmpty={isWardrobeEmpty}
                  isDialogOpen={isWardrobeDialogOpen}
                  isSaving={isSavingWardrobe}
                  isDeleting={deleteWardrobeMutation.isPending}
                  isEditing={isEditingWardrobe}
                  newItem={newItem}
                  imageUploading={imageUploading}
                  imageUploadError={imageUploadError}
                  onDialogChange={handleWardrobeDialogChange}
                  onCreateClick={openCreateWardrobeDialog}
                  onEditItem={openEditWardrobeDialog}
                  onDeleteItem={handleDeleteWardrobeItem}
                  onSubmit={handleWardrobeSubmit}
                  onNewItemChange={handleNewItemChange}
                  onImageFileChange={handleImageFileChange}
                  formatLabel={formatLabel}
                  formatDate={formatDate}
                />
              </div>
            </div>
          ) : (
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1">
                <TabsTrigger
                  value="profile"
                  className="flex-1 data-[state=active]:bg-background data-[state=active]:text-primary"
                >
                  Profile
                </TabsTrigger>
                <TabsTrigger
                  value="metrics"
                  className="flex-1 data-[state=active]:bg-background data-[state=active]:text-primary"
                >
                  Performance
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="flex-1 data-[state=active]:bg-background data-[state=active]:text-primary"
                >
                  Security
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <Card className="p-6 bg-gradient-card border-none shadow-soft">
                  <h2 className="text-2xl font-bold mb-4">Stylist Profile</h2>
                  {profileQuery.isLoading ? (
                    <p className="text-muted-foreground">
                      Loading your stylist profile...
                    </p>
                  ) : (
                    <form
                      className="space-y-4"
                      onSubmit={(event) => {
                        event.preventDefault();
                        handleStylistProfileSave();
                      }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="stylist-bio">Bio</Label>
                        <Textarea
                          id="stylist-bio"
                          placeholder="Describe your styling approach..."
                          value={stylistForm.bio}
                          onChange={(event) =>
                            updateStylistForm("bio", event.target.value)
                          }
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stylist-expertise">Expertise</Label>
                        <Input
                          id="stylist-expertise"
                          placeholder="streetwear, casual, vintage"
                          value={stylistForm.expertise}
                          onChange={(event) =>
                            updateStylistForm("expertise", event.target.value)
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Separate multiple expertise areas with commas.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stylist-experience">
                          Years of Experience
                        </Label>
                        <Input
                          id="stylist-experience"
                          type="number"
                          min={0}
                          placeholder="5"
                          value={stylistForm.years_experience}
                          onChange={(event) =>
                            updateStylistForm(
                              "years_experience",
                              event.target.value
                            )
                          }
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={stylistProfileMutation.isPending}
                      >
                        {stylistProfileMutation.isPending
                          ? "Saving..."
                          : "Save Profile"}
                      </Button>
                    </form>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="metrics">
                <Card className="p-6 bg-gradient-card border-none shadow-soft space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-2xl font-bold">Performance Overview</h3>
                    <Badge
                      variant="secondary"
                      className="uppercase tracking-wide"
                    >
                      Live Insights
                    </Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {stylistMetrics.map((metric) => {
                      const MetricIcon = metric.icon;
                      return (
                        <div
                          key={metric.label}
                          className="rounded-lg border border-border/60 bg-background/70 p-4 shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                {metric.label}
                              </p>
                              <p className="text-xl font-semibold">
                                {metric.value}
                              </p>
                            </div>
                            <MetricIcon className="h-5 w-5 text-primary" />
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {metric.helper}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <Separator />
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        Account Details
                      </p>
                      <div className="rounded-lg border border-border/60 bg-background/70 p-4 text-sm space-y-2">
                        <p>
                          <span className="text-muted-foreground">
                            Username:
                          </span>{" "}
                          {profileData?.user.username}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Email:</span>{" "}
                          {profileData?.user?.email}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Status:</span>{" "}
                          {formatLabel(profileData?.user.status)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        Expertise Tags
                      </p>
                      {expertiseList.length ? (
                        <div className="flex flex-wrap gap-2">
                          {expertiseList.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Add your specialties above to help clients discover
                          you faster.
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card className="p-6 bg-gradient-card border-none shadow-soft">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">
                        Account Security
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Keep your stylist profile secure by refreshing your
                        password periodically.
                      </p>
                    </div>
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setIsPasswordDialogOpen(true)}
                  >
                    Update Password
                  </Button>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
      {passwordDialog}
    </div>
  );
};

export default Dashboard;
