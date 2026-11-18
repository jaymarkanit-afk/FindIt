"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";
import { PlacePicker } from "@/components/PlacePicker";
import { getOpenOverlayCount, getServerOpenOverlayCount, subscribeOverlays } from "@/components/overlay/overlayStore";
import type { Place } from "@/lib/api";
import { useAdoptSavedPlace, useUserState } from "@/lib/hooks";
import { BottomNav } from "./BottomNav";
import { ThemeToggle } from "./ThemeToggle";
import { ToastProvider } from "./Toast";
import styles from "./shell.module.css";

type Props = { place: Place; places: Place[]; hasPlaceCookie: boolean; children: ReactNode };

// Top bar, page, bottom nav and toast. While an overlay is open everything
// here except the toast is inert, so focus and screen readers stay in it.
export function AppShell({ place, places, hasPlaceCookie, children }: Props) {
  const overlayOpen = useSyncExternalStore(subscribeOverlays, getOpenOverlayCount, getServerOpenOverlayCount) > 0;
  const state = useUserState();
  useAdoptSavedPlace(place, hasPlaceCookie, state);

  return (
    <ToastProvider>
      <div className={styles.app} inert={overlayOpen}>
        <a className={styles.skip} href="#main">
          Skip to content
        </a>
        <header className={styles.topbar}>
          <Link className={styles.brand} href="/">
            FindIt
          </Link>
          <div className={styles.topActions}>
            <PlacePicker value={place.name} places={places} />
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
