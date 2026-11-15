"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { cafesForPlace, getCafe, postsForPlace, type Place, type PostType } from "@/data/cafes";
import { PlacePicker } from "./PlacePicker";
import styles from "./today-board.module.css";

const filters: Array<{ key: "all" | PostType; label: string }> = [
  { key: "all", label: "All" }, { key: "new", label: "New" }, { key: "photos", label: "Photos" },
  { key: "promo", label: "Promos" }, { key: "event", label: "Events" }, { key: "hiring", label: "Hiring" },
];
const labels: Record<PostType, string> = { new: "New on the menu", photos: "Photos", promo: "Promo", event: "Event", hiring: "Hiring" };

export function TodayBoard({ initialPlace }: { initialPlace: Place }) {
  const [filter, setFilter] = useState<"all" | PostType>("all");
  const [sipped, setSipped] = useState<string[]>([]);
  const cafes = cafesForPlace(initialPlace.name);
  const posts = useMemo(() => postsForPlace(initialPlace.name).filter((post) => filter === "all" || post.type === filter), [filter, initialPlace.name]);

  function sip(id: string) {
    setSipped((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
    const saved = JSON.parse(window.localStorage.getItem("findit.sips") ?? "[]") as string[];
    const next = saved.includes(id) ? saved.filter((value) => value !== id) : [...saved, id];
    window.localStorage.setItem("findit.sips", JSON.stringify(next));
  }

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" href="/">FindIt</Link>
        <PlacePicker value={initialPlace.name} />
      </header>
      <main className={styles.main}>
        <header className={styles.heading}>
          <div>
            <p className={styles.date}>Today · November 15, 2026</p>
            <h1 className={styles.title}>Today in {initialPlace.name}</h1>
            <p className={styles.intro}>Here is what local cafés are up to right now.</p>
          </div>
          <button className="btn btn-accent" type="button">Get alerts</button>
        </header>

        <section className={styles.section} aria-labelledby="near-title">
          <div className={styles.sectionHead}><h2 className={styles.sectionTitle} id="near-title">Near you</h2><a className={styles.mapLink} href="#map">See on the map</a></div>
          <div className={styles.nearRow} role="list">
            {cafes.slice(0, 3).map((cafe) => <button className={styles.cafeTile} key={cafe.id} type="button" role="listitem">
              <span className="tile"><Image src={cafe.img} alt="" width={44} height={44} unoptimized /></span>
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
            {posts.length ? posts.map((post) => {
              const cafe = getCafe(post.cafeId);
              if (!cafe) return null;
              return <article className={styles.post} key={post.id}>
                <div className={styles.postBody}>
                  {post.photos[0] ? <Image className={styles.postImage} src={post.photos[0]} alt="" width={148} height={162} unoptimized /> : <div className={styles.postImage} />}
                  <div className={styles.postContent}><span className={styles.tag}>{labels[post.type]}</span><h3 className={styles.postTitle}>{post.title}</h3><p className={styles.caption}>{post.caption}</p>{post.detail && <span className={styles.detail}>{post.detail}</span>}</div>
                </div>
                <footer className={styles.postFooter}><div className={styles.cafeMetaLine}><span className="tile"><Image src={cafe.img} alt="" width={44} height={44} unoptimized /></span><span>{cafe.name}</span></div><button className={styles.sip} type="button" data-active={sipped.includes(post.id)} aria-pressed={sipped.includes(post.id)} onClick={() => sip(post.id)}>☕ {post.sips + (sipped.includes(post.id) ? 1 : 0)} sips</button></footer>
              </article>;
            }) : <p className={styles.empty}>Nothing posted in this place yet.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
