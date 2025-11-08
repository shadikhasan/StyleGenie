import type { AuthUser } from "@/context/AuthContext";

export type Gender =
  | "male"
  | "female"
  | "non_binary"
  | "other"
  | "prefer_not_to_say"
  | null;

export type SkinTone =
  | "fair"
  | "light"
  | "medium"
  | "tan"
  | "olive"
  | "brown"
  | "dark"
  | null;

export type BodyShape =
  | "rectangle"
  | "hourglass"
  | "pear"
  | "apple"
  | "inverted_triangle"
  | null;

export type FaceShape =
  | "oval"
  | "round"
  | "square"
  | "heart"
  | "diamond"
  | "oblong"
  | null;

export interface ClientProfile {
  user: AuthUser;
  date_of_birth?: string | null;
  gender?: Gender;
  skin_tone?: SkinTone;
  body_shape?: BodyShape;
  face_shape?: FaceShape;
  created_at?: string;
  updated_at?: string;
}

export interface StylistProfile {
  user: AuthUser;
  bio?: string | null;
  expertise?: string[] | null;
  years_experience?: number | null;
  rating?: number | null;
  rating_count?: number | null;
  earnings_total?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WardrobeItem {
  id: string;
  user: string;
  user_email: string;
  image_url: string;
  title: string;
  color: string;
  category: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export type WardrobeList = WardrobeItem[] | { results: WardrobeItem[] };

export type ProfileField<T> = NonNullable<T> | "";

export interface ProfileFormState {
  body_shape: ProfileField<BodyShape>;
  face_shape: ProfileField<FaceShape>;
  skin_tone: ProfileField<SkinTone>;
  gender: ProfileField<Gender>;
  date_of_birth: string;
}

export interface StylistFormState {
  bio: string;
  expertise: string;
  years_experience: string;
}

export interface PasswordFormState {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface NewWardrobeItem {
  title: string;
  category: string;
  color: string;
  image_url: string;
  description: string;
}
