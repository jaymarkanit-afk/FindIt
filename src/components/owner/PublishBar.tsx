"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { setBoardFilter } from "@/lib/boardView";
import styles from "./publish-bar.module.css";

export type PublishNotice = "published" | "published-alert" | "updated";

const TEXT: Record<PublishNotice, string> = {
  "published-alert": "On the board. People with alerts on were notified.",
  published: "On the board.",
  updated: "Changes are on the board.",
};

// The dark bar after publishing, with "View" (the board, all posts), as in
// the old app; it hides itself after five seconds
export function PublishBar({ notice: initialNotice }: { notice: PublishNotice | null }) {
  const router = useRouter();
  // Kept from the first render: the address is tidied right after, which
  // re-renders the dashboard without the notice
  const [notice] = useState(initialNotice);
  const [shown, setShown] = useState(initialNotice !== null);

  useEffect(() => {
    if (!shown) return;
    const id = setTimeout(() => setShown(false), 5000);
    return () => clearTimeout(id);
  }, [shown]);

  // Nothing to announce: no second live region next to the toast's
  if (notice === null) return null;

  return (
    <div className={styles.bar} data-shown={shown} role="status" aria-live="polite">
      {shown && notice && (
        <>
          <Icon name="check" />
          <span>{TEXT[notice]}</span>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setShown(false);
              setBoardFilter("all");
              router.push("/");
            }}
          >
            View
          </button>
        </>
      )}
    </div>
  );
}
