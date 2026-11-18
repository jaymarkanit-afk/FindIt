// Shapes shared by the seed data, localStorage and (later) the backend.
// They match the old app's js/database.js and js/store.js field for field,
// so data saved by the old app keeps working.

export type Place = { name: string; province: string; lat: number; lng: number };

export type OpeningHours = { open: string; close: string };

// A featured photo ("highlight"): a path or data: URL, or, once the owner
// gives it a label, { src, label }. Plain strings are the old shape.
export type FeaturedPhoto = string | { src: string; label?: string };

export type Cafe = {
  id: number;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  rating: number;
  reviews: number;
  tags: string[];
  img: string;
  logo?: string;
  contact?: string;
  hours?: OpeningHours;
  backgroundPhoto: string | null;
  featuredPhotos: FeaturedPhoto[];
  // What the owner chose to show on the café page (all optional)
  about?: string;
  phone?: string;
  facebook?: string;
  instagram?: string;
};

export const POST_TYPES = ["new", "photos", "event", "hiring", "promo"] as const;
export type PostType = (typeof POST_TYPES)[number];

export const POST_STATUSES = ["live", "draft", "ended"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export type PostPhoto = { src: string; alt?: string };

type PostBase = {
  id: string;
  cafeId: number;
  time: number;
  sips: number;
  caption: string;
  photos: PostPhoto[];
  status: PostStatus;
  pinned: boolean;
  endedAt: number | null;
  editedAt?: number;
};

export type NewDetails = { item: string; price: string; availability: string };
export type EventDetails = { title: string; day: string; time: string; price: string; date?: string };
export type PromoDetails = { title: string; offer: string; validUntil: string };
export type HiringDetails = { role: string; schedule: string; perks: string };

export type Post =
  | (PostBase & { type: "photos" })
  | (PostBase & { type: "new"; new: NewDetails })
  | (PostBase & { type: "event"; event: EventDetails })
  | (PostBase & { type: "promo"; promo: PromoDetails })
  | (PostBase & { type: "hiring"; hiring: HiringDetails });

export type PostDetails = NewDetails | EventDetails | PromoDetails | HiringDetails;

// { id, postId, authorName, text, createdAt (ISO string) }
export type Comment = { id: string; postId: string; authorName: string; text: string; createdAt: string };

// Saved owner changes, in the shapes the old app stores.
// A post edit holds any changed post fields; { deleted: true } removes the post.
export type PostEdit = Readonly<Record<string, unknown>>;
// The café's own details only: never the owner's personal name or contact
// unless they type it into one of these fields
export type CafeDetails = { about: string; phone: string; facebook: string; instagram: string; hours: OpeningHours | null };
export type CafeEdit = {
  backgroundPhoto?: string | null;
  featuredPhotos?: FeaturedPhoto[];
  about?: string;
  phone?: string;
  facebook?: string;
  instagram?: string;
  hours?: OpeningHours | null; // null: the owner cleared the hours
};

export type Theme = "light" | "dark";

// Everything a visitor (or the demo owner) does that survives a reload.
// Each field is one localStorage key (see src/lib/local/userState.ts).
export type UserState = {
  alerts: number[];
  keeps: string[];
  savedCafes: number[];
  sips: string[];
  cta: string[];
  seen: string[];
  comments: Comment[];
  ownerPosts: Post[];
  cafeEdits: Readonly<Record<string, CafeEdit>>;
  postEdits: Readonly<Record<string, PostEdit>>;
  place: string;
  theme: Theme | null;
  lastCafe: number | null;
};
