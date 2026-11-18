import { Icon } from "@/components/Icon";
import type { Cafe, Place } from "@/lib/api";
import { breviMessage, cafeHour } from "@/lib/board";
import styles from "./board.module.css";

// Brevi, the board's mascot: a time-of-day message that suggests the two
// best-rated cafés in the place. The hour is the cafés' (Manila) hour, so
// the server and the browser agree on the message.
export function BreviBar({ place, cafes, now }: { place: Place; cafes: readonly Cafe[]; now: number }) {
  return (
    <div className={styles.mascotBar}>
      <div className={styles.mascotAva} aria-hidden="true">
        <Icon name="bear" />
      </div>
      <div>
        <p className={styles.mascotName}>BREVI</p>
        <p className={styles.mascotMsg}>{breviMessage(place, cafes, cafeHour(now))}</p>
      </div>
    </div>
  );
}
