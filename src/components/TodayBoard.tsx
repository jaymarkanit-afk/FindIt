"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PhotoViewer } from "@/components/PhotoViewer";
import { toggleSip, visibleCafes, visiblePosts, type Cafe, type Place, type Post, type PostType } from "@/lib/api";
import { useUserState } from "@/lib/hooks";
import { imageUrl, postDetails, postHeadline, postPhotoAlt, sipCount, type BoardDay } from "@/lib/posts";
import styles from "./today-board.module.css";

const filters: Array<{ key: "all" | PostType; label: string }> = [
  { key: "all", label: "All" }, { key: "new", label: "New" }, { key: "photos", label: "Photos" },
  { key: "promo", label: "Promos" }, { key: "event", label: "Events" }, { key: "hiring", label: "Hiring" },
];
const labels: Record<PostType, string> = { new: "New on the menu", photos: "Photos", promo: "Promo", event: "Event", hiring: "Hiring" };

type Props = { place: Place; cafes: Cafe[]; posts: Post[]; today: BoardDay };

// Post photos fill a 148px column (110px on phones), so the browser picks
// a file that size times the screen density instead of the full photo
const POST_IMAGE_SIZES = "(max-width: 700px) 110px, 148px";

export function TodayBoard({ place, cafes, posts, today }: Props) {
  const [filter, setFilter] = useState<"all" | PostType>("all");
  const [viewing, setViewing] = useState<string | null>(null);
  const state = useUserState();

  const cafesHere = visibleCafes(cafes, state).filter((cafe) => cafe.city === place.name);
  const cafeById = new Map(cafesHere.map((cafe) => [cafe.id, cafe]));
  const postsHere = visiblePosts(posts, state, today.iso).filter((post) => cafeById.has(post.cafeId));
  const shown = postsHere.filter((post) => filter === "all" || post.type === filter);
  const viewed = postsHere.find((post) => post.id === viewing);
  const viewedCafe = viewed && cafeById.get(viewed.cafeId);

  return (
    <div className={styles.board}>
      <header className={styles.heading}>
        <p className={styles.date}><time dateTime={today.iso}>{today.label}</time></p>
        <h1 className={styles.title}>Today in {place.name}</h1>
        <p className={styles.intro}>Here is what local cafés are up to right now.</p>
      </header>

      {cafesHere.length > 0 && (
        <section className={styles.section} aria-labelledby="near-title">
          <h2 className={styles.sectionTitle} id="near-title">Near you</h2>
          <ul className={styles.nearRow}>
            {cafesHere.slice(0, 3).map((cafe) => (
              <li key={cafe.id}>
                <Link className={styles.cafeTile} href={`/cafe/${cafe.id}`}>
                  <span className="tile"><Image src={imageUrl(cafe.img)} alt="" width={44} height={44} /></span>
                  <span className={styles.cafeText}>
                    <span className={styles.cafeName}>{cafe.name}</span>
                    <span className={styles.cafeMeta}>★ {cafe.rating} · {cafe.tags[0]}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.section} aria-labelledby="board-title">
        <h2 className={styles.sectionTitle} id="board-title">On the board today</h2>
        <div className={`segmented ${styles.filters}`} role="group" aria-label="Filter board posts">
          {filters.map((item) => (
            <button key={item.key} type="button" data-active={filter === item.key} aria-pressed={filter === item.key} onClick={() => setFilter(item.key)}>
              {item.label}
            </button>
          ))}
        </div>
        <div className={styles.cards} aria-live="polite">
          {shown.length ? shown.map((post) => {
            const cafe = cafeById.get(post.cafeId);
            if (!cafe) return null;
            const sipped = state.sips.includes(post.id);
            const photo = post.photos[0];
            const detail = postDetails(post);
            const photoCount = post.photos.length;
            return (
              <article className={styles.post} key={post.id}>
                <div className={styles.postBody}>
                  {photo ? (
                    <button
                      type="button"
                      className={styles.postPhoto}
                      aria-label={photoCount === 1 ? `View photo from ${cafe.name}` : `View ${photoCount} photos from ${cafe.name}`}
                      onClick={() => setViewing(post.id)}
                    >
                      <Image className={styles.postImage} src={imageUrl(photo.src)} alt="" width={148} height={162} sizes={POST_IMAGE_SIZES} />
                    </button>
                  ) : (
                    <div className={styles.postImage} />
                  )}
                  <div className={styles.postContent}>
                    <span className={styles.tag}>{labels[post.type]}</span>
                    <h3 className={styles.postTitle}>{postHeadline(post)}</h3>
                    <p className={styles.caption}>{post.caption}</p>
                    {detail && <span className={styles.detail}>{detail}</span>}
                  </div>
                </div>
                <footer className={styles.postFooter}>
                  <Link className={styles.cafeMetaLine} href={`/cafe/${cafe.id}`}>
                    <span className="tile"><Image src={imageUrl(cafe.img)} alt="" width={44} height={44} /></span>
                    <span>{cafe.name}</span>
                  </Link>
                  <button className={styles.sip} type="button" data-active={sipped} aria-pressed={sipped} onClick={() => void toggleSip(post.id)}>
                    ☕ {sipCount(post, state.sips)} sips
                  </button>
                </footer>
              </article>
            );
          }) : (
            <p className={styles.empty}>{postsHere.length ? "Nothing on the board for this filter yet." : `Nothing on the board in ${place.name} today`}</p>
          )}
        </div>
      </section>

      {viewed && viewedCafe && (
        <PhotoViewer
          key={viewed.id}
          open
          onClose={() => setViewing(null)}
          title={`Photos from ${viewedCafe.name}`}
          photos={viewed.photos.map((p, index) => ({ src: imageUrl(p.src), alt: postPhotoAlt(viewed, index, viewedCafe) }))}
        />
      )}
    </div>
  );
}
