// Pure logic behind the Saved page, ported from the old app's renderSaved()
// (feed.js). No storage and no React.

import type { Cafe, Post } from "@/data/types";

// Saved cafés in the order they were saved; ids that no longer exist are skipped
export function savedCafes(cafes: readonly Cafe[], savedIds: readonly number[]): Cafe[] {
  const byId = new Map(cafes.map((cafe) => [cafe.id, cafe]));
  return savedIds.flatMap((id) => {
    const cafe = byId.get(id);
    return cafe ? [cafe] : [];
  });
}

// Kept updates that are still on the board (live), newest first. Kept posts
// that have ended or been removed drop out, as in the old app.
export function keptPosts(livePosts: readonly Post[], keeps: readonly string[]): Post[] {
  return livePosts.filter((post) => keeps.includes(post.id));
}
