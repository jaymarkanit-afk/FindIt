"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { setPlace, type Place } from "@/lib/api";

export function PlacePicker({ value, places }: { value: string; places: readonly Place[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(value);

  function changePlace(next: string) {
    startTransition(async () => {
      setShown(next);
      if (await setPlace(next)) router.refresh();
    });
  }

  return (
    <label className="location">
      <span>Showing cafés near</span>
      <select aria-label="Choose a place" value={shown} disabled={pending} onChange={(event) => changePlace(event.target.value)}>
        {places.map((place) => (
          <option key={place.name} value={place.name}>
            {place.name}
          </option>
        ))}
      </select>
    </label>
  );
}
