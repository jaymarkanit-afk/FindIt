// Pure logic behind the owner's composer, ported from the old app's
// owner.js (buildAnnPost, validateAnn, the limits and the wording).
// No storage and no React.

import type { Post, PostPhoto, PostType } from "@/data/types";

export const CAPTION_MAX = 500;
export const CAPTION_MIN = 3; // required for every type except "photos"
export const CAPTION_WARN_AT = CAPTION_MAX - 20;

// How many photos each type may carry (and how many it needs)
export const PHOTO_LIMITS: Record<PostType, { max: number; min: number }> = {
  new: { max: 4, min: 0 },
  photos: { max: 6, min: 1 },
  promo: { max: 1, min: 0 },
  event: { max: 1, min: 0 },
  hiring: { max: 0, min: 0 },
};

export const COMPOSER_TYPES: Array<{ type: PostType; label: string }> = [
  { type: "new", label: "New item" },
  { type: "photos", label: "Photos" },
  { type: "promo", label: "Promo" },
  { type: "event", label: "Event" },
  { type: "hiring", label: "Hiring" },
];

export const TYPE_NAMES: Record<PostType, string> = { new: "New", photos: "Photos", event: "Event", hiring: "Hiring", promo: "Promo" };

export const CAPTION_PLACEHOLDERS: Record<PostType, string> = {
  new: "Tell customers about it",
  photos: "Say something about these photos",
  promo: "Explain the offer",
  event: "What should people expect?",
  hiring: "Describe the role and who you are looking for",
};

export const PHOTO_HINTS: Record<PostType, string> = {
  new: "Optional, up to 4. The first one shows on the card.",
  photos: "1 to 6 photos. The first one is the main photo.",
  promo: "Optional, 1 photo.",
  event: "Optional, 1 photo.",
  hiring: "",
};

export const STORAGE_FULL_POST =
  "This post could not be saved: FindIt's storage in this browser is full. Your draft is still here. Remove a photo, or delete an older post under \"Your posts\", then publish again.";

// What the composer's fields hold. Time is "19:00" (the time input's
// value); dates are "YYYY-MM-DD".
export type ComposerForm = {
  type: PostType;
  caption: string;
  photos: Array<{ src: string; alt: string }>;
  item: string;
  price: string;
  availability: string;
  promoTitle: string;
  offer: string;
  validUntil: string;
  eventTitle: string;
  date: string;
  time: string;
  eventPrice: string;
  role: string;
  schedule: string;
  perks: string;
};

export function emptyForm(type: PostType = "new"): ComposerForm {
  return {
    type,
    caption: "",
    photos: [],
    item: "",
    price: "",
    availability: "",
    promoTitle: "",
    offer: "",
    validUntil: "",
    eventTitle: "",
    date: "",
    time: "",
    eventPrice: "",
    role: "",
    schedule: "",
    perks: "",
  };
}

// "7 PM" / "7:30 PM" from "19:00" / "19:30"
export function formatTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return "";
  const h = Number(match[1]);
  const m = Number(match[2]);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "AM" : "PM"}`;
}

// "19:00" from "7 PM" (for editing)
export function to24h(label: string): string {
  const match = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i.exec(label.trim());
  if (!match) return "";
  let h = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${match[2] ?? "00"}`;
}

// "FRI" from "2026-11-20"
export function weekdayOf(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  return new Date(`${date}T00:00`).toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
}

// The composer's fields for an existing post
export function formFromPost(post: Post): ComposerForm {
  const form = { ...emptyForm(post.type), caption: post.caption, photos: post.photos.map((photo) => ({ src: photo.src, alt: photo.alt ?? "" })) };
  switch (post.type) {
    case "new":
      return { ...form, item: post.new.item, price: post.new.price, availability: post.new.availability };
    case "promo":
      return { ...form, promoTitle: post.promo.title, offer: post.promo.offer, validUntil: post.promo.validUntil };
    case "event":
      return { ...form, eventTitle: post.event.title, date: post.event.date ?? "", time: to24h(post.event.time), eventPrice: post.event.price };
    case "hiring":
      return { ...form, role: post.hiring.role, schedule: post.hiring.schedule, perks: post.hiring.perks };
    case "photos":
      return form;
  }
}

