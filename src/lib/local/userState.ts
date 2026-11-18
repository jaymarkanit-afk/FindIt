// The visitor's saved state, kept in localStorage under the old app's keys
// and in the old app's formats, so data saved by the old app keeps working:
//
//   findit.alerts      JSON number[]   café ids with alerts on (default [1, 2])
//   findit.keeps       JSON string[]   kept post ids
//   findit.savedCafes  JSON number[]   saved café ids
//   findit.sips        JSON string[]   post ids the visitor sipped
//   findit.cta         JSON string[]   post ids with Remind me / Apply set
//   findit.seen        JSON string[]   post ids already seen in Alerts
//   findit.comments    JSON Comment[]  { id, postId, authorName, text, createdAt }
//   findit.ownerPosts  JSON Post[]     posts published from Owner
//   findit.cafeEdits   JSON { [cafeId]: { backgroundPhoto?, featuredPhotos? } }
//   findit.postEdits   JSON { [postId]: changed fields | { deleted: true } }
//   findit.place       JSON string     selected place name
//   findit.theme       raw "light" | "dark"
//   findit.cafe        raw number      last café opened
//
// Reading never rewrites storage: values that fail validation fall back to
// the default in memory only, so nothing the old app saved is destroyed.

import { DEFAULT_PLACE } from "@/data/seed";
import type { CafeEdit, Comment, FeaturedPhoto, Post, PostEdit, Theme, UserState } from "@/data/types";
import { isRecord, normalizePost } from "@/lib/posts";
import { onExternalChange, readJSON, readRaw, writeJSON, writeRaw } from "./storage";

type Codec<T> = { read: () => T; write: (value: T) => boolean };
type Codecs = { [K in keyof UserState]: Codec<UserState[K]> };

function numberList(name: string, fallback: number[]): Codec<number[]> {
  return {
    read: () => {
      const value = readJSON(name);
      return Array.isArray(value) ? value.filter((item): item is number => typeof item === "number" && Number.isFinite(item)) : fallback;
    },
    write: (value) => writeJSON(name, value),
  };
}

function stringList(name: string): Codec<string[]> {
  return {
    read: () => {
      const value = readJSON(name);
      return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
    },
    write: (value) => writeJSON(name, value),
  };
}

function isComment(value: unknown): value is Comment {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.postId === "string" &&
    typeof value.authorName === "string" &&
    typeof value.text === "string" &&
    typeof value.createdAt === "string"
  );
}

// A featured photo: the old plain string, or { src, label? } once labelled
function toFeaturedPhoto(value: unknown): FeaturedPhoto | null {
  if (typeof value === "string") return value || null;
  if (!isRecord(value) || typeof value.src !== "string" || !value.src) return null;
  return typeof value.label === "string" && value.label ? { src: value.src, label: value.label } : { src: value.src };
}

function toCafeEdit(value: unknown): CafeEdit | null {
  if (!isRecord(value)) return null;
  const edit: CafeEdit = {};
  if (value.backgroundPhoto === null || typeof value.backgroundPhoto === "string") edit.backgroundPhoto = value.backgroundPhoto;
  if (Array.isArray(value.featuredPhotos))
    edit.featuredPhotos = value.featuredPhotos.map(toFeaturedPhoto).filter((photo): photo is FeaturedPhoto => photo !== null);
  for (const key of ["about", "phone", "facebook", "instagram"] as const) {
    const text = value[key];
    if (typeof text === "string") edit[key] = text;
  }
  const hours = value.hours;
  if (hours === null) edit.hours = null;
  else if (isRecord(hours) && typeof hours.open === "string" && typeof hours.close === "string") edit.hours = { open: hours.open, close: hours.close };
  return edit;
}

function recordOf<T>(name: string, toItem: (value: unknown) => T | null): Codec<Readonly<Record<string, T>>> {
  return {
    read: () => {
      const value = readJSON(name);
      if (!isRecord(value)) return {};
      const out: Record<string, T> = {};
      for (const [key, item] of Object.entries(value)) {
        const converted = toItem(item);
        if (converted !== null) out[key] = converted;
      }
      return out;
    },
    write: (value) => writeJSON(name, value),
  };
}

