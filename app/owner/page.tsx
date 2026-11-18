import type { Metadata } from "next";
import { connection } from "next/server";
import { OwnerPage } from "@/components/owner/OwnerPage";
import { listCafes, listPosts, requestTime } from "@/lib/api";
import { boardDay } from "@/lib/posts";

export const metadata: Metadata = { title: "Owner" };

export default async function Owner() {
  await connection(); // "x ago" labels and Ended use the request time
  const [cafes, posts] = await Promise.all([listCafes(), listPosts()]);
  const now = requestTime();
  return <OwnerPage cafes={cafes} posts={posts} today={boardDay(new Date(now))} now={now} />;
}
