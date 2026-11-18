// Pure logic behind the Map page, ported from the old app's map.js and
// geolocation.js. Leaflet itself lives in src/components/map/LeafletMap.tsx.

import type { Cafe, Place } from "@/data/types";
import { distanceKm, type LatLng } from "@/lib/board";

export const PLACE_ZOOM = 14;
export const CAFE_ZOOM = 17;
export const USER_ZOOM = 15;

// OpenStreetMap's standard tiles (the host is allowed in the CSP)
export const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// "from you" once the visitor shares their location, else the place centre
export function distanceFrom(place: Place, located: boolean): string {
  return located ? "from you" : `from ${place.name} centre`;
}

export type MarkerSpec = {
  id: number;
  lat: number;
  lng: number;
  name: string;
  label: string; // marker title and alt: "Kold Coffee (San Francisco)" elsewhere
  dimmed: boolean; // a café in another place: still shown, but dimmed
  meta: string; // "4.9 rating · 0.4 km from Butuan City centre"
  address: string;
  elsewhere: string | null; // "In San Francisco"
};

export function markerSpecs(cafes: readonly Cafe[], here: string, origin: LatLng, from: string): MarkerSpec[] {
  return cafes.map((cafe) => {
    const dimmed = cafe.city !== here;
    return {
      id: cafe.id,
      lat: cafe.lat,
      lng: cafe.lng,
      name: cafe.name,
      label: dimmed ? `${cafe.name} (${cafe.city})` : cafe.name,
      dimmed,
      meta: `${cafe.rating} rating · ${distanceKm(origin, cafe)} km ${from}`,
      address: cafe.address,
      elsewhere: dimmed ? `In ${cafe.city}` : null,
    };
  });
}

export type MapView = { lat: number; lng: number; zoom: number; openCafeId: number | null; key: string };

type ViewInput = {
  place: Place;
  focus: Cafe | null; // from /map?cafe=<id> (the café page's Directions)
  firstMatch: Cafe | null; // the first search result, while searching
  user: LatLng | null;
  locateCount: number; // bumps each time the visitor asks to go to their location
};

// Where the map looks. The newest intent wins: a search result, then the
// visitor's location, then the café from Directions, then the place.
// `key` changes whenever the map should move again.
export function mapView({ place, focus, firstMatch, user, locateCount }: ViewInput): MapView {
  if (firstMatch) return { lat: firstMatch.lat, lng: firstMatch.lng, zoom: CAFE_ZOOM, openCafeId: firstMatch.id, key: `search-${firstMatch.id}` };
  if (user && locateCount > 0) return { lat: user.lat, lng: user.lng, zoom: USER_ZOOM, openCafeId: null, key: `user-${locateCount}-${user.lat},${user.lng}` };
  if (focus) return { lat: focus.lat, lng: focus.lng, zoom: CAFE_ZOOM, openCafeId: focus.id, key: `cafe-${focus.id}` };
  return { lat: place.lat, lng: place.lng, zoom: PLACE_ZOOM, openCafeId: null, key: `place-${place.name}` };
}

// The strip above the map: where, how many cafés here, how far the nearest
export function geoSummary(place: Place, cafesHere: readonly Cafe[], origin: LatLng, user: LatLng | null) {
  const nearest = nearbyCafes(cafesHere, origin)[0];
  return {
    where: user ? `${user.lat.toFixed(4)}°N, ${user.lng.toFixed(4)}°E` : place.name,
    count: cafesHere.length,
    nearest: nearest ? `${distanceKm(origin, nearest)} km` : "–",
  };
}

// Cafés in the place, nearest first
export function nearbyCafes(cafesHere: readonly Cafe[], origin: LatLng): Cafe[] {
  return [...cafesHere].sort((a, b) => distanceKm(origin, a) - distanceKm(origin, b));
}
