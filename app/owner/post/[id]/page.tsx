import type { Metadata } from "next";
import { connection } from "next/server";
import { Composer } from "@/components/owner/Composer";
import { getCafe, getPlace, listCafes, listPosts, OWNER_CAFE_ID, requestTime } from "@/lib/api";

export const metadata: Metadata = { title: "Edit post" };

type Props = { params: Promise<{ id: string }> };

// Owner posts live in this browser only, so an unknown id is handled in
// the browser (back to /owner) rather than with a server 404
export default async function EditPost({ params }: Props) {
  await connection();
  const [{ id }, cafes, posts, cafe] = await Promise.all([params, listCafes(), listPosts(), getCafe(OWNER_CAFE_ID)]);
  const place = await getPlace(cafe?.city);
  return <Composer cafes={cafes} place={place} posts={posts} now={requestTime()} postId={id} />;
}
