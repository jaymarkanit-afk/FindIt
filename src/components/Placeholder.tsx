import type { ReactNode } from "react";
import styles from "./placeholder.module.css";

// Stand-in for pages that are still being moved from the old app
export function Placeholder({ title, note = true, children }: { title: string; note?: boolean; children?: ReactNode }) {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      {children}
      {note && <p className={styles.note}>This page is being rebuilt and will be back in a later update.</p>}
    </div>
  );
}
