import Link from "next/link";
import type { Cafe, Post } from "@/lib/api";
import styles from "./board.module.css";

type Props = { events: readonly Post[]; jobs: readonly Post[]; cafeById: ReadonlyMap<number, Cafe> };

// Desktop right rail: "This week" mini tickets and "Now hiring", for the
// selected place only; an empty section is left out, not shown empty
export function RightRail({ events, jobs, cafeById }: Props) {
  return (
    <aside className={styles.rail} aria-label="This week and now hiring">
      {events.length > 0 && (
        <section className={styles.sideSec} aria-labelledby="side-week-h">
          <h2 className={styles.sideTitle} id="side-week-h">This week</h2>
          <ul className={styles.railList}>
            {events.map((post) => {
              const cafe = cafeById.get(post.cafeId);
              if (!cafe || post.type !== "event") return null;
              return (
                <li key={post.id}>
                  <Link className={styles.miniTicket} href={`/cafe/${cafe.id}`}>
                    <span className={styles.miniStub}>
                      <span className={styles.stubDay}>{post.event.day || "—"}</span>
                      {post.event.time && <span className={styles.stubTime}>{post.event.time}</span>}
                    </span>
                    <span className={styles.miniBody}>
                      <span className={styles.miniTitle}>{post.event.title || "Event"}</span>
                      <span className={styles.miniSub}>{[cafe.name, post.event.price].filter(Boolean).join(" · ")}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {jobs.length > 0 && (
        <section className={styles.sideSec} aria-labelledby="side-jobs-h">
          <h2 className={styles.sideTitle} id="side-jobs-h">Now hiring</h2>
          <ul className={styles.railList}>
            {jobs.map((post) => {
              const cafe = cafeById.get(post.cafeId);
              if (!cafe || post.type !== "hiring") return null;
              return (
                <li key={post.id}>
                  <Link className={styles.railJob} href={`/cafe/${cafe.id}`}>
                    <span className={styles.miniTitle}>{post.hiring.role || "Open role"}</span>
                    <span className={styles.miniSub}>{[cafe.name, post.hiring.schedule].filter(Boolean).join(" · ")}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </aside>
  );
}