// The fields a saved post keeps from before (or a new post's defaults)
export type PostBase = { id: string; cafeId: number; time: number; sips: number; pinned: boolean; eventDay?: string };

// The post the form describes. Extra photos past the type's limit are left
// out, as are empty descriptions; only the caption's ends are trimmed.
export function buildPost(form: ComposerForm, base: PostBase): Post {
  const photos: PostPhoto[] = form.photos
    .slice(0, PHOTO_LIMITS[form.type].max)
    .map((photo) => (photo.alt.trim() ? { src: photo.src, alt: photo.alt.trim() } : { src: photo.src }));
  const common = {
    id: base.id,
    cafeId: base.cafeId,
    time: base.time,
    sips: base.sips,
    status: "live" as const,
    pinned: base.pinned,
    endedAt: null,
    caption: form.caption.trim(),
    photos,
  };
  switch (form.type) {
    case "new":
      return { ...common, type: "new", new: { item: form.item.trim(), price: form.price.trim(), availability: form.availability.trim() } };
    case "promo":
      return { ...common, type: "promo", promo: { title: form.promoTitle.trim(), offer: form.offer.trim(), validUntil: form.validUntil } };
    case "event": {
      const date = form.date;
      return {
        ...common,
        type: "event",
        event: {
          title: form.eventTitle.trim(),
          date,
          day: date ? weekdayOf(date) : (base.eventDay ?? ""),
          time: formatTime(form.time),
          price: form.eventPrice.trim(),
        },
      };
    }
    case "hiring":
      return { ...common, type: "hiring", hiring: { role: form.role.trim(), schedule: form.schedule.trim(), perks: form.perks.trim() } };
    case "photos":
      return { ...common, type: "photos" };
  }
}

export type FieldError = { field: string; message: string };

// Everything that blocks publishing (Save draft has no checks)
export function validatePost(post: Post): FieldError[] {
  const errors: FieldError[] = [];
  const need = (ok: unknown, field: string, message: string) => {
    if (!ok) errors.push({ field, message });
  };
  if (post.type === "new") need(post.new.item, "ann-item", "Add the item's name.");
  if (post.type === "promo") need(post.promo.title, "ann-promo-title", "Add a title for the promo.");
  if (post.type === "event") {
    need(post.event.title, "ann-event-title", "Add a title for the event.");
    need(post.event.date || post.event.day, "ann-date", "Add the event date.");
  }
  if (post.type === "hiring") need(post.hiring.role, "ann-role", "Add the role you are hiring for.");
  if (post.type === "photos") need(post.photos.length >= 1, "ann-photo", "Add at least 1 photo.");
  else need(post.caption.length >= CAPTION_MIN, "ann-text", post.caption ? `The caption needs at least ${CAPTION_MIN} characters.` : "Add a caption.");
  return errors;
}

// The live preview shows placeholders where the owner has not typed yet
export function previewPost(post: Post): Post {
  switch (post.type) {
    case "new":
      return post.new.item ? post : { ...post, new: { ...post.new, item: "Your item name" } };
    case "promo":
      return post.promo.title ? post : { ...post, promo: { ...post.promo, title: "Your title" } };
    case "event":
      return post.event.title ? post : { ...post, event: { ...post.event, title: "Your title" } };
    case "hiring":
      return post.hiring.role ? post : { ...post, hiring: { ...post.hiring, role: "The role you are hiring for" } };
    case "photos":
      return post;
  }
}

// "A promo post can have up to 1 photo, so 2 were not added."
export function photoOverflowNote(type: PostType, dropped: number): string {
  const max = PHOTO_LIMITS[type].max;
  return `A ${TYPE_NAMES[type].toLowerCase()} post can have up to ${max} photo${max === 1 ? "" : "s"}, so ${dropped} ${dropped === 1 ? "was" : "were"} not added.`;
}
