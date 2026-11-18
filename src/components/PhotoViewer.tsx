"use client";

import Image from "next/image";
import { useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/Icon";
import { Overlay } from "@/components/overlay/Overlay";
import styles from "./photo-viewer.module.css";

export type ViewerPhoto = { src: string; alt: string };

type Props = { open: boolean; onClose: () => void; title: string; photos: readonly ViewerPhoto[]; startIndex?: number };

// Full-screen photos with Previous / Next buttons and the arrow keys.
// Mount it with a key per opening so it starts at startIndex each time.
export function PhotoViewer({ open, onClose, title, photos, startIndex = 0 }: Props) {
  const [index, setIndex] = useState(startIndex);
  const count = photos.length;
  const photo = photos[Math.min(index, count - 1)];
  const many = count > 1;
  const go = (step: number) => setIndex((current) => (current + step + count) % count);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!many) return;
    if (event.key === "ArrowLeft") go(-1);
    if (event.key === "ArrowRight") go(1);
  }

  return (
    <Overlay open={open && count > 0} onClose={onClose} title={title} variant="viewer" onPanelKeyDown={onKeyDown}>
      {photo && (
        <div className={styles.viewer}>
          <figure className={styles.figure}>
            <div className={styles.frame}>
              <Image src={photo.src} alt={photo.alt} fill sizes="100vw" className={styles.image} />
            </div>
            <figcaption className={styles.caption} aria-live="polite">
              {many ? `${index + 1} of ${count}` : photo.alt}
            </figcaption>
          </figure>
          {many && (
            <div className={styles.controls}>
              <button type="button" className={styles.step} aria-label="Previous photo" onClick={() => go(-1)}>
                <Icon name="chevronLeft" />
              </button>
              <button type="button" className={styles.step} aria-label="Next photo" onClick={() => go(1)} data-autofocus="">
                <Icon name="chevronRight" />
              </button>
            </div>
          )}
        </div>
      )}
    </Overlay>
  );
}
