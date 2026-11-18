// The app's only data entry point. Components read and write through these
// functions and never import src/data or touch localStorage themselves, so
// a backend (Supabase) can replace what is behind them later.
//
// Today: the catalog is the seed in src/data/seed.ts, and everything the
// visitor or the demo owner does is saved in this browser's localStorage
// (see src/lib/local/userState.ts). Nothing is shared between visitors.
// Mutations are async now so their signatures can stay the same once they
// call a server.

import { cafes as seedCafes, DEFAULT_PLACE, places as seedPlaces, posts as seedPosts } from "@/data/seed";
import type { Cafe, CafeEdit, Comment, Place, Post, PostEdit, PostType, Theme, UserState } from "@/data/types";
import { commitUserState, getServerUserState, getUserStateSnapshot, subscribeUserState } from "@/lib/local/userState";
import { allPosts, applyCafeEdits, livePosts } from "@/lib/posts";

export type { Cafe, CafeEdit, Comment, Place, Post, PostEdit, PostType, Theme, UserState };

/* ── Catalog (server-safe) ─────────────────────────────────── */

// The cookie the server reads to render the selected place
export const PLACE_COOKIE = "findit.place";

export async function listPlaces(): Promise<Place[]> {
  return seedPlaces;
}

export async function listCafes(): Promise<Cafe[]> {
  return seedCafes;
}

export async function getCafe(id: number): Promise<Cafe | undefined> {
  return seedCafes.find((cafe) => cafe.id === id);
}

// Seed posts only; local owner posts and edits are added on the client
// with visiblePosts()
export async function listPosts(): Promise<Post[]> {
  return seedPosts;
}

// The place with this name, or the default place
export async function getPlace(name: string | undefined): Promise<Place> {
  return findPlace(name);
}

function findPlace(name: string | undefined): Place {
  return (
    seedPlaces.find((place) => place.name === name) ??
    seedPlaces.find((place) => place.name === DEFAULT_PLACE) ??
    seedPlaces[0]
  );
}

/* ── What the visitor sees (catalog + saved local changes) ─── */

export function visibleCafes(cafes: readonly Cafe[], state: UserState): Cafe[] {
  return applyCafeEdits(cafes, state.cafeEdits);
}

// Live posts with owner posts and edits applied, newest first. Pass the
// board's `today` (see boardDay) so the server and browser agree on which
// promos and events have ended.
export function visiblePosts(posts: readonly Post[], state: UserState, today?: string): Post[] {
  return livePosts(allPosts(posts, state.ownerPosts, state.postEdits), today);
}

// Every post including drafts and ended ones (owner dashboard)
export function ownerVisiblePosts(posts: readonly Post[], state: UserState): Post[] {
  return allPosts(posts, state.ownerPosts, state.postEdits);
}

/* ── Saved visitor state (client) ──────────────────────────── */

// For useSyncExternalStore (see src/lib/hooks.ts)
export const userStateStore = {
  subscribe: subscribeUserState,
  getSnapshot: getUserStateSnapshot,
  getServerSnapshot: getServerUserState,
};

function toggled<T>(list: readonly T[], item: T): T[] {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
}

// Each toggle resolves to whether the item is now on
export async function toggleSip(postId: string): Promise<boolean> {
  commitUserState({ sips: toggled(getUserStateSnapshot().sips, postId) });
  return getUserStateSnapshot().sips.includes(postId);
}

export async function toggleKeep(postId: string): Promise<boolean> {
  commitUserState({ keeps: toggled(getUserStateSnapshot().keeps, postId) });
  return getUserStateSnapshot().keeps.includes(postId);
}

// "Remind me" (events) and "Apply" (hiring); only recorded locally
export async function toggleCta(postId: string): Promise<boolean> {
  commitUserState({ cta: toggled(getUserStateSnapshot().cta, postId) });
  return getUserStateSnapshot().cta.includes(postId);
}

export async function toggleAlerts(cafeId: number): Promise<boolean> {
  commitUserState({ alerts: toggled(getUserStateSnapshot().alerts, cafeId) });
  return getUserStateSnapshot().alerts.includes(cafeId);
}

export async function toggleSavedCafe(cafeId: number): Promise<boolean> {
  commitUserState({ savedCafes: toggled(getUserStateSnapshot().savedCafes, cafeId) });
  return getUserStateSnapshot().savedCafes.includes(cafeId);
}

export async function markSeen(postIds: readonly string[]): Promise<boolean> {
  const seen = getUserStateSnapshot().seen;
  const fresh = postIds.filter((id) => !seen.includes(id));
  return fresh.length === 0 || commitUserState({ seen: [...seen, ...fresh] });
}

