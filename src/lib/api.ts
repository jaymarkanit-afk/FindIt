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
import type { Cafe, CafeEdit, Comment, Place, Post, PostEdit, PostPhoto, PostStatus, PostType, Theme, UserState } from "@/data/types";
import { commitUserState, getServerUserState, getUserStateSnapshot, subscribeUserState } from "@/lib/local/userState";
import { getLocation, getServerLocation, locate, subscribeLocation, type LocateResult } from "@/lib/location";
import { getOwnerSession, getServerOwnerSession, signIn as signInOwner, signOut as signOutOwner, subscribeOwnerSession } from "@/lib/ownerSession";
import { checkDetails, storedHighlights, type DetailsError, type DetailsInput, type Highlight } from "@/lib/cafe";
import { buildPost, validatePost, type ComposerForm, type FieldError } from "@/lib/composer";
import { allPosts, applyCafeEdits, livePosts } from "@/lib/posts";

export type { LocateResult };

export type { Cafe, CafeEdit, Comment, Place, Post, PostEdit, PostPhoto, PostStatus, PostType, Theme, UserState };

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

// The time of the current request, for server renders that show relative
// times ("5 min ago"). Call after `await connection()` in the page.
export function requestTime(): number {
  return Date.now();
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

// Comments are signed "Guest", except the signed-in owner replying on their
// own café's posts, who signs as the café (the old commentAuthorFor())
export function commentAuthorFor(postId: string): string {
  if (!getOwnerSession()) return LOCAL_AUTHOR_NAME;
  const post = ownerVisiblePosts(seedPosts, getUserStateSnapshot()).find((item) => item.id === postId);
  const cafe = post && post.cafeId === OWNER_CAFE_ID ? seedCafes.find((item) => item.id === OWNER_CAFE_ID) : undefined;
  return cafe ? cafe.name : LOCAL_AUTHOR_NAME;
}

// Resolves to the new comment, or null when the text is empty or storage is full
export async function addComment(postId: string, text: string, authorName: string = commentAuthorFor(postId)): Promise<Comment | null> {
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

/* ── The visitor's location (browser geolocation, this tab only) ── */

// For useSyncExternalStore (see useVisitorLocation in src/lib/hooks.ts)
export const visitorLocationStore = {
  subscribe: subscribeLocation,
  getSnapshot: getLocation,
  getServerSnapshot: getServerLocation,
};

// Asks the browser for the visitor's position. Resolves to the location,
// or to a message saying why it is not available.
export async function locateVisitor(): Promise<LocateResult> {
  return locate();
}

/* ── Demo owner (local only; becomes server calls with accounts) ── */

// The demo owner always posts as Paramount Coffee, as in the old app
export const OWNER_CAFE_ID = 1;

// The demo sign-in: any email and password, kept in memory for this tab
// (a reload signs out). See src/lib/ownerSession.ts.
export const ownerSessionStore = {
  subscribe: subscribeOwnerSession,
  getSnapshot: getOwnerSession,
  getServerSnapshot: getServerOwnerSession,
};

// Resolves to false (still signed out) when either field is empty
export async function ownerSignIn(email: string, password: string): Promise<boolean> {
  if (!email.trim() || !password) return false;
  signInOwner();
  return true;
}

export async function ownerSignOut(): Promise<void> {
  signOutOwner();
}

// The owner's post with this id (seed or owner post, edits applied), if it
// belongs to the owner's café
export function ownerPost(state: UserState, id: string): Post | undefined {
  return ownerVisiblePosts(seedPosts, state).find((post) => post.id === id && post.cafeId === OWNER_CAFE_ID);
}

export type SaveResult = { ok: true; id: string } | { ok: false; errors: FieldError[]; storageFull: boolean };

// Saves the composer's post: a new owner post, or changes to the one being
// edited (owner posts in place, seed posts through postEdits, as before).
// Publishing checks the required fields first; a draft is saved as it is.
// With "Send alerts now" off, the post is marked seen so it skips the bell.
export async function saveComposedPost(
  form: ComposerForm,
  { editingId, asDraft, alertNow }: { editingId: string | null; asDraft: boolean; alertNow: boolean },
): Promise<SaveResult> {
  const state = getUserStateSnapshot();
  const original = editingId ? ownerPost(state, editingId) : undefined;
  const now = Date.now();
  const built = buildPost(form, {
    id: original?.id ?? `o${now}`,
    cafeId: OWNER_CAFE_ID,
    time: original?.time ?? now,
    sips: original?.sips ?? 0,
    pinned: asDraft ? false : (original?.pinned ?? false),
    eventDay: original?.type === "event" ? original.event.day : undefined,
  });
  const post: Post = { ...built, ...(asDraft ? { status: "draft" as const } : {}), ...(original ? { editedAt: now } : {}) };
  if (!asDraft) {
    const errors = validatePost(post);
    if (errors.length) return { ok: false, errors, storageFull: false };
  }
  const saved = original ? await updatePost(original.id, withoutId(post)) : await publishOwnerPost(post);
  if (!saved) return { ok: false, errors: [], storageFull: true };
  if (!asDraft && !alertNow) await markSeen([post.id]);
  return { ok: true, id: post.id };
}

function withoutId(post: Post): PostEdit {
  const { id: _id, ...fields } = post;
  return fields;
}

// Saves the café's highlights in upload order (at most six), in the stored
// shape of findit.cafeEdits: plain strings, or { src, label } when labelled
export async function saveHighlights(cafeId: number, list: readonly Highlight[]): Promise<boolean> {
  return saveCafeEdit(cafeId, { featuredPhotos: storedHighlights(list.slice(0, FEATURED_MAX)) });
}

export type DetailsResult = { ok: true } | { ok: false; errors: DetailsError[]; storageFull: boolean };

// Saves About, phone, Facebook, Instagram and hours (the Edit page fields),
// after checking them; links must be http(s) on facebook.com / instagram.com
export async function saveCafeDetails(cafeId: number, input: DetailsInput): Promise<DetailsResult> {
  const { details, errors } = checkDetails(input);
  if (errors.length) return { ok: false, errors, storageFull: false };
  return (await saveCafeEdit(cafeId, details)) ? { ok: true } : { ok: false, errors: [], storageFull: true };
}

// Ends a live post now: it moves to Ended and is no longer pinned
export async function endPost(id: string): Promise<boolean> {
  return updatePost(id, { status: "ended", endedAt: Date.now(), pinned: false });
}

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
