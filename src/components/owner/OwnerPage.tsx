"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/shell/Toast";
import { OWNER_CAFE_ID, ownerSignOut, ownerVisiblePosts, visibleCafes, type Cafe, type Post, type PostStatus } from "@/lib/api";
import { useNow, useOwnerSession, useUserState } from "@/lib/hooks";
import { commentsToAnswer, postsByStatus } from "@/lib/owner";
import type { BoardDay } from "@/lib/posts";
import { CommentsToAnswer } from "./CommentsToAnswer";
import { FeaturedPhotos } from "./FeaturedPhotos";
import { OwnerGate } from "./OwnerGate";
import { ProfileCard } from "./ProfileCard";
import { PublishBar, type PublishNotice } from "./PublishBar";
import { YourPosts } from "./YourPosts";
import styles from "./owner.module.css";

// What the composer hands back in the address (/owner?tab=…&post=…)
export type ReturnFromComposer = {
  tab: PostStatus;
  postId: string | null; // the saved post: its Edit button gets focus
  notice: PublishNotice | null; // the "On the board" bar
  focusCompose: boolean; // after Cancel: focus "Post an update"
};

type Props = { cafes: Cafe[]; posts: Post[]; today: BoardDay; now: number; returned?: ReturnFromComposer | null };

// /owner: the demo sign-in, then the dashboard (profile card, featured
// photos, your posts, comments to answer), as the old Owner panel
export function OwnerPage({ cafes, posts, today, now: serverNow, returned = null }: Props) {
  const router = useRouter();
  const signedIn = useOwnerSession();
  const state = useUserState();
  const now = useNow(serverNow);
  const toast = useToast();
  const [tab, setTab] = useState<PostStatus>(returned?.tab ?? "live");

  // Once the dashboard has used the address, tidy it (a reload then shows
  // the plain dashboard, not the "On the board" bar again)
  useEffect(() => {
    if (returned) router.replace("/owner", { scroll: false });
  }, [returned, router]);

  if (!signedIn) return <OwnerGate />;

  const cafe = visibleCafes(cafes, state).find((item) => item.id === OWNER_CAFE_ID);
  if (!cafe) return null;
  const own = ownerVisiblePosts(posts, state).filter((post) => post.cafeId === cafe.id);
  const groups = postsByStatus(own, cafe.id, today.iso);

  async function signOut() {
    await ownerSignOut();
    toast("Signed out");
  }

  return (
    <div className={styles.dash}>
      <div className={styles.grid}>
        <div className={styles.main}>
          <ProfileCard cafe={cafe} liveCount={groups.live.length} focusCompose={returned?.focusCompose ?? false} />
          <FeaturedPhotos cafe={cafe} />
          <YourPosts groups={groups} state={state} now={now} tab={tab} onTab={setTab} focusPostId={returned?.postId ?? null} />
        </div>
        <aside className={styles.rail} aria-labelledby="answer-h">
          <CommentsToAnswer items={commentsToAnswer(state.comments, own, cafe.name)} cafeId={cafe.id} today={today.iso} />
          <div>
            <button type="button" className="btn btn-quiet" onClick={() => void signOut()}>
              <Icon name="logout" />
              Sign out
            </button>
          </div>
        </aside>
      </div>
      <PublishBar notice={returned?.notice ?? null} />
    </div>
  );
}
