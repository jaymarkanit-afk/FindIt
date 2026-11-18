// Pure logic behind the Today board, ported from the old app's filter.js,
// search.js, geolocation.js (distances), main.js (Brevi) and feed.js
// (alerts, rail, captions, time labels). No storage and no React.

import type { Cafe, Comment, Place, Post, PostType } from "@/data/types";
import { CAFE_TIME_ZONE, sipCount } from "@/lib/posts";

/* ── Distances (from the place centre until location sharing exists) ── */

// Haversine distance in km, to one decimal, as calculateDistance() did
export function distanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(to.lat - from.lat);
  const dLng = rad(to.lng - from.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return Number((6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}

// "from Butuan City centre" (becomes "from you" with location sharing)
export function distanceFromLabel(place: Place): string {
  return `from ${place.name} centre`;
}

export function cafeStreet(cafe: Cafe): string {
  return cafe.address.split(",")[0];
}

export function cafeInitials(cafe: Cafe): string {
  return cafe.name
    .split(/\s+/)
    .filter((word) => /^[A-Za-z0-9]/.test(word))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

/* ── Filters (the board's segmented control and the filter drawer) ── */

export const BOARD_FILTERS = [
  { key: "all", label: "All cafés", short: "All", icon: "cup" },
  { key: "findItNearMe", label: "Near me", short: "Near me", icon: "pin" },
  { key: "findItTrending", label: "Trending", short: "Trending", icon: "flame" },
  { key: "findItTopRated", label: "Top rated", short: "Top rated", icon: "star" },
  { key: "findItNew", label: "New", short: "New", icon: "spark" },
  { key: "findItPhotos", label: "Photos", short: "Photos", icon: "camera" },
  { key: "findItPromo", label: "Promos", short: "Promos", icon: "tag" },
  { key: "findItEvents", label: "Events", short: "Events", icon: "calendar" },
  { key: "findItJob", label: "Hiring", short: "Hiring", icon: "briefcase" },
] as const;

export type BoardFilter = (typeof BOARD_FILTERS)[number]["key"];

// The board's segmented control (the drawer has all of BOARD_FILTERS)
export const SEGMENT_FILTERS: readonly BoardFilter[] = ["all", "findItNew", "findItPhotos", "findItPromo", "findItEvents", "findItJob"];

export const FILTER_POST_TYPE: Partial<Record<BoardFilter, PostType>> = {
  findItNew: "new",
  findItPhotos: "photos",
  findItPromo: "promo",
  findItEvents: "event",
  findItJob: "hiring",
};

export function filterLabel(filter: BoardFilter, form: "label" | "short" = "label"): string {
  return BOARD_FILTERS.find((item) => item.key === filter)?.[form] ?? "All";
}

const NEAR_ME_KM = 10;
const TRENDING_DAYS = 7;
const TRENDING_MAX = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

// Each post from the last week counts 1 plus its sips; with nothing from the
// last week, the same score over all posts, so the list is never empty
export function trendingScores(posts: readonly Post[], sips: readonly string[], now: number): Map<number, number> {
  const recent = posts.filter((post) => post.time >= now - TRENDING_DAYS * DAY_MS);
  const scores = new Map<number, number>();
  for (const post of recent.length ? recent : posts) {
    scores.set(post.cafeId, (scores.get(post.cafeId) ?? 0) + 1 + sipCount(post, sips));
  }
  return scores;
}

// One-letter queries are ignored (too noisy), as in the old app
export function searchTerm(raw: string): string {
  const cleaned = raw.toLowerCase().trim();
  return cleaned.length >= 2 ? cleaned : "";
}

export function cafeMatches(cafe: Cafe, term: string): boolean {
  return (
    cafe.name.toLowerCase().includes(term) ||
    cafe.address.toLowerCase().includes(term) ||
    cafe.tags.some((tag) => tag.toLowerCase().includes(term))
  );
}

export type LatLng = { lat: number; lng: number };

type FilterInput = {
  cafes: readonly Cafe[]; // cafés in the selected place (the map: every café)
  posts: readonly Post[]; // live posts
  origin: LatLng; // where distances are measured from (place centre or the visitor)
  filter: BoardFilter;
  term: string; // from searchTerm()
  sips: readonly string[];
  now: number;
};

// Cafés in the place that match the search and the filter (getFilteredCafes)
export function filteredCafes({ cafes, posts, origin, filter, term, sips, now }: FilterInput): Cafe[] {
  let list = term ? cafes.filter((cafe) => cafeMatches(cafe, term)) : [...cafes];
  const hasPost = (cafe: Cafe, type: PostType) => posts.some((post) => post.cafeId === cafe.id && post.type === type);
  switch (filter) {
    case "findItNearMe":
      list = list
        .filter((cafe) => distanceKm(origin, cafe) < NEAR_ME_KM)
        .sort((a, b) => distanceKm(origin, a) - distanceKm(origin, b));
      break;
    case "findItTrending": {
      const scores = trendingScores(posts, sips, now);
      list = list
        .filter((cafe) => scores.has(cafe.id))
        .sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0))
        .slice(0, TRENDING_MAX);
      break;
    }
    case "findItTopRated":
      list.sort((a, b) => b.rating - a.rating);
      break;
    default: {
      const type = FILTER_POST_TYPE[filter];
      if (type) list = list.filter((cafe) => hasPost(cafe, type));
    }
  }
  return list;
}

// Board posts: from the filtered cafés, and of the filter's type if it has one
export function boardPosts(posts: readonly Post[], cafes: readonly Cafe[], filter: BoardFilter): Post[] {
  const ids = new Set(cafes.map((cafe) => cafe.id));
  const type = FILTER_POST_TYPE[filter];
  return posts.filter((post) => ids.has(post.cafeId) && (!type || post.type === type));
}

/* ── Search results ───────────────────────────────────────────── */

export type ElsewhereGroup = { place: string; cafes: Cafe[] };

// Matches in other places, grouped by place, for "Found in …"
export function foundElsewhere(allCafes: readonly Cafe[], here: string, term: string): ElsewhereGroup[] {
  const matches = allCafes.filter((cafe) => cafe.city !== here && cafeMatches(cafe, term));
  return [...new Set(matches.map((cafe) => cafe.city))].map((place) => ({ place, cafes: matches.filter((cafe) => cafe.city === place) }));
}

// Enter in a search field opens the best match: this place first, then anywhere
export function bestMatch(allCafes: readonly Cafe[], here: string, raw: string): Cafe | undefined {
  const term = raw.toLowerCase().trim();
  if (!term) return undefined;
  const matches = allCafes.filter((cafe) => cafeMatches(cafe, term));
  return matches.find((cafe) => cafe.city === here) ?? matches[0];
}

/* ── Near you ─────────────────────────────────────────────────── */

const NEAR_MAX = 8;

export function nearYou(cafes: readonly Cafe[], place: Place): Cafe[] {
  return [...cafes].sort((a, b) => distanceKm(place, a) - distanceKm(place, b)).slice(0, NEAR_MAX);
}

/* ── Brevi ────────────────────────────────────────────────────── */

// The hour (0–23) in the cafés' time zone
export function cafeHour(now: number, timeZone: string = CAFE_TIME_ZONE): number {
  const hour = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "numeric", hourCycle: "h23" }).format(new Date(now));
  return Number(hour) % 24;
}

