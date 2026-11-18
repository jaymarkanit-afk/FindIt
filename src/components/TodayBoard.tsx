"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { PhotoViewer } from "@/components/PhotoViewer";
import { SearchField } from "@/components/SearchField";
import { BreviBar } from "@/components/board/BreviBar";
import { CafeTile } from "@/components/board/CafeTile";
import { FilterDrawer } from "@/components/board/FilterDrawer";
import { PostCard } from "@/components/board/PostCard";
import { RightRail } from "@/components/board/RightRail";
import { SearchResults } from "@/components/board/SearchResults";
import styles from "@/components/board/board.module.css";
import { visibleCafes, visiblePosts, type Cafe, type Place, type Post } from "@/lib/api";
import {
  boardPosts,
  cafeStreet,
  distanceFromLabel,
  distanceKm,
  filterLabel,
  filteredCafes,
  nearYou,
  railPosts,
  searchTerm,
  SEGMENT_FILTERS,
} from "@/lib/board";
import { setBoardFilter } from "@/lib/boardView";
import { useBoardView, useNow, useUserState } from "@/lib/hooks";
import { imageUrl, postPhotoAlt, type BoardDay } from "@/lib/posts";

type Props = { place: Place; cafes: Cafe[]; posts: Post[]; today: BoardDay; now: number };

// The Today board, as the old home panel: heading, phone search, Brevi,
// Near you, the filter and the cards, with the "This week" / "Now hiring"
// rail beside it on desktop.
export function TodayBoard({ place, cafes, posts, today, now: serverNow }: Props) {
  const state = useUserState();
  const { search, filter } = useBoardView();
  const now = useNow(serverNow);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerKey, setDrawerKey] = useState(0);
  const [viewing, setViewing] = useState<{ postId: string; index: number } | null>(null);

  const allCafes = visibleCafes(cafes, state);
  const cafesHere = allCafes.filter((cafe) => cafe.city === place.name);
  const cafeById = new Map(cafesHere.map((cafe) => [cafe.id, cafe]));
  const hereIds = new Set(cafeById.keys());
  const live = visiblePosts(posts, state, today.iso);
  const liveHere = live.filter((post) => hereIds.has(post.cafeId));

  const term = searchTerm(search);
  const matching = filteredCafes({ cafes: cafesHere, posts: live, origin: place, filter, term, sips: state.sips, now });
  const shown = boardPosts(liveHere, matching, filter);
  const drawerOnly = !SEGMENT_FILTERS.includes(filter);

  const viewedPost = viewing && liveHere.find((post) => post.id === viewing.postId);
  const viewedCafe = viewedPost && cafeById.get(viewedPost.cafeId);

  function openDrawer() {
    setDrawerKey((key) => key + 1);
    setDrawerOpen(true);
  }

  return (
    <div className={styles.layout}>
      <div className={styles.mainCol}>
        <header className={styles.todayHead}>
          <p className={styles.todayDate}><time dateTime={today.iso}>{today.label}</time></p>
          <h1 className={styles.todayTitle}>Today in {place.name}</h1>
        </header>

        <div className={styles.homeSearch}>
          <SearchField cafes={allCafes} placeName={place.name} />
        </div>

        <BreviBar place={place} cafes={cafesHere} now={now} />

        {cafesHere.length > 0 && (
          <section className={styles.boardSec} aria-labelledby="near-title">
            <h2 className={styles.secTitle}>
              <span id="near-title">Near you</span> <span className={styles.distFrom}>{distanceFromLabel(place)}</span>
            </h2>
            <ul className={styles.nearRow} aria-label="Cafés near you">
              {nearYou(cafesHere, place).map((cafe) => (
                <li key={cafe.id} className={styles.nearItem}>
                  <Link className={styles.nearTile} href={`/cafe/${cafe.id}`}>
                    <span className={styles.nearTop}>
                      <CafeTile cafe={cafe} />
                      <span className={styles.distChip}>{distanceKm(place, cafe)} km</span>
                    </span>
                    <span className={styles.nearName}>{cafe.name}</span>
                    <span className={styles.nearStreet}>{cafeStreet(cafe)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={styles.boardSec} aria-labelledby="board-title">
          <h2 className={styles.secTitle} id="board-title">On the board today</h2>
          <div className={styles.filterRow}>
            <div className={`segmented ${styles.boardFilter}`} role="group" aria-label="Show on the board">
              {SEGMENT_FILTERS.map((key) => (
                <button key={key} type="button" data-active={filter === key} aria-pressed={filter === key} onClick={() => setBoardFilter(key)}>
                  {filterLabel(key, "short")}
                </button>
              ))}
            </div>
            <button type="button" className={`btn btn-quiet ${styles.filtersBtn}`} aria-haspopup="dialog" aria-expanded={drawerOpen} onClick={openDrawer}>
              <Icon name="sliders" />
              {drawerOnly ? `Filters: ${filterLabel(filter)}` : "Filters"}
            </button>
          </div>

          {term && <SearchResults term={term} results={matching} allCafes={allCafes} place={place} />}

          <div className={styles.boardList}>
            {shown.length ? (
              shown.map((post) => {
                const cafe = cafeById.get(post.cafeId);
                return cafe ? (
                  <PostCard key={post.id} post={post} cafe={cafe} place={place} state={state} now={now} onOpenPhoto={(postId, index) => setViewing({ postId, index })} />
                ) : null;
              })
            ) : (
              <p className={styles.empty}>{liveHere.length ? "Nothing on the board for this filter yet." : `Nothing on the board in ${place.name} today`}</p>
            )}
          </div>
        </section>
      </div>

      <RightRail events={railPosts(liveHere, hereIds, "event")} jobs={railPosts(liveHere, hereIds, "hiring")} cafeById={cafeById} />

      <FilterDrawer key={drawerKey} open={drawerOpen} current={filter} onClose={() => setDrawerOpen(false)} />

      {viewing && viewedPost && viewedCafe && (
        <PhotoViewer
          key={`${viewedPost.id}-${viewing.index}`}
          open
          onClose={() => setViewing(null)}
          title={`Photos from ${viewedCafe.name}`}
          startIndex={viewing.index}
          photos={viewedPost.photos.map((photo, index) => ({ src: imageUrl(photo.src), alt: postPhotoAlt(viewedPost, index, viewedCafe) }))}
        />
      )}
    </div>
  );
}
