// What the board is showing: the search text and the filter. Shared by the
// top-bar search, the phone search field, the segmented control and the
// filter drawer, so they always agree, as the old app's synced inputs did.
// Not saved: like the old app, a reload starts on "All" with no search.

import type { BoardFilter } from "@/lib/board";

export type BoardView = { search: string; filter: BoardFilter };

const INITIAL: BoardView = { search: "", filter: "all" };
let view: BoardView = INITIAL;
const listeners = new Set<() => void>();

function set(next: BoardView) {
  view = next;
  for (const listener of listeners) listener();
}

export function subscribeBoardView(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getBoardView = () => view;
export const getServerBoardView = () => INITIAL;

// Searching always looks across every café and post type
export function setBoardSearch(search: string): void {
  set({ search, filter: "all" });
}

// Choosing a filter clears the search
export function setBoardFilter(filter: BoardFilter): void {
  set({ search: "", filter });
}

// Tests only
export function resetBoardView(): void {
  set(INITIAL);
}
