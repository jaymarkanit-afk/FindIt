"use client";

import { useEffect, useId, useRef, useState } from "react";
import { captionParts } from "@/lib/board";
import styles from "./board.module.css";

// A caption: plain text (never HTML) with http(s) links, clamped to three
// lines; "more" appears only when the clamp actually hides text, and
// toggles to "less", as in the old app.
export function Caption({ text }: { text: string }) {
  const id = useId();
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [clamped, setClamped] = useState(false);

  // Measuring needs the element; ResizeObserver reports on start and on
  // every resize, so the button follows the layout (and the width)
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setClamped(el.scrollHeight > el.clientHeight + 1));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const trimmed = text.trim();
  if (!trimmed) return null;

  return (
    <div className={styles.captionWrap}>
      <p ref={ref} id={id} className={`${styles.caption} ${open ? styles.captionOpen : ""}`}>
        {captionParts(trimmed).map((part, index) =>
          "url" in part ? (
            <a key={index} href={part.url} target="_blank" rel="noopener noreferrer">
              {part.url}
            </a>
          ) : (
            <span key={index}>{part.text}</span>
          ),
        )}
      </p>
      {(clamped || open) && (
        <button type="button" className={styles.moreBtn} aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
          {open ? "less" : "more"}
        </button>
      )}
    </div>
  );
}
