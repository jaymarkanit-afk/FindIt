"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";
import { PostCard } from "@/components/board/PostCard";
import { Icon } from "@/components/Icon";
import { PhotoViewer, type ViewerPhoto } from "@/components/PhotoViewer";
import { useToast } from "@/components/shell/Toast";
import { toggleAlerts, toggleSavedCafe, visibleCafes, visiblePosts, type Cafe, type Place, type Post } from "@/lib/api";
import { cafeInitials } from "@/lib/board";
import { cafeBoard, cafeMinutes, cafePagePhotos, featuredAlt, hoursLabel, openStatus, PHOTO_ROW_LIMIT, ratingText } from "@/lib/cafe";
import { useNow, useUserState } from "@/lib/hooks";
import { imageUrl, postPhotoAlt, type BoardDay } from "@/lib/posts";
import styles from "./cafe.module.css";

type Props = { cafe: Cafe; place: Place; posts: Post[]; today: BoardDay; now: number };

type Viewing = { title: string; photos: ViewerPhoto[]; index: number; key: string };

// The café page, as the old profile panel: back / share, the banner with
// the logo overlapping it, the info card, "On the board today" (pinned
// first, same cards as the board), Photos and Info. Every photo appears
// once at most (see cafePagePhotos).
export function CafeProfile({ cafe: seedCafe, place, posts, today, now: serverNow }: Props) {
  const state = useUserState();
  const now = useNow(serverNow);
  const toast = useToast();
  const photosId = useId();
  const [expanded, setExpanded] = useState(false);
  const [viewing, setViewing] = useState<Viewing | null>(null);

  // Saved owner changes (background and featured photos) apply on top
  const cafe = visibleCafes([seedCafe], state)[0] ?? seedCafe;
  const board = cafeBoard(visiblePosts(posts, state, today.iso), cafe.id);
  const photos = cafePagePhotos(cafe, board);
  const alertsOn = state.alerts.includes(cafe.id);
  const saved = state.savedCafes.includes(cafe.id);
  const rating = ratingText(cafe);
  const status = openStatus(cafe, cafeMinutes(now));
  const hours = hoursLabel(cafe);

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

  const featuredPhotos = photos.featured.map((src, index) => ({ src: imageUrl(src), alt: featuredAlt(cafe, index) }));

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

      {photos.banner && (
        <div className={styles.banner}>
          <Image src={imageUrl(photos.banner)} alt={`${cafe.name} background photo`} fill sizes="(max-width: 760px) 100vw, 720px" className={styles.cover} preload />
        </div>
      )}

      <section className={`${styles.card} ${photos.banner ? styles.withBanner : ""}`} aria-labelledby="cafe-name">
        <div className={styles.top}>
          {cafe.logo ? (
            <span className={`${styles.tileLg} ${styles.tileLogo}`}>
              <Image src={imageUrl(cafe.logo)} alt={`${cafe.name} logo`} width={60} height={60} />
            </span>
          ) : (
            <span className={styles.tileLg} aria-hidden="true">
              {cafeInitials(cafe)}
            </span>
          )}
          <div className={styles.topText}>
            <h1 className={styles.name} id="cafe-name">{cafe.name}</h1>
            <p className={styles.address}>{cafe.address}</p>
          </div>
        </div>
        <div className={styles.facts}>
          {rating ? (
            <span>
              <Icon name="star" />
              {rating}
            </span>
          ) : (
            <span className={styles.muted}>No reviews yet</span>
          )}
          {status && (
            <span>
              <Icon name="clock" />
              {status.label}
            </span>
          )}
        </div>
        {cafe.tags.length > 0 && (
          <ul className={styles.tags} aria-label="Tags">
            {cafe.tags.map((tag) => (
              <li key={tag} className={styles.chip}>{tag}</li>
            ))}
          </ul>
        )}
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
      </section>

      <section className={styles.section} aria-labelledby="cafe-board-h">
        <h2 className={styles.secTitle} id="cafe-board-h">On the board today</h2>
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

      <section className={styles.section} aria-labelledby="cafe-photos-h">
        <div className={styles.secHead}>
          <h2 className={styles.secTitle} id="cafe-photos-h">
            Photos {featuredPhotos.length > 0 && <span className={styles.count}>{featuredPhotos.length}</span>}
          </h2>
          {featuredPhotos.length > PHOTO_ROW_LIMIT && (
            <button type="button" className={styles.textBtn} aria-expanded={expanded} aria-controls={photosId} onClick={() => setExpanded(!expanded)}>
              {expanded ? "Show less" : "See all"}
            </button>
          )}
        </div>
        {featuredPhotos.length ? (
          <ul id={photosId} className={expanded ? styles.photoGrid : styles.photoRow} aria-label={`${cafe.name} photos`}>
            {featuredPhotos.map((photo, index) => (
              <li key={photo.src} className={styles.photoItem}>
                <button
                  type="button"
                  className={styles.photoTile}
                  aria-label={`Open ${photo.alt}`}
                  onClick={() => setViewing({ key: `featured-${index}`, title: `${cafe.name} photos`, index, photos: featuredPhotos })}
                >
                  <Image src={photo.src} alt="" fill sizes="(max-width: 699px) 50vw, 240px" className={styles.cover} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.photoEmpty}>
            <Icon name="camera" />
            <strong>No photos yet</strong>
            <span>Photos show here once the café adds them.</span>
          </div>
        )}
      </section>

      {(hours || cafe.contact) && (
        <section className={styles.section} aria-labelledby="cafe-info-h">
          <h2 className={styles.secTitle} id="cafe-info-h">Info</h2>
          <dl className={styles.infoList}>
            <InfoRow icon="pin" label="Address" value={cafe.address} />
            <InfoRow icon="clock" label="Hours" value={hours} />
            <InfoRow icon="phone" label="Contact" value={cafe.contact ?? ""} />
          </dl>
        </section>
      )}

      {viewing && (
        <PhotoViewer key={viewing.key} open onClose={() => setViewing(null)} title={viewing.title} photos={viewing.photos} startIndex={viewing.index} />
      )}
    </div>
  );
}

// Rows without data are left out
function InfoRow({ icon, label, value }: { icon: "pin" | "clock" | "phone"; label: string; value: string }) {
  if (!value) return null;
  return (
    <div className={styles.infoRow}>
      <Icon name={icon} />
      <div>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
    </div>
  );
}
