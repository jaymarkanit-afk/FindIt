// Pure logic for the café page, ported from the old app's profile.js and
// store.js (opening hours). No storage and no React.

import type { Cafe, CafeDetails, FeaturedPhoto, Post } from "@/data/types";
import { CAFE_TIME_ZONE } from "@/lib/posts";

// Minutes since midnight in the cafés' (Manila) time
export function cafeMinutes(now: number, timeZone: string = CAFE_TIME_ZONE): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date(now));
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return (get("hour") % 24) * 60 + get("minute");
}

export const FEATURED_MAX = 6;
export const HIGHLIGHT_LABEL_MAX = 14;

/* ── Highlights (featured photos with an optional label) ──────── */

export type Highlight = { src: string; label: string };

// The café's highlights in upload order, labels filled in ("" for the
// old, unlabelled entries); repeats and empty entries are dropped
export function highlightsOf(cafe: Cafe): Highlight[] {
  const seen = new Set<string>();
  const out: Highlight[] = [];
  for (const photo of cafe.featuredPhotos) {
    const item = typeof photo === "string" ? { src: photo, label: "" } : { src: photo.src, label: photo.label ?? "" };
    if (!item.src || seen.has(item.src)) continue;
    seen.add(item.src);
    out.push(item);
  }
  return out;
}

// Back to the stored shape: a plain string when there is no label (the old
// shape), { src, label } when there is one
export function storedHighlights(list: readonly Highlight[]): FeaturedPhoto[] {
  return list.map((item) => {
    const label = cleanLabel(item.label);
    return label ? { src: item.src, label } : item.src;
  });
}

export function cleanLabel(label: string): string {
  return label.trim().slice(0, HIGHLIGHT_LABEL_MAX);
}

export function highlightAlt(cafe: Cafe, item: Highlight, index: number): string {
  return item.label || `${cafe.name} highlight ${index + 1}`;
}

export function highlightCountText(count: number): string {
  return `${count} of ${FEATURED_MAX}`;
}

/* ── Photos: each one at most once on the page ────────────────── */

export type CafePagePhotos = {
  banner: string | null; // the background photo, never the logo
  highlights: Highlight[]; // every featured photo (not the logo or banner), up to six
  posts: Post[]; // the board's posts, without photos the page already shows
};

// Decides where every photo on the café page goes, so none shows twice.
// The logo and the banner come first, and the Highlights row has priority
// over the cards: it always shows every featured photo (each once, never
// the logo or the banner). A card then shows only photos that appear
// nowhere else on the page, and is drawn without the photo otherwise.
export function cafePagePhotos(cafe: Cafe, posts: readonly Post[]): CafePagePhotos {
  const banner = cafe.backgroundPhoto && cafe.backgroundPhoto !== cafe.logo ? cafe.backgroundPhoto : null;
  const used = new Set([cafe.logo, banner].filter((src): src is string => Boolean(src)));
  const highlights = highlightsOf(cafe)
    .filter((item) => !used.has(item.src))
    .slice(0, FEATURED_MAX);
  for (const item of highlights) used.add(item.src);
  const shownPosts = posts.map((post) => {
    const photos = post.photos.filter((photo) => {
      if (!photo.src || used.has(photo.src)) return false;
      used.add(photo.src);
      return true;
    });
    return photos.length === post.photos.length ? post : { ...post, photos };
  });
  return { banner, highlights, posts: shownPosts };
}

/* ── The café's details (About and contact, chosen by the owner) ── */

export const ABOUT_MAX = 150;
const SOCIAL_HOSTS = { facebook: "facebook.com", instagram: "instagram.com" } as const;
export type Social = keyof typeof SOCIAL_HOSTS;

// The link, if it is http(s) and on facebook.com / instagram.com (or a
// subdomain such as m.facebook.com); otherwise null
export function safeSocialUrl(value: string | undefined, kind: Social): string | null {
  const text = (value ?? "").trim();
  if (!text) return null;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  const domain = SOCIAL_HOSTS[kind];
  return host === domain || host.endsWith(`.${domain}`) ? url.href : null;
}

