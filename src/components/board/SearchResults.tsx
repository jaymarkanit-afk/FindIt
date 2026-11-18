"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/shell/Toast";
import { setPlace, type Cafe, type Place } from "@/lib/api";
import { distanceFromLabel, distanceKm, foundElsewhere } from "@/lib/board";
import { imageUrl } from "@/lib/posts";
import styles from "./board.module.css";

type Props = { term: string; results: readonly Cafe[]; allCafes: readonly Cafe[]; place: Place };

// Café rows above the board while a search is active. With nothing here,
// matches in other places are offered with a "Switch to …" button.
export function SearchResults({ term, results, allCafes, place }: Props) {
  const router = useRouter();
  const toast = useToast();
  const elsewhere = results.length ? [] : foundElsewhere(allCafes, place.name, term);

  async function switchTo(name: string) {
    if (await setPlace(name)) {
      router.refresh();
      toast(`Showing ${name}`);
    }
  }

  return (
    <div className={styles.searchResults} role="region" aria-label="Search results">
      <p className={styles.secLabel}>
        {results.length} café{results.length !== 1 ? "s" : ""} matching &ldquo;{term}&rdquo; · km {distanceFromLabel(place)}
      </p>
      {results.length > 0 ? (
        <ul className={styles.recStack}>
          {results.map((cafe) => (
            <li key={cafe.id}>
              <CafeRow cafe={cafe} sub={cafe.address} chip={`${distanceKm(place, cafe)} km`} />
            </li>
          ))}
        </ul>
      ) : elsewhere.length > 0 ? (
        elsewhere.map((group) => (
          <div key={group.place} className={styles.foundElsewhere}>
            <p className={styles.foundLabel}>Found in {group.place}</p>
            <ul className={styles.recStack}>
              {group.cafes.map((cafe) => (
                <li key={cafe.id}>
                  <CafeRow cafe={cafe} sub={cafe.address} chip={cafe.city} />
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn-dark" onClick={() => void switchTo(group.place)}>
              Switch to {group.place}
            </button>
          </div>
        ))
      ) : (
        <p className={styles.empty}>No cafés found in {place.name}. Try another search.</p>
      )}
    </div>
  );
}

export function CafeRow({ cafe, sub, chip }: { cafe: Cafe; sub: string; chip?: string }) {
  return (
    <Link className={styles.recRow} href={`/cafe/${cafe.id}`}>
      <Image className={styles.recThumb} src={imageUrl(cafe.img)} alt="" width={46} height={46} />
      <span className={styles.recInfo}>
        <span className={styles.recName}>{cafe.name}</span>
        <span className={styles.recSub}>{sub}</span>
      </span>
      {chip && <span className={styles.recChip}>{chip}</span>}
    </Link>
  );
}
