import { useMemo, type Dispatch, type SetStateAction } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  BODY_SHAPE_OPTIONS,
  FACE_SHAPE_OPTIONS,
  GENDER_OPTIONS,
  SKIN_TONE_OPTIONS,
} from "@/constants/styleProfile";
import type { ProfileFormState } from "@/types/dashboard";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StyleProfileCardProps {
  profileForm: ProfileFormState;
  setProfileForm: Dispatch<SetStateAction<ProfileFormState>>;
  onSave: () => void;
  isSaving: boolean;
  showWarning: boolean;
  missingFieldsText: string;
  missingFieldLabels: string[];
}

const StyleProfileCard = ({
  profileForm,
  setProfileForm,
  onSave,
  isSaving,
  showWarning,
  missingFieldsText,
  missingFieldLabels,
}: StyleProfileCardProps) => {
  const warningText = useMemo(() => {
    if (!missingFieldsText) {
      return "Save your measurements to unlock precise outfit guidance.";
    }
    return `Add your ${missingFieldsText} to unlock precise outfit guidance.`;
  }, [missingFieldsText]);

  const missingFieldSet = useMemo(
    () =>
      new Set(
        missingFieldLabels.map((label) => label.trim().toLowerCase()),
      ),
    [missingFieldLabels],
  );

  const isFieldMissing = (label: string) =>
    missingFieldSet.has(label.trim().toLowerCase());

  const FieldLabel = ({ label, helper }: { label: string; helper?: string }) => (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-semibold text-foreground/85">{label}</Label>
        {isFieldMissing(label) && (
          <span className="inline-flex items-center gap-1 rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-destructive">
            <AlertTriangle className="h-3 w-3" />
            Required
          </span>
        )}
      </div>
      {helper && (
        <p className="text-xs text-muted-foreground">{helper}</p>
      )}
    </div>
  );

  const controlClass = (label: string) =>
    cn(
      "transition-all focus-visible:ring-2",
      isFieldMissing(label) &&
        "border-destructive/70 bg-destructive/5 focus-visible:ring-destructive/40",
    );

  return (
    <Card className="p-6 bg-gradient-card border-none shadow-soft">
      <h2 className="text-2xl font-bold mb-4">Style Profile</h2>

      {showWarning && (
        <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Complete your style profile</AlertTitle>
          <AlertDescription>{warningText}</AlertDescription>
        </Alert>
      )}

      <p className="text-sm text-muted-foreground mb-6">
        Keep these measurements current so our AI wardrobe picks match your lifestyle.
      </p>

      <div className="space-y-5">
        <div>
          <FieldLabel label="Gender" helper="Helps tailor fit and silhouette suggestions." />
          <Select
            value={profileForm.gender || undefined}
            onValueChange={(value) =>
              setProfileForm((c) => ({
                ...c,
                gender: value as ProfileFormState["gender"],
              }))
            }
          >
            <SelectTrigger className={controlClass("Gender")}>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <FieldLabel label="Date of Birth" helper="Unlock age-aware recommendations." />
          <Input
            type="date"
            value={profileForm.date_of_birth}
            onChange={(e) =>
              setProfileForm((c) => ({
                ...c,
                date_of_birth: e.target.value,
              }))
            }
            className={controlClass("Date of Birth")}
            placeholder="Select date"
          />
        </div>

        <div>
          <FieldLabel label="Body Shape" helper="Ensures styling advice flatters your proportions." />
          <Select
            value={profileForm.body_shape || undefined}
            onValueChange={(value) =>
              setProfileForm((c) => ({
                ...c,
                body_shape: value as ProfileFormState["body_shape"],
              }))
            }
          >
            <SelectTrigger className={controlClass("Body Shape")}>
              <SelectValue placeholder="Select body shape" />
            </SelectTrigger>
            <SelectContent>
              {BODY_SHAPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <FieldLabel label="Face Shape" helper="Guides accessory and neckline ideas." />
          <Select
            value={profileForm.face_shape || undefined}
            onValueChange={(value) =>
              setProfileForm((c) => ({
                ...c,
                face_shape: value as ProfileFormState["face_shape"],
              }))
            }
          >
            <SelectTrigger className={controlClass("Face Shape")}>
              <SelectValue placeholder="Select face shape" />
            </SelectTrigger>
            <SelectContent>
              {FACE_SHAPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <FieldLabel label="Skin Tone" helper="Improves palette and fabric picks." />
          <Select
            value={profileForm.skin_tone || undefined}
            onValueChange={(value) =>
              setProfileForm((c) => ({
                ...c,
                skin_tone: value as ProfileFormState["skin_tone"],
              }))
            }
          >
            <SelectTrigger className={controlClass("Skin Tone")}>
              <SelectValue placeholder="Select skin tone" />
            </SelectTrigger>
            <SelectContent>
              {SKIN_TONE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full transition-colors hover:scale-[1.01]"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </Card>
  );
};

export default StyleProfileCard;
