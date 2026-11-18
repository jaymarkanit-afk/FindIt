import type { Metadata } from "next";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { MapView } from "@/components/map/MapView";
import { getPlace, listCafes, listPosts, PLACE_COOKIE, requestTime } from "@/lib/api";
import { boardDay } from "@/lib/posts";

export const metadata: Metadata = { title: "Map" };

type Props = { searchParams: Promise<{ cafe?: string | string[] }> };

export default async function MapPage({ searchParams }: Props) {
  await connection(); // the Trending filter and distances use the request time
  const [{ cafe }, cookieStore] = await Promise.all([searchParams, cookies()]);
  const [place, cafes, posts] = await Promise.all([getPlace(cookieStore.get(PLACE_COOKIE)?.value), listCafes(), listPosts()]);
  // /map?cafe=<id> from the café page's Directions; anything else is ignored
  const requested = typeof cafe === "string" && /^\d+$/.test(cafe) ? Number(cafe) : null;
  const focusCafeId = cafes.some((item) => item.id === requested) ? requested : null;
  const now = requestTime();
  return <MapView place={place} cafes={cafes} posts={posts} today={boardDay(new Date(now))} now={now} focusCafeId={focusCafeId} />;
}
