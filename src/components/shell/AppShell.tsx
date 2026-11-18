"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { PlacePicker } from "@/components/PlacePicker";
import { SearchField } from "@/components/SearchField";
import { visibleCafes, type Cafe, type Place, type Post } from "@/lib/api";
import { useAdoptSavedPlace, useUserState } from "@/lib/hooks";
import type { BoardDay } from "@/lib/posts";
import { Alerts } from "./Alerts";
import { BottomNav } from "./BottomNav";
import { ThemeToggle } from "./ThemeToggle";
import { ToastProvider } from "./Toast";
import styles from "./shell.module.css";

type Props = {
  place: Place;
  places: Place[];
  hasPlaceCookie: boolean;
  cafes: Cafe[];
  posts: Post[];
  today: BoardDay;
  now: number;
  children: ReactNode;
};

// Top bar (place, search, alerts, theme), page, bottom nav and toast. While
// an overlay is open everything here except the toast is inert, so focus
// and screen readers stay in it.
export function AppShell({ place, places, hasPlaceCookie, cafes, posts, today, now, children }: Props) {
  const state = useUserState();
  useAdoptSavedPlace(place, hasPlaceCookie, state);

  return (
    <ToastProvider>
      {/* Overlays make this inert while they are open (see overlayStore) */}
      <div className={styles.app} data-app-root="">
        <a className={styles.skip} href="#main">
          Skip to content
        </a>
        <header className={styles.topbar}>
          <Link className={styles.brand} href="/">
            FindIt
          </Link>
          <PlacePicker value={place.name} places={places} />
          <div className={styles.topSearch}>
            <SearchField cafes={visibleCafes(cafes, state)} placeName={place.name} />
          </div>
          <div className={styles.topActions}>
            <Alerts cafes={cafes} posts={posts} today={today} now={now} />
            <ThemeToggle />
          </div>
        </header>
        <main id="main" className={styles.main} tabIndex={-1}>
          {children}
        </main>
        <BottomNav />
      </div>
    </ToastProvider>
  );
}
