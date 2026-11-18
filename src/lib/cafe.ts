// Pure logic for the café page, ported from the old app's profile.js and
// store.js (opening hours). No storage and no React.

import type { Cafe, Post } from "@/data/types";
import { CAFE_TIME_ZONE } from "@/lib/posts";

// Minutes since midnight in the cafés' (Manila) time
export function cafeMinutes(now: number, timeZone: string = CAFE_TIME_ZONE): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date(now));
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return (get("hour") % 24) * 60 + get("minute");
}

export const FEATURED_MAX = 6;
// With more featured photos than this, the Photos row gets "See all"
export const PHOTO_ROW_LIMIT = 3;

/* ── Photos: each one at most once on the page ────────────────── */

export type CafePagePhotos = {
  banner: string | null; // the background photo, never the logo
  posts: Post[]; // the board's posts, minus photos already shown above them
  featured: string[]; // the Photos row, minus anything shown anywhere else
};

// Decides where every photo on the café page goes, so none shows twice.
// In page order: the logo (info card) and the banner come first; then
// each post keeps its photos unless an earlier part of the page already
// shows them; the Photos row gets the featured photos that are left.
export function cafePagePhotos(cafe: Cafe, posts: readonly Post[]): CafePagePhotos {
  const banner = cafe.backgroundPhoto && cafe.backgroundPhoto !== cafe.logo ? cafe.backgroundPhoto : null;
  const used = new Set([cafe.logo, banner].filter((src): src is string => Boolean(src)));
  const take = (src: string) => {
    if (!src || used.has(src)) return false;
    used.add(src);
    return true;
  };
  const shownPosts = posts.map((post) => {
    const photos = post.photos.filter((photo) => take(photo.src));
    return photos.length === post.photos.length ? post : { ...post, photos };
  });
  const featured = cafe.featuredPhotos.filter(take).slice(0, FEATURED_MAX);
  return { banner, posts: shownPosts, featured };
}

export function featuredAlt(cafe: Cafe, index: number): string {
  return `${cafe.name} featured photo ${index + 1}`;
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
