import type { Metadata } from "next";
import Link from "next/link";
import { Placeholder } from "@/components/Placeholder";
import styles from "@/components/placeholder.module.css";

export const metadata: Metadata = { title: "Café not found" };

// A café id that does not exist
export default function CafeNotFound() {
  return (
    <Placeholder title="Café not found" note={false}>
      <p className={styles.meta}>
        This café is not on FindIt. Find another on <Link href="/">Today</Link>.
      </p>
    </Placeholder>
  );
}
