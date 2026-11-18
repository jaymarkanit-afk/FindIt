"use client";

import Link from "next/link";
import { useState } from "react";
import { PostCard } from "@/components/board/PostCard";
import { Icon } from "@/components/Icon";
import { PhotoViewer, type ViewerPhoto } from "@/components/PhotoViewer";
import { useToast } from "@/components/shell/Toast";
import { toggleAlerts, toggleSavedCafe, visibleCafes, visiblePosts, type Cafe, type Place, type Post } from "@/lib/api";
import { cafeBoard, cafePagePhotos } from "@/lib/cafe";
import { useNow, useUserState } from "@/lib/hooks";
import { imageUrl, postPhotoAlt, type BoardDay } from "@/lib/posts";
import { CafeHeader } from "./CafeHeader";
import { Highlights } from "./Highlights";
import styles from "./cafe.module.css";

type Props = { cafe: Cafe; place: Place; posts: Post[]; today: BoardDay; now: number; replyTo?: string | null };

type Viewing = { title: string; photos: ViewerPhoto[]; index: number; key: string };

// The café page, like a profile: back / share, then the header (banner,
// logo, name, address, rating, tags, About, contact), Get alerts /
// Directions / save, the Highlights row and "On the board today" (pinned
// first, the board's cards). Every photo appears once at most; the
// Highlights row has priority over the cards (see cafePagePhotos).
export function CafeProfile({ cafe: seedCafe, place, posts, today, now: serverNow, replyTo = null }: Props) {
  const state = useUserState();
  const now = useNow(serverNow);
  const toast = useToast();
  const [viewing, setViewing] = useState<Viewing | null>(null);

  // Saved owner changes (photos, About, contact, hours) apply on top
  const cafe = visibleCafes([seedCafe], state)[0] ?? seedCafe;
  const board = cafeBoard(visiblePosts(posts, state, today.iso), cafe.id);
  const photos = cafePagePhotos(cafe, board);
  const alertsOn = state.alerts.includes(cafe.id);
  const saved = state.savedCafes.includes(cafe.id);

  async function alerts() {
    const on = await toggleAlerts(cafe.id);
    toast(on ? `Alerts on for ${cafe.name}` : `Alerts off for ${cafe.name}`);
  }

  async function save() {
    const on = await toggleSavedCafe(cafe.id);
    toast(on ? "Café saved" : "Removed from Saved");
  }

  // The system share sheet, or the clipboard (the old shareText())
  async function share() {
    const text = `${cafe.name} — ${cafe.address}`;
    try {
      if (navigator.share) await navigator.share({ title: cafe.name, text });
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        toast("Copied to clipboard");
      } else toast("Sharing is not supported on this browser");
    } catch (error) {
      // Closing the share sheet is not an error worth showing
      if (!(error instanceof DOMException && error.name === "AbortError")) toast("Could not share");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.bar}>
        <Link className="icon-btn" href="/" aria-label="Back to Today">
          <Icon name="back" />
        </Link>
        <button type="button" className="icon-btn" aria-label="Share this café" onClick={() => void share()}>
          <Icon name="share" />
        </button>
      </div>

      <CafeHeader cafe={cafe} now={now} banner={photos.banner}>
        <div className={styles.actions}>
          <button type="button" className={`${styles.alertBtn} ${alertsOn ? styles.alertOn : ""}`} aria-pressed={alertsOn} onClick={() => void alerts()}>
            <Icon name="bell" />
            {alertsOn ? "Alerts on" : "Get alerts"}
          </button>
          <Link className="btn btn-quiet" href={`/map?cafe=${cafe.id}`}>
            <Icon name="route" />
            Directions
          </Link>
          <button
            type="button"
            className={`icon-btn ${saved ? styles.saved : ""}`}
            aria-pressed={saved}
            aria-label={saved ? "Remove this café from Saved" : "Save this café"}
            onClick={() => void save()}
          >
            <Icon name="bookmark" className={styles.fillable} />
          </button>
        </div>
      </CafeHeader>

      {photos.highlights.length > 0 && (
        <div className={styles.section}>
          <Highlights cafe={cafe} highlights={photos.highlights} />
        </div>
      )}

      <section className={styles.section} aria-labelledby="cafe-board-h">
        <h2 className={styles.secTitle} id="cafe-board-h">
          On the board today
        </h2>
        {photos.posts.length ? (
          <div className={styles.boardList}>
            {photos.posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                cafe={cafe}
                place={place}
                state={state}
                now={now}
                onCafePage
                openThread={post.id === replyTo}
                onOpenPhoto={(_, index) =>
                  setViewing({
                    key: `${post.id}-${index}`,
                    title: `Photos from ${cafe.name}`,
                    index,
                    photos: post.photos.map((photo, i) => ({ src: imageUrl(photo.src), alt: postPhotoAlt(post, i, cafe) })),
                  })
                }
              />
            ))}
          </div>
        ) : (
          <p className={styles.empty}>Nothing new today</p>
        )}
      </section>

      {viewing && (
        <PhotoViewer key={viewing.key} open onClose={() => setViewing(null)} title={viewing.title} photos={viewing.photos} startIndex={viewing.index} />
      )}
    </div>
  );
}
