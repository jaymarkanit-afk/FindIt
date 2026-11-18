import type { Metadata } from "next";
import Link from "next/link";
import { Placeholder } from "@/components/Placeholder";
import styles from "@/components/placeholder.module.css";

export const metadata: Metadata = { title: "Page not found" };

// Any address the app does not have
export default function NotFound() {
  return (
    <Placeholder title="Page not found" note={false}>
      <p className={styles.meta}>
        There is nothing at this address. Go back to <Link href="/">Today</Link>.
      </p>
    </Placeholder>
  );
}
