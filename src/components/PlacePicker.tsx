"use client";

import { useState } from "react";
import { places } from "@/data/cafes";
import { PLACE_COOKIE } from "@/lib/place";

export function PlacePicker({ value }: { value: string }) {
  const [selected, setSelected] = useState(value);
  function changePlace(next: string) {
    setSelected(next);
    document.cookie = `${PLACE_COOKIE}=${encodeURIComponent(next)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    window.localStorage.setItem(PLACE_COOKIE, next);
    window.location.reload();
  }
  return (
    <label className="location">
      <span>Showing cafés near</span>
      <select aria-label="Choose a place" value={selected} onChange={(event) => changePlace(event.target.value)}>
        {places.map((place) => <option key={place.name} value={place.name}>{place.name}</option>)}
      </select>
    </label>
  );
}
