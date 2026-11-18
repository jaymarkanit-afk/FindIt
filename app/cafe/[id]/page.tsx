import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CafeProfile } from "@/components/cafe/CafeProfile";
import { RememberCafe } from "@/components/RememberCafe";
import { getCafe, getPlace, listPosts, requestTime, type Cafe } from "@/lib/api";
import { boardDay } from "@/lib/posts";

type Props = { params: Promise<{ id: string }> };

async function cafeFor(params: Props["params"]): Promise<Cafe | undefined> {
  const { id } = await params;
  return /^\d+$/.test(id) ? getCafe(Number(id)) : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cafe = await cafeFor(params);
  return cafe ? { title: cafe.name, description: `${cafe.name}, ${cafe.address}` } : { title: "Café not found" };
}

export default async function CafePage({ params }: Props) {
  const cafe = await cafeFor(params);
  if (!cafe) notFound();
  await connection(); // "x min ago" and the open status use the request time
  const [place, posts] = await Promise.all([getPlace(cafe.city), listPosts()]);
  const now = requestTime();
  return (
    <>
      <RememberCafe id={cafe.id} />
      <CafeProfile cafe={cafe} place={place} posts={posts} today={boardDay(new Date(now))} now={now} />
    </>
  );
}
