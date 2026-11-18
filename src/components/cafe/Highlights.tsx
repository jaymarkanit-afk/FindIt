"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Icon } from "@/components/Icon";
import { MoreMenu } from "@/components/menu/MoreMenu";
import { TextDialog } from "@/components/menu/TextDialog";
import { PhotoViewer } from "@/components/PhotoViewer";
import { useToast } from "@/components/shell/Toast";
import { saveHighlights, type Cafe } from "@/lib/api";
import { FEATURED_MAX, HIGHLIGHT_LABEL_MAX, highlightAlt, highlightCountText, type Highlight } from "@/lib/cafe";
import { addUpTo, STORAGE_FULL_PHOTO } from "@/lib/owner";
import { PHOTO_MAX_WIDTH, resizePhotos } from "@/lib/photos";
import { imageUrl } from "@/lib/posts";
import styles from "./highlights.module.css";

type Props = { cafe: Cafe; highlights: Highlight[]; editable?: boolean };

// "Highlights": the café's featured photos as a row of rounded tiles with
// an optional label, in upload order. Tapping one opens the photo viewer.
// On the owner dashboard (editable) a "New" tile adds photos and each tile
// has a "..." menu: Edit label, Remove.
export function Highlights({ cafe, highlights, editable = false }: Props) {
  const toast = useToast();
  const [viewing, setViewing] = useState<number | null>(null);
  const [labelling, setLabelling] = useState<number | null>(null);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  // Set by Remove: focus the heading after the row re-renders
  const focusHeading = useRef(false);

  useEffect(() => {
    if (!focusHeading.current) return;
    focusHeading.current = false;
    heading.current?.focus();
  });

  if (!editable && highlights.length === 0) return null;
  const photos = highlights.map((item, index) => ({ src: imageUrl(item.src), alt: highlightAlt(cafe, item, index) }));

  async function save(next: Highlight[]): Promise<boolean> {
    if (await saveHighlights(cafe.id, next)) {
      setError("");
      return true;
    }
    setError(STORAGE_FULL_PHOTO);
    return false;
  }

  async function add(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    const room = FEATURED_MAX - highlights.length;
    const read = (await resizePhotos(files.slice(0, room), PHOTO_MAX_WIDTH)).filter((src): src is string => src !== null);
    if (!read.length) {
      setError("Those files could not be read as images.");
      return;
    }
    // New uploads go at the end: upload order
    const { list } = addUpTo(highlights, read.map((src) => ({ src, label: "" })), FEATURED_MAX);
    if (!(await save(list))) return;
    const dropped = files.length - room;
    if (dropped > 0) setError(`You can add up to ${FEATURED_MAX} highlights, so ${dropped} ${dropped === 1 ? "was" : "were"} not added.`);
    toast(read.length === 1 ? "Highlight added" : `${read.length} highlights added`);
  }

  async function remove(index: number) {
    focusHeading.current = true;
    if (await save(highlights.filter((_, i) => i !== index))) toast("Highlight removed");
  }

  async function relabel(index: number, label: string) {
    if (await save(highlights.map((item, i) => (i === index ? { ...item, label } : item)))) toast("Label saved");
  }

  return (
    <section className={styles.section} aria-labelledby={`highlights-${cafe.id}`}>
      <div className={styles.head}>
        <h2 className={styles.title} id={`highlights-${cafe.id}`} ref={heading} tabIndex={-1}>
          Highlights
        </h2>
        <span className={styles.count}>{highlightCountText(highlights.length)}</span>
      </div>
      <ul className={styles.row} aria-labelledby={`highlights-${cafe.id}`}>
        {editable && highlights.length < FEATURED_MAX && (
          <li className={styles.item}>
            <label className={`${styles.tile} ${styles.newTile}`}>
              <Icon name="plus" />
              <input type="file" accept="image/*" multiple className="visually-hidden" aria-label="New highlight" onChange={(event) => void add(event)} />
            </label>
            <span className={styles.label} aria-hidden="true">
              New
            </span>
          </li>
        )}
        {highlights.map((item, index) => {
          const name = item.label || `highlight ${index + 1}`;
          return (
            <li key={`${index}-${item.src.slice(-32)}`} className={styles.item}>
              <span className={styles.tileWrap}>
                <button type="button" className={styles.tile} aria-label={`Open ${photos[index].alt}`} onClick={() => setViewing(index)}>
                  <Image src={photos[index].src} alt="" fill sizes="88px" className={styles.cover} />
                </button>
                {editable && (
                  <MoreMenu
                    className={styles.menu}
                    itemName={name}
                    items={[
                      { label: "Edit label", onSelect: () => setLabelling(index) },
                      { label: "Remove", onSelect: () => void remove(index), confirm: { question: "Remove this highlight?", action: "Remove" } },
                    ]}
                  />
                )}
              </span>
              <span className={styles.label}>{item.label}</span>
            </li>
          );
        })}
      </ul>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {viewing !== null && photos[viewing] && (
        <PhotoViewer key={viewing} open onClose={() => setViewing(null)} title={`${cafe.name} highlights`} photos={photos} startIndex={viewing} />
      )}
      {labelling !== null && highlights[labelling] && (
        <TextDialog
          key={labelling}
          open
          title="Edit label"
          label="Label (optional)"
          hint={`Up to ${HIGHLIGHT_LABEL_MAX} characters, shown under the photo.`}
          initial={highlights[labelling].label}
          maxLength={HIGHLIGHT_LABEL_MAX}
          onSave={(value) => void relabel(labelling, value)}
          onClose={() => setLabelling(null)}
        />
      )}
    </section>
  );
}