const codecs: Codecs = {
  alerts: numberList("alerts", [1, 2]),
  keeps: stringList("keeps"),
  savedCafes: numberList("savedCafes", []),
  sips: stringList("sips"),
  cta: stringList("cta"),
  seen: stringList("seen"),
  comments: {
    read: () => {
      const value = readJSON("comments");
      return Array.isArray(value) ? value.filter(isComment) : [];
    },
    write: (value) => writeJSON("comments", value),
  },
  ownerPosts: {
    // Older owner posts are converted to the current shape, as the old
    // app did on load; ones that cannot be shown are skipped.
    read: () => {
      const value = readJSON("ownerPosts");
      return Array.isArray(value) ? value.map(normalizePost).filter((post): post is Post => post !== null) : [];
    },
    write: (value) => writeJSON("ownerPosts", value),
  },
  cafeEdits: recordOf("cafeEdits", toCafeEdit),
  postEdits: recordOf<PostEdit>("postEdits", (value) => (isRecord(value) ? value : null)),
  place: {
    read: () => {
      const value = readJSON("place");
      if (typeof value === "string" && value) return value;
      // An earlier build of the React app wrote the name without JSON quotes
      const raw = readRaw("place");
      return raw && !raw.startsWith('"') ? raw : DEFAULT_PLACE;
    },
    write: (value) => writeJSON("place", value),
  },
  theme: {
    // The old app stores the bare word, not JSON
    read: () => {
      const raw = readRaw("theme");
      return raw === "light" || raw === "dark" ? raw : null;
    },
    write: (value: Theme | null) => (value === null ? true : writeRaw("theme", value)),
  },
  lastCafe: {
    // Stored as String(id); "null" or junk means none
    read: () => {
      const id = Number(readRaw("cafe"));
      return Number.isInteger(id) && id > 0 ? id : null;
    },
    write: (value) => (value === null ? true : writeRaw("cafe", String(value))),
  },
};

export const DEFAULT_USER_STATE: UserState = Object.freeze({
  alerts: [1, 2],
  keeps: [],
  savedCafes: [],
  sips: [],
  cta: [],
  seen: [],
  comments: [],
  ownerPosts: [],
  cafeEdits: {},
  postEdits: {},
  place: DEFAULT_PLACE,
  theme: null,
  lastCafe: null,
});

export function loadUserState(): UserState {
  return {
    alerts: codecs.alerts.read(),
    keeps: codecs.keeps.read(),
    savedCafes: codecs.savedCafes.read(),
    sips: codecs.sips.read(),
    cta: codecs.cta.read(),
    seen: codecs.seen.read(),
    comments: codecs.comments.read(),
    ownerPosts: codecs.ownerPosts.read(),
    cafeEdits: codecs.cafeEdits.read(),
    postEdits: codecs.postEdits.read(),
    place: codecs.place.read(),
    theme: codecs.theme.read(),
    lastCafe: codecs.lastCafe.read(),
  };
}

/* ── Store for useSyncExternalStore ─────────────────────────── */

let snapshot: UserState | null = null;
const listeners = new Set<() => void>();
let stopExternal: (() => void) | null = null;

function emit() {
  for (const listener of listeners) listener();
}

export function getUserStateSnapshot(): UserState {
  if (typeof window === "undefined") return DEFAULT_USER_STATE;
  snapshot ??= loadUserState();
  return snapshot;
}

export function getServerUserState(): UserState {
  return DEFAULT_USER_STATE;
}

export function subscribeUserState(listener: () => void): () => void {
  listeners.add(listener);
  stopExternal ??= onExternalChange(() => {
    snapshot = loadUserState();
    emit();
  });
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && stopExternal) {
      stopExternal();
      stopExternal = null;
    }
  };
}

function writeKey<K extends keyof UserState>(key: K, value: UserState[K]): boolean {
  return codecs[key].write(value);
}

function writeChange<K extends keyof UserState>(key: K, changes: Partial<UserState>): boolean {
  const value = changes[key];
  return value === undefined || writeKey(key, value);
}

const KEYS: ReadonlyArray<keyof UserState> = Object.keys(DEFAULT_USER_STATE).filter(
  (key): key is keyof UserState => key in DEFAULT_USER_STATE,
);

// Saves the changed keys. Returns false when storage refused a write (full
// or blocked); the in-memory state then re-reads storage, so it always
// matches what is actually saved.
export function commitUserState(changes: Partial<UserState>): boolean {
  const ok = KEYS.every((key) => writeChange(key, changes));
  snapshot = ok ? { ...getUserStateSnapshot(), ...changes } : loadUserState();
  emit();
  return ok;
}

// Tests only: forget the cached snapshot so the next read hits storage
export function resetUserStateCache(): void {
  snapshot = null;
}
