import type { Metadata } from "next";
import { connection } from "next/server";
import { OwnerPage, type ReturnFromComposer } from "@/components/owner/OwnerPage";
import type { PublishNotice } from "@/components/owner/PublishBar";
import { listCafes, listPosts, requestTime } from "@/lib/api";
import { boardDay } from "@/lib/posts";

export const metadata: Metadata = { title: "Owner" };

type Search = { tab?: string; post?: string; notice?: string; focus?: string };
type Props = { searchParams: Promise<Search> };

const TABS = ["live", "draft", "ended"] as const;
const NOTICES: readonly PublishNotice[] = ["published", "published-alert", "updated"];

// The composer returns here with ?tab=…&post=…&notice=… (or ?focus=compose)
function fromComposer({ tab, post, notice, focus }: Search): ReturnFromComposer | null {
  if (!tab && !post && !notice && !focus) return null;
  return {
    tab: TABS.find((item) => item === tab) ?? "live",
    postId: typeof post === "string" && /^[a-z0-9]+$/i.test(post) ? post : null,
    notice: NOTICES.find((item) => item === notice) ?? null,
    focusCompose: focus === "compose",
  };
}

export default async function Owner({ searchParams }: Props) {
  await connection(); // "x ago" labels and Ended use the request time
  const [cafes, posts, search] = await Promise.all([listCafes(), listPosts(), searchParams]);
  const now = requestTime();
  return <OwnerPage cafes={cafes} posts={posts} today={boardDay(new Date(now))} now={now} returned={fromComposer(search)} />;
}
