import type { Metadata } from "next";
import { connection } from "next/server";
import { SavedView } from "@/components/saved/SavedView";
import { listCafes, listPosts, requestTime } from "@/lib/api";
import { boardDay } from "@/lib/posts";

export const metadata: Metadata = { title: "Saved" };

export default async function SavedPage() {
  await connection(); // "x ago" labels use the request time
  const [cafes, posts] = await Promise.all([listCafes(), listPosts()]);
  const now = requestTime();
  return <SavedView cafes={cafes} posts={posts} today={boardDay(new Date(now))} now={now} />;
}
