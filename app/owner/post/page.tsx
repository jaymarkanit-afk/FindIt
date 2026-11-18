import type { Metadata } from "next";
import { connection } from "next/server";
import { Composer } from "@/components/owner/Composer";
import { getCafe, getPlace, listCafes, listPosts, OWNER_CAFE_ID, requestTime } from "@/lib/api";

export const metadata: Metadata = { title: "Post an update" };

export default async function NewPost() {
  await connection(); // the preview's "Just now" uses the request time
  const [cafes, posts, cafe] = await Promise.all([listCafes(), listPosts(), getCafe(OWNER_CAFE_ID)]);
  const place = await getPlace(cafe?.city);
  return <Composer cafes={cafes} place={place} posts={posts} now={requestTime()} postId={null} />;
}
