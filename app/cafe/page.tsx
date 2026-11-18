import type { Metadata } from "next";
import Link from "next/link";
import { Placeholder } from "@/components/Placeholder";
import styles from "@/components/placeholder.module.css";

export const metadata: Metadata = { title: "Café" };

export default function CafeIndexPage() {
  return (
    <Placeholder title="Café">
      <p className={styles.meta}>
        Open a café from <Link href="/">Today</Link> to see it here.
      </p>
    </Placeholder>
  );
}
