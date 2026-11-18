import { cookies } from "next/headers";
import { getPlace, listCafes, listPlaces, listPosts, PLACE_COOKIE } from "@/lib/api";
import { boardDay } from "@/lib/posts";
import { TodayBoard } from "@/components/TodayBoard";

export default async function HomePage() {
  const cookieStore = await cookies();
  const placeCookie = cookieStore.get(PLACE_COOKIE)?.value;
  const [place, places, cafes, posts] = await Promise.all([getPlace(placeCookie), listPlaces(), listCafes(), listPosts()]);
  return (
    <TodayBoard
      place={place}
      hasPlaceCookie={placeCookie !== undefined}
      places={places}
      cafes={cafes}
      posts={posts}
      today={boardDay()}
    />
  );
}
