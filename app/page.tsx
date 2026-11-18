import { cookies } from "next/headers";
import { connection } from "next/server";
import { getPlace, listCafes, listPosts, PLACE_COOKIE, requestTime } from "@/lib/api";
import { boardDay } from "@/lib/posts";
import { TodayBoard } from "@/components/TodayBoard";

export default async function HomePage() {
  await connection(); // "x min ago" and Brevi use the request time
  const placeCookie = (await cookies()).get(PLACE_COOKIE)?.value;
  const [place, cafes, posts] = await Promise.all([getPlace(placeCookie), listCafes(), listPosts()]);
  const now = requestTime();
  return <TodayBoard place={place} cafes={cafes} posts={posts} today={boardDay(new Date(now))} now={now} />;
}
