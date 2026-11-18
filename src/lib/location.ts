// The visitor's location, from the browser, for this tab only. As in the
// old app (geolocation.js) it is never saved: sharing it again after a
// reload is the visitor's choice each time.

import type { LatLng } from "@/lib/board";

let location: LatLng | null = null;
const listeners = new Set<() => void>();

export function subscribeLocation(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getLocation = () => location;
export const getServerLocation = (): LatLng | null => null;

function setLocation(next: LatLng | null) {
  location = next;
  for (const listener of listeners) listener();
}

export type LocateResult = { ok: true; location: LatLng } | { ok: false; message: string };

const GEO_OPTIONS: PositionOptions = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };

// The old app's messages for each kind of failure
export function locateErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return "Location access denied. Enable it in your browser settings.";
    case 2:
      return "Location unavailable. Please try again.";
    case 3:
      return "Location request timed out. Please try again.";
    default:
      return "Unable to get your location.";
  }
}

export function locate(): Promise<LocateResult> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return Promise.resolve({ ok: false, message: "Location is not supported on this device." });
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = { lat: position.coords.latitude, lng: position.coords.longitude };
        setLocation(next);
        resolve({ ok: true, location: next });
      },
      (error) => resolve({ ok: false, message: locateErrorMessage(error.code) }),
      GEO_OPTIONS,
    );
  });
}

// Tests only
export function resetLocation(): void {
  setLocation(null);
}
