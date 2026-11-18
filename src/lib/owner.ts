// Pure logic behind the owner dashboard, ported from the old app's owner.js.
// No storage and no React.

import type { Cafe, Comment, Post, PostStatus } from "@/data/types";
import { postStatus } from "@/lib/posts";

export const FEATURED_LIMIT = 6;
export const STATUS_LABEL: Record<PostStatus, string> = { live: "Live", draft: "Draft", ended: "Ended" };

export const STORAGE_FULL_PHOTO =
  "This photo could not be saved: FindIt's storage in this browser is full. Your current photo is kept.";
export const STORAGE_FULL_DETAILS =
  "These details could not be saved: FindIt's storage in this browser is full. Remove a photo, then try again.";

// The café's posts by status; live ones with the pinned post first
export function postsByStatus(posts: readonly Post[], cafeId: number, today: string): Record<PostStatus, Post[]> {
  const groups: Record<PostStatus, Post[]> = { live: [], draft: [], ended: [] };
  for (const post of posts) if (post.cafeId === cafeId) groups[postStatus(post, today)].push(post);
  groups.live.sort((a, b) => Number(b.pinned) - Number(a.pinned));
  return groups;
}

// Keeps are only counted in this browser: the visitor's own keep, if any
export function keepCount(post: Post, keeps: readonly string[]): number {
  return keeps.includes(post.id) ? 1 : 0;
}

// The profile card's numbers: only ones that are actually tracked
export function dashStats(liveCount: number, cafe: Cafe): Array<{ value: string; label: string }> {
  const stats = [{ value: String(liveCount), label: liveCount === 1 ? "live post" : "live posts" }];
  if (cafe.rating) stats.push({ value: String(cafe.rating), label: cafe.reviews ? `rating · ${cafe.reviews} reviews` : "rating" });
  return stats;
}

// Customer comments on the café's posts with no café reply after them,
// newest first, at most eight
export function commentsToAnswer(comments: readonly Comment[], ownPosts: readonly Post[], cafeName: string): Array<{ comment: Comment; post: Post }> {
  const own = new Map(ownPosts.map((post) => [post.id, post]));
  return comments
    .filter((comment) => own.has(comment.postId) && comment.authorName !== cafeName)
    .filter(
      (comment) =>
        !comments.some((reply) => reply.postId === comment.postId && reply.authorName === cafeName && reply.createdAt > comment.createdAt),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8)
    .flatMap((comment) => {
      const post = own.get(comment.postId);
      return post ? [{ comment, post }] : [];
    });
}

// Moves one item; returns the list unchanged for a move off either end
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (from === to || to < 0 || to >= list.length || from < 0 || from >= list.length) return [...list];
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// Adds what fits under the limit; says how many did not fit
export function addUpTo<T>(list: readonly T[], added: readonly T[], limit: number): { list: T[]; dropped: number } {
  const room = Math.max(0, limit - list.length);
  return { list: [...list, ...added.slice(0, room)], dropped: Math.max(0, added.length - room) };
}

export function featuredCountText(count: number): string {
  return `${count} of ${FEATURED_LIMIT} · shown at the top of your page`;
}
