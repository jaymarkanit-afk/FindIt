import { cookies } from "next/headers";
import { getPlace, listCafes, listPosts, PLACE_COOKIE } from "@/lib/api";
import { boardDay } from "@/lib/posts";
import { TodayBoard } from "@/components/TodayBoard";

export default async function HomePage() {
  const placeCookie = (await cookies()).get(PLACE_COOKIE)?.value;
  const [place, cafes, posts] = await Promise.all([getPlace(placeCookie), listCafes(), listPosts()]);
  return <TodayBoard place={place} cafes={cafes} posts={posts} today={boardDay()} />;
}
