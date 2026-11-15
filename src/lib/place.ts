import { defaultPlace, places, type Place } from "@/data/cafes";

export const PLACE_COOKIE = "findit.place";
export function placeFromName(name: string | undefined): Place {
  return places.find((place) => place.name === name) ?? defaultPlace;
}
