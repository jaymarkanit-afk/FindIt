"use client";

import Link from "next/link";
import { useState } from "react";
import { CafeTile } from "@/components/board/CafeTile";
import { Icon } from "@/components/Icon";
import { Overlay } from "@/components/overlay/Overlay";
import { markSeen, visibleCafes, visiblePosts, type Cafe, type Post } from "@/lib/api";
import { alertPosts, alertsShown, badgeText, timeAgo, unreadAlerts } from "@/lib/board";
import { useNow, useUserState } from "@/lib/hooks";
import { postHeadline, type BoardDay } from "@/lib/posts";
import styles from "./shell.module.css";

const TYPE_LABELS: Record<Post["type"], string> = { new: "New", photos: "Photos", event: "Event", hiring: "Hiring", promo: "Promo" };

type Props = { cafes: readonly Cafe[]; posts: readonly Post[]; today: BoardDay; now: number };

// The bell: a badge with the number of new updates from cafés with alerts
// on, and a side panel listing them. Opening the panel marks them seen (the
// badge clears) while this opening still shows which ones were new.
export function Alerts({ cafes, posts, today, now: serverNow }: Props) {
  const state = useUserState();
  const [open, setOpen] = useState(false);
  const [newIds, setNewIds] = useState<ReadonlySet<string>>(new Set());
  const now = useNow(serverNow);

  const live = visiblePosts(posts, state, today.iso);
  const unread = unreadAlerts(live, state.alerts, state.seen);
  const cafeById = new Map(visibleCafes(cafes, state).map((cafe) => [cafe.id, cafe]));
  const items = alertsShown(live, state.alerts);

  function openPanel() {
    setNewIds(new Set(unread.map((post) => post.id)));
    setOpen(true);
    void markSeen(alertPosts(live, state.alerts).map((post) => post.id));
  }

  return (
    <>
      <button
        type="button"
        className={`icon-btn ${styles.bell}`}
        aria-label={unread.length ? `Alerts, ${unread.length} new` : "Alerts"}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={openPanel}
      >
        <Icon name="bell" />
        {unread.length > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {badgeText(unread.length)}
          </span>
        )}
      </button>
      <Overlay open={open} onClose={() => setOpen(false)} title="Alerts" variant="side">
        {items.length ? (
          <ul className={styles.notifList}>
            {items.map((post) => {
              const cafe = cafeById.get(post.cafeId);
              if (!cafe) return null;
              const isNew = newIds.has(post.id);
              return (
                <li key={post.id}>
                  <Link className={`${styles.notifRow} ${isNew ? styles.unread : ""}`} href={`/cafe/${cafe.id}`} onClick={() => setOpen(false)}>
                    <CafeTile cafe={cafe} size="sm" />
                    <span className={styles.notifBody}>
                      <span className={styles.notifName}>{cafe.name}</span>
                      <span className={styles.notifMsg}>{postHeadline(post)}</span>
                      <span className={styles.notifMeta}>
                        {TYPE_LABELS[post.type]} · {cafe.city} · {timeAgo(post.time, now)}
                        {isNew ? " · New" : ""}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={styles.notifEmpty}>Tap &ldquo;Get alerts&rdquo; on a café to see its updates here.</p>
        )}
      </Overlay>
    </>
  );
}