// Brevi's message: by time of day, suggesting the two best-rated cafés here
export function breviMessage(place: Place, cafes: readonly Cafe[], hour: number): string {
  const picks = [...cafes]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 2)
    .map((cafe) => cafe.name);
  if (!picks.length) return `No cafés listed in ${place.name} yet. Try another place from the location pill.`;
  const both = picks.length === 2 ? `${picks[0]} and ${picks[1]}` : picks[0];
  const verb = picks.length === 2 ? "are" : "is";
  if (hour >= 5 && hour < 11) return `Good morning! In ${place.name}, start with ${both}.`;
  if (hour >= 11 && hour < 17) return `Afternoon break? ${both} ${verb} worth a visit in ${place.name}.`;
  if (hour >= 17 && hour < 20) return `Golden hour in ${place.name}: ${both} ${verb} good for unwinding.`;
  return `Night owl? See what ${both} posted today in ${place.name}.`;
}

/* ── Alerts ───────────────────────────────────────────────────── */

const ALERTS_SHOWN = 8;

// Live posts from cafés with alerts on, newest first
export function alertPosts(posts: readonly Post[], alerts: readonly number[]): Post[] {
  return posts.filter((post) => alerts.includes(post.cafeId));
}

export function unreadAlerts(posts: readonly Post[], alerts: readonly number[], seen: readonly string[]): Post[] {
  return alertPosts(posts, alerts).filter((post) => !seen.includes(post.id));
}

export function alertsShown(posts: readonly Post[], alerts: readonly number[]): Post[] {
  return alertPosts(posts, alerts).slice(0, ALERTS_SHOWN);
}

// "9+" past nine, as the old badge did
export function badgeText(count: number): string {
  return count > 9 ? "9+" : String(count);
}

/* ── Right rail ───────────────────────────────────────────────── */

const RAIL_MAX = 4;

export function railPosts(posts: readonly Post[], cafeIds: ReadonlySet<number>, type: "event" | "hiring"): Post[] {
  return posts.filter((post) => cafeIds.has(post.cafeId) && post.type === type).slice(0, RAIL_MAX);
}

/* ── Comments ─────────────────────────────────────────────────── */

export function commentCount(comments: readonly Comment[], postId: string): number {
  return comments.filter((comment) => comment.postId === postId).length;
}

/* ── Time labels ──────────────────────────────────────────────── */

// "Just now", "5 min ago", "3 hr ago", "2 days ago", then "Nov 14"
export function timeAgo(ts: number, now: number): string {
  const mins = Math.max(0, Math.round((now - ts) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return days === 1 ? "1 day ago" : `${days} days ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: CAFE_TIME_ZONE });
}

/* ── Captions: plain text with http(s) links ─────────────────── */

export type CaptionPart = { text: string } | { url: string };

const URL_RE = /https?:\/\/[^\s<>"']+/g;

// Splits a caption into text and links. Trailing punctuation stays outside
// the link ("…see https://x.com."), as in the old fillCaption().
export function captionParts(caption: string): CaptionPart[] {
  const parts: CaptionPart[] = [];
  let last = 0;
  for (const match of caption.matchAll(URL_RE)) {
    let url = match[0];
    const trail = /[.,;:!?)\]]+$/.exec(url);
    if (trail && !(trail[0].includes(")") && url.includes("("))) url = url.slice(0, -trail[0].length);
    const start = match.index ?? 0;
    if (start > last) parts.push({ text: caption.slice(last, start) });
    parts.push({ url });
    last = start + url.length;
  }
  if (last < caption.length) parts.push({ text: caption.slice(last) });
  return parts;
}
