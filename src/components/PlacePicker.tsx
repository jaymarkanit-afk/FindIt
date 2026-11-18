"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { Overlay } from "@/components/overlay/Overlay";
import { useToast } from "@/components/shell/Toast";
import { setPlace, type Place } from "@/lib/api";
import styles from "./shell/shell.module.css";

// The location pill: opens a sheet listing the places. Choosing one saves it
// (localStorage + server cookie), re-renders the page for it and confirms
// with a toast, as the old place menu did.
export function PlacePicker({ value, places }: { value: string; places: readonly Place[] }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(value);

  function choose(name: string) {
    setOpen(false);
    if (name === value) return;
    startTransition(async () => {
      setShown(name);
      if (await setPlace(name)) {
        router.refresh();
        toast(`Showing ${name}`);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        className={styles.placeBtn}
        aria-label={`Place: ${shown}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Icon name="pin" />
        <span className={styles.placeLabel}>{shown}</span>
      </button>
      <Overlay open={open} onClose={() => setOpen(false)} title="Choose a place">
        <p className={styles.placeHint}>Show cafés and posts near:</p>
        <ul className={styles.placeList}>
          {places.map((place) => {
            const current = place.name === shown;
            return (
              <li key={place.name}>
                <button
                  type="button"
                  className={styles.placeOption}
                  aria-current={current ? "true" : undefined}
                  data-autofocus={current ? "" : undefined}
                  onClick={() => choose(place.name)}
                >
                  <span>
                    <span className={styles.placeName}>{place.name}</span>
                    <span className={styles.placeProvince}>{place.province}</span>
                  </span>
                  {current && <Icon name="check" />}
                </button>
              </li>
            );
          })}
        </ul>
      </Overlay>
    </>
  );
}
