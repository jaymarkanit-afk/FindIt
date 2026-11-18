"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { CafeTile } from "@/components/board/CafeTile";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/shell/Toast";
import { toggleKeep, toggleSavedCafe, visibleCafes, visiblePosts, type Cafe, type Post, type PostType } from "@/lib/api";
import { cafeStreet, timeAgo } from "@/lib/board";
import { useNow, useUserState } from "@/lib/hooks";
import { imageUrl, postHeadline, type BoardDay } from "@/lib/posts";
import { keptPosts, savedCafes } from "@/lib/saved";
import styles from "./saved.module.css";

const TYPE_LABELS: Record<PostType, string> = { new: "New", photos: "Photos", event: "Event", hiring: "Hiring", promo: "Promo" };

type Props = { cafes: Cafe[]; posts: Post[]; today: BoardDay; now: number };

// The Saved page, as the old Saved panel: saved cafés and kept updates from
// every place (each row says where), with the old empty states. Each row
// can be removed here too; focus then moves to the list's heading.
export function SavedView({ cafes, posts, today, now: serverNow }: Props) {
  const state = useUserState();
  const now = useNow(serverNow);
  const toast = useToast();
  const cafesHeading = useRef<HTMLHeadingElement>(null);
  const keptHeading = useRef<HTMLHeadingElement>(null);

  const allCafes = visibleCafes(cafes, state);
  const cafeById = new Map(allCafes.map((cafe) => [cafe.id, cafe]));
  const saved = savedCafes(allCafes, state.savedCafes);
  const kept = keptPosts(visiblePosts(posts, state, today.iso), state.keeps);

  async function unsave(cafe: Cafe) {
    await toggleSavedCafe(cafe.id);
    toast("Removed from Saved");
    cafesHeading.current?.focus();
  }

  async function unkeep(post: Post) {
    await toggleKeep(post.id);
    toast("Removed from Saved");
    keptHeading.current?.focus();
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>Saved</h1>
        <p className={styles.intro}>Cafés you saved and updates you kept.</p>
      </header>

      <section className={styles.section} aria-labelledby="saved-cafes-h">
        <h2 className={styles.secLabel} id="saved-cafes-h" ref={cafesHeading} tabIndex={-1}>
          Cafés
        </h2>
        {saved.length ? (
          <ul className={styles.list}>
            {saved.map((cafe) => (
              <li key={cafe.id} className={styles.item}>
                <Link className={styles.row} href={`/cafe/${cafe.id}`}>
                  <Image className={styles.thumb} src={imageUrl(cafe.img)} alt="" width={46} height={46} />
                  <span className={styles.info}>
                    <span className={styles.name}>{cafe.name}</span>
                    <span className={styles.sub}>
                      {cafeStreet(cafe)} · {cafe.city}
                    </span>
                  </span>
                  <span className={styles.chip}>{cafe.rating} rating</span>
                </Link>
                <button type="button" className={`icon-btn ${styles.remove}`} aria-label={`Remove ${cafe.name} from Saved`} onClick={() => void unsave(cafe)}>
                  <Icon name="close" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>No saved cafés yet. Tap the bookmark on a café&rsquo;s page.</p>
        )}
      </section>

      <section className={styles.section} aria-labelledby="saved-posts-h">
        <h2 className={styles.secLabel} id="saved-posts-h" ref={keptHeading} tabIndex={-1}>
          Kept updates
        </h2>
        {kept.length ? (
          <ul className={styles.list}>
            {kept.map((post) => {
              const cafe = cafeById.get(post.cafeId);
              if (!cafe) return null;
              const headline = postHeadline(post);
              return (
                <li key={post.id} className={styles.item}>
                  <Link className={styles.row} href={`/cafe/${cafe.id}`}>
                    <CafeTile cafe={cafe} />
                    <span className={styles.info}>
                      <span className={styles.name}>{headline}</span>
                      <span className={styles.sub}>
                        {cafe.name} · {cafe.city} · <time dateTime={new Date(post.time).toISOString()}>{timeAgo(post.time, now)}</time>
                      </span>
                    </span>
                    <span className={`${styles.tagChip} ${styles[`tag_${post.type}`]}`}>{TYPE_LABELS[post.type]}</span>
                  </Link>
                  <button type="button" className={`icon-btn ${styles.remove}`} aria-label={`Remove ${headline} from Saved`} onClick={() => void unkeep(post)}>
                    <Icon name="close" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={styles.empty}>Nothing kept yet. Tap Keep on anything on the board.</p>
        )}
      </section>
    </div>
  );
}