const PHONE_RE = /^\+?[0-9(][0-9 ()-]{4,18}[0-9]$/;

// "tel:+639170000000" from "+63 917 000 0000", or null if it is not a phone number
export function telHref(phone: string | undefined): string | null {
  const text = (phone ?? "").trim();
  if (!PHONE_RE.test(text)) return null;
  return `tel:${text.replace(/[^\d+]/g, "")}`;
}

export type DetailsInput = { about: string; phone: string; facebook: string; instagram: string; open: string; close: string };
export type DetailsError = { field: keyof DetailsInput; message: string };

export function detailsInputOf(cafe: Cafe): DetailsInput {
  return {
    about: cafe.about ?? "",
    phone: cafe.phone ?? "",
    facebook: cafe.facebook ?? "",
    instagram: cafe.instagram ?? "",
    open: cafe.hours?.open ?? "",
    close: cafe.hours?.close ?? "",
  };
}

// Checks and tidies the Edit page fields. Every field is optional.
export function checkDetails(input: DetailsInput): { details: CafeDetails; errors: DetailsError[] } {
  const errors: DetailsError[] = [];
  const about = input.about.trim().slice(0, ABOUT_MAX);
  const phone = input.phone.trim();
  if (phone && !telHref(phone)) errors.push({ field: "phone", message: "Use a phone number: digits, spaces, +, - and brackets only." });
  const social = (kind: Social) => {
    const text = input[kind].trim();
    if (!text) return "";
    const safe = safeSocialUrl(text, kind);
    if (!safe) errors.push({ field: kind, message: `Use a link to ${SOCIAL_HOSTS[kind]} that starts with https://` });
    return safe ?? "";
  };
  const facebook = social("facebook");
  const instagram = social("instagram");
  const valid = (value: string) => /^\d{2}:\d{2}$/.test(value);
  let hours: CafeDetails["hours"] = null;
  if (input.open || input.close) {
    if (valid(input.open) && valid(input.close)) hours = { open: input.open, close: input.close };
    else errors.push({ field: input.open ? "close" : "open", message: "Add both opening and closing times, or leave both empty." });
  }
  return { details: { about, phone, facebook, instagram, hours }, errors };
}

// The café's posts for its page: the pinned one first, then newest first
export function cafeBoard(posts: readonly Post[], cafeId: number): Post[] {
  return posts.filter((post) => post.cafeId === cafeId).sort((a, b) => Number(b.pinned) - Number(a.pinned));
}

/* ── Rating ───────────────────────────────────────────────────── */

// "4.9 · 312 reviews", or null for "No reviews yet"
export function ratingText(cafe: Cafe): string | null {
  return cafe.reviews > 0 && cafe.rating ? `${cafe.rating} · ${cafe.reviews} reviews` : null;
}

/* ── Opening hours (only when the data has them) ─────────────── */

function minutesOf(hhmm: string | undefined): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm ?? "");
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

// "7 AM", "9:30 PM"
export function clockLabel(hhmm: string): string {
  const mins = minutesOf(hhmm);
  if (mins === null) return "";
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "AM" : "PM"}`;
}

// { open, label } or null when the café has no hours. A close earlier than
// open means past midnight. `minutesNow` is minutes since midnight.
export function openStatus(cafe: Cafe, minutesNow: number): { open: boolean; label: string } | null {
  const open = minutesOf(cafe.hours?.open);
  const close = minutesOf(cafe.hours?.close);
  if (open === null || close === null || !cafe.hours) return null;
  const isOpen = close > open ? minutesNow >= open && minutesNow < close : minutesNow >= open || minutesNow < close;
  return isOpen
    ? { open: true, label: `Open now · Closes ${clockLabel(cafe.hours.close)}` }
    : { open: false, label: `Closed · Opens ${clockLabel(cafe.hours.open)}` };
}

// "7 AM – 9 PM, every day", or ""
export function hoursLabel(cafe: Cafe): string {
  if (!cafe.hours || minutesOf(cafe.hours.open) === null || minutesOf(cafe.hours.close) === null) return "";
  return `${clockLabel(cafe.hours.open)} – ${clockLabel(cafe.hours.close)}, every day`;
}