export const COMMENT_MAX = 280;
// There are no customer accounts yet, so local comments are signed "Guest"
export const LOCAL_AUTHOR_NAME = "Guest";

// Resolves to the new comment, or null when the text is empty or storage is full
export async function addComment(postId: string, text: string, authorName: string = LOCAL_AUTHOR_NAME): Promise<Comment | null> {
  const clean = text.trim().slice(0, COMMENT_MAX);
  if (!clean) return null;
  const comment: Comment = {
    id: `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    postId,
    authorName,
    text: clean,
    createdAt: new Date().toISOString(),
  };
  return commitUserState({ comments: [...getUserStateSnapshot().comments, comment] }) ? comment : null;
}

export function commentsFor(state: UserState, postId: string): Comment[] {
  return state.comments.filter((comment) => comment.postId === postId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// Saves the place (localStorage, as the old app did, plus a cookie so the
// server renders it). Resolves to false for an unknown place.
export async function setPlace(name: string): Promise<boolean> {
  if (!seedPlaces.some((place) => place.name === name)) return false;
  document.cookie = `${PLACE_COOKIE}=${encodeURIComponent(name)}; Path=/; Max-Age=31536000; SameSite=Lax`;
  commitUserState({ place: name });
  return true;
}

// The place saved in this browser (by this app or the old one), if valid
export function savedPlace(state: UserState): Place {
  return findPlace(state.place);
}

export async function setTheme(theme: Theme): Promise<boolean> {
  return commitUserState({ theme });
}

export async function setLastCafe(cafeId: number): Promise<boolean> {
  return commitUserState({ lastCafe: cafeId });
}

/* ── Demo owner (local only; becomes server calls with accounts) ── */

export const FEATURED_MAX = 6;

// Publishes a new owner post (newest first, as the old app stored them)
export async function publishOwnerPost(post: Post): Promise<boolean> {
  return commitUserState({ ownerPosts: [post, ...getUserStateSnapshot().ownerPosts] });
}

// Changes a post: owner posts in place, seed posts through postEdits.
// Resolves to false, changing nothing, when storage is full.
export async function updatePost(id: string, changes: PostEdit): Promise<boolean> {
  return commitUserState(postChanges(getUserStateSnapshot(), id, changes));
}

function postChanges(state: UserState, id: string, changes: PostEdit): Partial<UserState> {
  if (state.ownerPosts.some((post) => post.id === id)) {
    // Changes go through the same checks as stored posts; invalid ones are ignored
    return {
      ownerPosts: state.ownerPosts.map((post) => (post.id === id ? allPosts([post], [], { [id]: changes })[0] ?? post : post)),
    };
  }
  return { postEdits: { ...state.postEdits, [id]: { ...state.postEdits[id], ...changes } } };
}

// Removes a post and everything tied to it (keeps, sips, reminders, seen, comments)
export async function removePost(id: string): Promise<boolean> {
  const state = getUserStateSnapshot();
  const isOwnerPost = state.ownerPosts.some((post) => post.id === id);
  return commitUserState({
    ...(isOwnerPost
      ? { ownerPosts: state.ownerPosts.filter((post) => post.id !== id) }
      : { postEdits: { ...state.postEdits, [id]: { deleted: true } } }),
    keeps: state.keeps.filter((value) => value !== id),
    sips: state.sips.filter((value) => value !== id),
    cta: state.cta.filter((value) => value !== id),
    seen: state.seen.filter((value) => value !== id),
    comments: state.comments.filter((comment) => comment.postId !== id),
  });
}

// One pinned post per café
export async function setPinned(id: string, on: boolean): Promise<boolean> {
  const state = getUserStateSnapshot();
  const posts = ownerVisiblePosts(seedPosts, state);
  const post = posts.find((item) => item.id === id);
  if (!post) return false;
  const others = posts.filter((item) => item.cafeId === post.cafeId && item.pinned && item.id !== id);
  const next = [...others.map((item) => ({ id: item.id, pinned: false })), { id, pinned: on }].reduce<UserState>(
    (current, change) => ({ ...current, ...postChanges(current, change.id, { pinned: change.pinned }) }),
    state,
  );
  return commitUserState({ ownerPosts: next.ownerPosts, postEdits: next.postEdits });
}

// Saves { backgroundPhoto } and/or { featuredPhotos } for a café
export async function saveCafeEdit(cafeId: number, changes: CafeEdit): Promise<boolean> {
  const state = getUserStateSnapshot();
  const key = String(cafeId);
  return commitUserState({ cafeEdits: { ...state.cafeEdits, [key]: { ...state.cafeEdits[key], ...changes } } });
}
