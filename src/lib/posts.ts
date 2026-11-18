// Pure post and café logic, ported from the old app's js/store.js.
// No storage, no React: everything here takes data in and returns data.

import {
  POST_STATUSES,
  POST_TYPES,
  type Cafe,
  type CafeEdit,
  type Post,
  type PostDetails,
  type PostEdit,
  type PostPhoto,
  type PostStatus,
  type PostType,
} from "@/data/types";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function isPostType(value: unknown): value is PostType {
  return typeof value === "string" && (POST_TYPES as readonly string[]).includes(value);
}

function isPostStatus(value: unknown): value is PostStatus {
  return typeof value === "string" && (POST_STATUSES as readonly string[]).includes(value);
}

// A post's photos as [{ src, alt? }]. Accepts plain strings and the single
// `photo` field that older saved posts used.
export function normalizePhotos(photos: unknown, legacyPhoto?: unknown): PostPhoto[] {
  if (!Array.isArray(photos)) return typeof legacyPhoto === "string" && legacyPhoto ? [{ src: legacyPhoto }] : [];
  return photos.flatMap((photo): PostPhoto[] => {
    if (typeof photo === "string") return photo ? [{ src: photo }] : [];
    if (!isRecord(photo) || typeof photo.src !== "string" || !photo.src) return [];
    return typeof photo.alt === "string" && photo.alt ? [{ src: photo.src, alt: photo.alt }] : [{ src: photo.src }];
  });
}

// Bring any stored post (owner posts saved by older versions use older
// field names) to the current shape. Returns null for anything that cannot
// be shown, as the old normalizePost() did.
export function normalizePost(raw: unknown): Post | null {
  if (!isRecord(raw) || !isPostType(raw.type)) return null;
  const cafeId = finiteNumber(raw.cafeId);
  if (typeof raw.id !== "string" || !raw.id || !cafeId) return null;

  const details = raw.type === "hiring" && !isRecord(raw.hiring) ? raw.job : raw[raw.type];
  if (raw.type !== "photos" && !isRecord(details)) return null;
  const d = isRecord(details) ? details : {};

  const base = {
    id: raw.id,
    cafeId,
    time: finiteNumber(raw.time) ?? 0,
    sips: finiteNumber(raw.sips) ?? 0,
    caption: typeof raw.caption === "string" ? raw.caption : text(d.description),
    photos: normalizePhotos(raw.photos, raw.photo),
    status: isPostStatus(raw.status) ? raw.status : "live",
    pinned: typeof raw.pinned === "boolean" ? raw.pinned : false,
    endedAt: finiteNumber(raw.endedAt) ?? null,
    ...(finiteNumber(raw.editedAt) !== undefined ? { editedAt: finiteNumber(raw.editedAt) } : {}),
  };

  switch (raw.type) {
    case "photos":
      return { ...base, type: "photos" };
    case "new":
      return { ...base, type: "new", new: { item: text(d.item), price: text(d.price), availability: text(d.availability) } };
    case "event":
      return {
        ...base,
        type: "event",
        event: {
          title: text(d.title),
          day: text(d.day),
          time: text(d.time),
          price: text(d.price),
          ...(typeof d.date === "string" && d.date ? { date: d.date } : {}),
        },
      };
    case "promo":
      return { ...base, type: "promo", promo: { title: text(d.title), offer: text(d.offer), validUntil: text(d.validUntil) } };
    case "hiring":
      return { ...base, type: "hiring", hiring: { role: text(d.role), schedule: text(d.schedule), perks: text(d.perks) } };
  }
}

// The type-specific part of a post, or null for "photos" posts
export function postData(post: Post): PostDetails | null {
  switch (post.type) {
    case "photos":
      return null;
    case "new":
      return post.new;
    case "event":
      return post.event;
    case "promo":
      return post.promo;
    case "hiring":
      return post.hiring;
  }
}

// "YYYY-MM-DD" for a date in local time
export function localISODate(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Every café is in the Philippines, so "today" on the board is Manila's
// date, whatever the server's or visitor's clock says
export const CAFE_TIME_ZONE = "Asia/Manila";

export type BoardDay = { iso: string; label: string };

// { iso: "2026-11-18", label: "Wednesday, 18 November" } for the board heading
export function boardDay(now: Date = new Date(), timeZone: string = CAFE_TIME_ZONE): BoardDay {
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    new Intl.DateTimeFormat("en-GB", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(now)
      .find((p) => p.type === type)?.value ?? "";
  // Built from two parts, as the old app did (js/feed.js renderTodayHeading),
  // because the joined en-GB pattern differs between ICU versions
  const weekday = new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "long" }).format(now);
  const dayMonth = new Intl.DateTimeFormat("en-GB", { timeZone, day: "numeric", month: "long" }).format(now);
  const label = `${weekday}, ${dayMonth}`;
  return { iso: `${part("year")}-${part("month")}-${part("day")}`, label };
}

