"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { savedPlace, setPlace, userStateStore, type Place, type UserState } from "@/lib/api";

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
