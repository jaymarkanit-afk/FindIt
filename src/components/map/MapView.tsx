"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FilterDrawer } from "@/components/board/FilterDrawer";
import { CafeRow } from "@/components/board/SearchResults";
import { Icon } from "@/components/Icon";
import { SearchField } from "@/components/SearchField";
import { useToast } from "@/components/shell/Toast";
import { locateVisitor, visibleCafes, visiblePosts, type Cafe, type Place, type Post } from "@/lib/api";
import { distanceKm, filterLabel, filteredCafes, searchTerm } from "@/lib/board";
import { useBoardView, useNow, useUserState, useVisitorLocation } from "@/lib/hooks";
import { distanceFrom, geoSummary, mapView, markerSpecs, nearbyCafes } from "@/lib/map";
import type { BoardDay } from "@/lib/posts";
import { LeafletMap } from "./LeafletMap";
import styles from "./map.module.css";

type Props = { place: Place; cafes: Cafe[]; posts: Post[]; today: BoardDay; now: number; focusCafeId: number | null };

// The Map page, as the old map panel: search and Filters, the location
// strip with "Locate me", the map (every café; other places dimmed) and
// the nearby list. /map?cafe=<id> centres on that café and opens its popup.
export function MapView({ place, cafes, posts, today, now: serverNow, focusCafeId }: Props) {
  const router = useRouter();
  const toast = useToast();
  const state = useUserState();
  const { search, filter } = useBoardView();
  const user = useVisitorLocation();
  const now = useNow(serverNow);
  const [locateCount, setLocateCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerKey, setDrawerKey] = useState(0);

  const allCafes = visibleCafes(cafes, state);
  const cafesHere = allCafes.filter((cafe) => cafe.city === place.name);
  const origin = user ?? place;
  const from = distanceFrom(place, user !== null);
  const term = searchTerm(search);
  const live = visiblePosts(posts, state, today.iso);
  // The map shows every place, filtered like the board
  const mapCafes = filteredCafes({ cafes: allCafes, posts: live, origin, filter, term, sips: state.sips, now });
  const view = mapView({
    place,
    focus: allCafes.find((cafe) => cafe.id === focusCafeId) ?? null,
    firstMatch: term ? (mapCafes[0] ?? null) : null,
    user,
    locateCount,
  });
  const summary = geoSummary(place, cafesHere, origin, user);
  const nearby = nearbyCafes(cafesHere, origin);

  async function locate() {
    toast("Getting your location…");
    const result = await locateVisitor();
    if (result.ok) {
      setLocateCount((count) => count + 1);
      toast("Location found. Showing cafés near you.");
    } else toast(result.message);
  }

  function zoomToMe() {
    if (!user) {
      void locate();
      return;
    }
    setLocateCount((count) => count + 1);
    toast("Zoomed to your location");
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>Map</h1>
        <p className={styles.intro}>Cafés around {place.name}</p>
      </header>

      <div className={styles.search}>
        <SearchField cafes={allCafes} placeName={place.name} />
        <button
          type="button"
          className="btn btn-quiet"
          aria-haspopup="dialog"
          aria-expanded={drawerOpen}
          onClick={() => {
            setDrawerKey((key) => key + 1);
            setDrawerOpen(true);
          }}
        >
          <Icon name="sliders" />
          {filter === "all" ? "Filters" : `Filters: ${filterLabel(filter)}`}
        </button>
      </div>

      <div className={styles.geo}>
        <button type="button" className={styles.geoWhere} aria-label="Zoom the map to your location" onClick={zoomToMe}>
          <Icon name="pin" />
          <span className={styles.geoText}>
            <span className={styles.geoLocation}>{summary.where}</span>
            <span className={styles.geoStats}>
              {summary.count} cafés · nearest {summary.nearest} {from}
            </span>
          </span>
        </button>
        <button type="button" className="btn btn-dark" onClick={() => void locate()}>
          Locate me
        </button>
      </div>

      <div className={styles.frame}>
        <LeafletMap markers={markerSpecs(mapCafes, place.name, origin, from)} view={view} user={user} label={`Map of cafés around ${place.name}`} onOpenCafe={(id) => router.push(`/cafe/${id}`)} />
        <button type="button" className={`icon-btn ${styles.locate}`} aria-label="Locate me" onClick={() => void locate()}>
          <Icon name="pin" />
        </button>
      </div>

      <section className={styles.section} aria-labelledby="nearby-h">
        <h2 className={styles.secTitle}>
          <span id="nearby-h">Nearby</span> <span className={styles.distFrom}>{from}</span>
        </h2>
        {nearby.length ? (
          <ul className={styles.list}>
            {nearby.map((cafe) => (
              <li key={cafe.id}>
                <CafeRow cafe={cafe} sub={cafe.address} chip={`${distanceKm(origin, cafe)} km`} />
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>No cafés listed in {place.name} yet.</p>
        )}
      </section>

      <FilterDrawer key={drawerKey} open={drawerOpen} current={filter} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