// "live" | "draft" | "ended". Events and promos end once their date passes.
export function postStatus(post: Post, today: string = localISODate()): PostStatus {
  if (post.status === "draft" || post.status === "ended") return post.status;
  const until = post.type === "event" ? post.event.date ?? "" : post.type === "promo" ? post.promo.validUntil : "";
  return until && until < today ? "ended" : "live";
}

// One-line name for a post: the menu item, event or promo title, or role.
// Photos posts use the first line of the caption, or "3 photos".
export function postHeadline(post: Post): string {
  switch (post.type) {
    case "new":
      if (post.new.item) return post.new.item;
      break;
    case "event":
      if (post.event.title) return post.event.title;
      break;
    case "promo":
      if (post.promo.title) return post.promo.title;
      break;
    case "hiring":
      if (post.hiring.role) return post.hiring.role;
      break;
    case "photos": {
      const first = post.caption.trim().split("\n")[0];
      if (first) return first.length > 60 ? `${first.slice(0, 57).trim()}…` : first;
      return post.photos.length === 1 ? "1 photo" : `${post.photos.length} photos`;
    }
  }
  return "Update";
}

// "Sat, 21 Nov" from "2026-11-21"; "" when the date is missing or invalid
export function formatShortDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const date = new Date(`${iso}T00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

// "FRI 7 PM · Free" style detail line for a post, or ""
export function postDetails(post: Post): string {
  const parts: string[] = (() => {
    switch (post.type) {
      case "new":
        return [post.new.price, post.new.availability];
      case "event":
        return [[post.event.day, post.event.time].filter(Boolean).join(" "), post.event.price];
      case "promo":
        return [post.promo.offer, post.promo.validUntil ? `Valid until ${formatShortDate(post.promo.validUntil)}` : ""];
      case "hiring":
        return [post.hiring.schedule, post.hiring.perks];
      case "photos":
        return [];
    }
  })();
  return parts.filter(Boolean).join(" · ");
}

// Alt text: what the owner typed, otherwise "<Café name> photo N"
export function postPhotoAlt(post: Post, index: number, cafe: Cafe | undefined): string {
  const alt = post.photos[index]?.alt?.trim();
  return alt || `${cafe ? cafe.name : "Café"} photo ${index + 1}`;
}

// Seed count plus the visitor's own sip
export function sipCount(post: Post, sips: readonly string[]): number {
  return post.sips + (sips.includes(post.id) ? 1 : 0);
}

// Every post with saved owner edits applied (drafts and ended ones
// included), owner posts first in the merge, newest first.
export function allPosts(seed: readonly Post[], ownerPosts: readonly Post[], postEdits: Readonly<Record<string, PostEdit>>): Post[] {
  const edited = seed.flatMap((post): Post[] => {
    const edit = postEdits[post.id];
    if (!edit) return [post];
    if (edit.deleted === true) return [];
    return [normalizePost({ ...post, ...edit, id: post.id, cafeId: post.cafeId }) ?? post];
  });
  return [...ownerPosts, ...edited].sort((a, b) => b.time - a.time);
}

// What customers see: live posts only
export function livePosts(posts: readonly Post[], today: string = localISODate()): Post[] {
  return posts.filter((post) => postStatus(post, today) === "live");
}

// The owner's saved background and featured photos replace the seed ones
export function applyCafeEdits(cafes: readonly Cafe[], cafeEdits: Readonly<Record<string, CafeEdit>>): Cafe[] {
  return cafes.map((cafe) => {
    const edit = cafeEdits[String(cafe.id)];
    return edit ? { ...cafe, ...edit } : cafe;
  });
}

// Image paths in the data are relative ("Images/…"); pages need them rooted.
// Remote and data: URLs (uploaded photos) pass through unchanged.
export function imageUrl(path: string): string {
  return /^(https?:|data:|blob:|\/)/.test(path) ? path : `/${path}`;
}
