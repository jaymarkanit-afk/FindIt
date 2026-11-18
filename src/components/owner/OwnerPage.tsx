"use client";

import { useState } from "react";
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
import { YourPosts } from "./YourPosts";
import styles from "./owner.module.css";

type Props = {
  cafes: Cafe[];
  posts: Post[];
  today: BoardDay;
  now: number;
  initialTab?: PostStatus; // after the composer: the tab of the saved post
  focusPostId?: string | null;
};

// /owner: the demo sign-in, then the dashboard (profile card, featured
// photos, your posts, comments to answer), as the old Owner panel
export function OwnerPage({ cafes, posts, today, now: serverNow, initialTab = "live", focusPostId = null }: Props) {
  const signedIn = useOwnerSession();
  const state = useUserState();
  const now = useNow(serverNow);
  const toast = useToast();
  const [tab, setTab] = useState<PostStatus>(initialTab);

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
          <ProfileCard cafe={cafe} liveCount={groups.live.length} />
          <FeaturedPhotos cafe={cafe} />
          <YourPosts groups={groups} state={state} now={now} tab={tab} onTab={setTab} focusPostId={focusPostId} />
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
    </div>
  );
}
