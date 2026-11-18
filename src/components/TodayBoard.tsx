"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toggleSip, visibleCafes, visiblePosts, type Cafe, type Place, type Post, type PostType } from "@/lib/api";
import { useAdoptSavedPlace, useUserState } from "@/lib/hooks";
import { imageUrl, postDetails, postHeadline, postPhotoAlt, sipCount, type BoardDay } from "@/lib/posts";
import { PlacePicker } from "./PlacePicker";
import styles from "./today-board.module.css";

const filters: Array<{ key: "all" | PostType; label: string }> = [
  { key: "all", label: "All" }, { key: "new", label: "New" }, { key: "photos", label: "Photos" },
  { key: "promo", label: "Promos" }, { key: "event", label: "Events" }, { key: "hiring", label: "Hiring" },
];
const labels: Record<PostType, string> = { new: "New on the menu", photos: "Photos", promo: "Promo", event: "Event", hiring: "Hiring" };

type Props = { place: Place; hasPlaceCookie: boolean; places: Place[]; cafes: Cafe[]; posts: Post[]; today: BoardDay };

// Post photos fill a 148px column (110px on phones), so the browser picks
// a file that size times the screen density instead of the full photo
const POST_IMAGE_SIZES = "(max-width: 700px) 110px, 148px";

export function TodayBoard({ place, hasPlaceCookie, places, cafes, posts, today }: Props) {
  const [filter, setFilter] = useState<"all" | PostType>("all");
  const state = useUserState();
  useAdoptSavedPlace(place, hasPlaceCookie, state);

  const cafesHere = visibleCafes(cafes, state).filter((cafe) => cafe.city === place.name);
  const cafeById = new Map(cafesHere.map((cafe) => [cafe.id, cafe]));
  const postsHere = visiblePosts(posts, state, today.iso).filter((post) => cafeById.has(post.cafeId));
  const shown = postsHere.filter((post) => filter === "all" || post.type === filter);

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" href="/">FindIt</Link>
        <PlacePicker value={place.name} places={places} />
      </header>
      <main className={styles.main}>
        <header className={styles.heading}>
          <div>
            <p className={styles.date}><time dateTime={today.iso}>{today.label}</time></p>
            <h1 className={styles.title}>Today in {place.name}</h1>
            <p className={styles.intro}>Here is what local cafés are up to right now.</p>
          </div>
          <button className="btn btn-accent" type="button">Get alerts</button>
        </header>

        <section className={styles.section} aria-labelledby="near-title">
          <div className={styles.sectionHead}><h2 className={styles.sectionTitle} id="near-title">Near you</h2><a className={styles.mapLink} href="#map">See on the map</a></div>
          <div className={styles.nearRow} role="list">
            {cafesHere.slice(0, 3).map((cafe) => <button className={styles.cafeTile} key={cafe.id} type="button" role="listitem">
              <span className="tile"><Image src={imageUrl(cafe.img)} alt="" width={44} height={44} /></span>
              <span><span className={styles.cafeName}>{cafe.name}</span><span className={styles.cafeMeta}>★ {cafe.rating} · {cafe.tags[0]}</span></span>
            </button>)}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="board-title">
          <div className={styles.boardHeader}><h2 className={styles.sectionTitle} id="board-title">On the board today</h2></div>
          <div className={`segmented ${styles.filters}`} role="group" aria-label="Filter board posts">
            {filters.map((item) => <button key={item.key} type="button" data-active={filter === item.key} aria-pressed={filter === item.key} onClick={() => setFilter(item.key)}>{item.label}</button>)}
          </div>
          <div className={styles.cards} aria-live="polite">
            {shown.length ? shown.map((post) => {
              const cafe = cafeById.get(post.cafeId);
              if (!cafe) return null;
              const sipped = state.sips.includes(post.id);
              const photo = post.photos[0];
              const detail = postDetails(post);
              return <article className={styles.post} key={post.id}>
                <div className={styles.postBody}>
                  {photo ? <Image className={styles.postImage} src={imageUrl(photo.src)} alt={postPhotoAlt(post, 0, cafe)} width={148} height={162} sizes={POST_IMAGE_SIZES} /> : <div className={styles.postImage} />}
                  <div className={styles.postContent}><span className={styles.tag}>{labels[post.type]}</span><h3 className={styles.postTitle}>{postHeadline(post)}</h3><p className={styles.caption}>{post.caption}</p>{detail && <span className={styles.detail}>{detail}</span>}</div>
                </div>
                <footer className={styles.postFooter}><div className={styles.cafeMetaLine}><span className="tile"><Image src={imageUrl(cafe.img)} alt="" width={44} height={44} /></span><span>{cafe.name}</span></div><button className={styles.sip} type="button" data-active={sipped} aria-pressed={sipped} onClick={() => void toggleSip(post.id)}>☕ {sipCount(post, state.sips)} sips</button></footer>
              </article>;
            }) : <p className={styles.empty}>{postsHere.length ? "Nothing on the board for this filter yet." : `Nothing on the board in ${place.name} today`}</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
