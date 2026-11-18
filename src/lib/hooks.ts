"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ownerSessionStore, savedPlace, setPlace, userStateStore, visitorLocationStore, type Place, type UserState } from "@/lib/api";
import type { LatLng } from "@/lib/board";
import { getBoardView, getServerBoardView, subscribeBoardView, type BoardView } from "@/lib/boardView";

// Whether the demo owner is signed in (memory only: a reload signs out)
export function useOwnerSession(): boolean {
  return useSyncExternalStore(ownerSessionStore.subscribe, ownerSessionStore.getSnapshot, ownerSessionStore.getServerSnapshot);
}

// The visitor's location once they have shared it (this tab only)
export function useVisitorLocation(): LatLng | null {
  return useSyncExternalStore(visitorLocationStore.subscribe, visitorLocationStore.getSnapshot, visitorLocationStore.getServerSnapshot);
}

// The board's search text and filter (see src/lib/boardView.ts)
export function useBoardView(): BoardView {
  return useSyncExternalStore(subscribeBoardView, getBoardView, getServerBoardView);
}

// A clock for "5 min ago" labels and Brevi. Starts from the server's time
// so the first client render matches, then ticks once a minute.
export function useNow(serverNow: number): number {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// The visitor's saved state. The server render and the first client render
// use the defaults, so there is no hydration mismatch; saved values appear
// right after.
export function useUserState(): UserState {
  return useSyncExternalStore(userStateStore.subscribe, userStateStore.getSnapshot, userStateStore.getServerSnapshot);
}

// A visitor coming from the old app has a saved place but no cookie yet.
// Adopt the saved place once, then re-render on the server with it.
export function useAdoptSavedPlace(rendered: Place, hasCookie: boolean, state: UserState): void {
  const router = useRouter();
  const saved = savedPlace(state).name;
  useEffect(() => {
    if (hasCookie || saved === rendered.name) return;
    void setPlace(saved).then((ok) => {
      if (ok) router.refresh();
    });
  }, [hasCookie, saved, rendered.name, router]);
}
