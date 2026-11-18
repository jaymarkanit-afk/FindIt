"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/shell/Toast";
import { saveCafeEdit, type Cafe } from "@/lib/api";
import { addUpTo, FEATURED_LIMIT, featuredCountText, moveItem, STORAGE_FULL_PHOTO } from "@/lib/owner";
import { PHOTO_MAX_WIDTH, resizePhotos } from "@/lib/photos";
import { imageUrl } from "@/lib/posts";
import styles from "./owner.module.css";

type Action = "left" | "right" | "remove" | "add";

// Featured photos: up to six, in the owner's order ("Shown first" is the
// first). Move buttons and drag both reorder; focus stays on the same
// control of the photo that moved, as in the old app.
export function FeaturedPhotos({ cafe }: { cafe: Cafe }) {
  const toast = useToast();
  const list = cafe.featuredPhotos.slice(0, FEATURED_LIMIT);
  const [error, setError] = useState("");
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const section = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const pendingFocus = useRef<string | null>(null);

  // After a change re-renders the row, move focus to the control marked
  // data-focus="<key>" (looked up inside this section only)
  useEffect(() => {
    const key = pendingFocus.current;
    if (!key || !section.current) return;
    pendingFocus.current = null;
    const find = (k: string) => section.current?.querySelector<HTMLElement>(`[data-focus="${k}"]`) ?? null;
    const target = find(key);
    if (target && !(target instanceof HTMLButtonElement && target.disabled)) target.focus();
    else (find("add") ?? heading.current)?.focus();
  });

  async function save(next: string[], focus: string | null): Promise<boolean> {
    // Set before saving: the store re-renders the row as soon as it changes
    pendingFocus.current = focus;
    if (!(await saveCafeEdit(cafe.id, { featuredPhotos: next }))) {
      pendingFocus.current = null;
      setError(STORAGE_FULL_PHOTO);
      return false;
    }
    setError("");
    return true;
  }

  function move(from: number, to: number, action: Action | null) {
    if (to < 0 || to >= list.length || from === to) return;
    void save(moveItem(list, from, to), action ? `${action}-${to}` : null);
  }

  function remove(index: number) {
    const next = list.filter((_, i) => i !== index);
    void save(next, next.length ? `remove-${Math.min(index, next.length - 1)}` : "add");
  }

  async function add(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    const room = FEATURED_LIMIT - list.length;
    const read = (await resizePhotos(files.slice(0, room), PHOTO_MAX_WIDTH)).filter((src): src is string => src !== null);
    if (!read.length) {
      setError("Those files could not be read as images.");
      return;
    }
    const { list: next } = addUpTo(list, read, FEATURED_LIMIT);
    if (!(await save(next, "add"))) return;
    const dropped = files.length - room;
    if (dropped > 0) setError(`You can feature up to ${FEATURED_LIMIT} photos, so ${dropped} ${dropped === 1 ? "was" : "were"} not added.`);
    toast(read.length === 1 ? "Featured photo added" : `${read.length} featured photos added`);
  }

  function onDrop(event: DragEvent<HTMLLIElement>, to: number) {
    if (dragFrom === null) return;
    event.preventDefault();
    move(dragFrom, to, null);
    setDragFrom(null);
  }

  return (
    <section ref={section} className={`${styles.card} ${styles.featured}`} aria-labelledby="feat-h">
      <div className={styles.secHead}>
        <h2 className={styles.secTitle} id="feat-h" ref={heading} tabIndex={-1}>
          Featured photos
        </h2>
        <span className={styles.secNote}>{featuredCountText(list.length)}</span>
      </div>
      <ul className={styles.featRow} aria-labelledby="feat-h">
        {list.map((src, index) => {
          const n = index + 1;
          return (
            <li
              key={`${src.slice(-40)}-${index}`}
              className={`${styles.featTile} ${dragFrom === index ? styles.dragging : ""}`}
              draggable
              onDragStart={(event) => {
                setDragFrom(index);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", String(index));
              }}
              onDragOver={(event) => {
                if (dragFrom !== null) event.preventDefault();
              }}
              onDrop={(event) => onDrop(event, index)}
              onDragEnd={() => setDragFrom(null)}
            >
              <Image src={imageUrl(src)} alt={`${cafe.name} featured photo ${n}`} fill sizes="190px" className={styles.cover} draggable={false} />
              {index === 0 && <span className={styles.featFirst}>Shown first</span>}
              <span className={styles.featBtns}>
                <button data-focus={`left-${index}`} type="button" className={styles.round} aria-label={`Move featured photo ${n} left`} disabled={index === 0} onClick={() => move(index, index - 1, "left")}>
                  <Icon name="chevronLeft" />
                </button>
                <button data-focus={`right-${index}`} type="button" className={styles.round} aria-label={`Move featured photo ${n} right`} disabled={index === list.length - 1} onClick={() => move(index, index + 1, "right")}>
                  <Icon name="chevronRight" />
                </button>
                <button data-focus={`remove-${index}`} type="button" className={styles.round} aria-label={`Remove featured photo ${n}`} onClick={() => remove(index)}>
                  <Icon name="close" />
                </button>
              </span>
            </li>
          );
        })}
        {list.length < FEATURED_LIMIT && (
          <li className={styles.featAddItem}>
            <label className={styles.featAdd}>
              <Icon name="camera" />
              <span>Add featured photo</span>
              <input data-focus="add" type="file" accept="image/*" multiple className="visually-hidden" onChange={(event) => void add(event)} />
            </label>
          </li>
        )}
      </ul>
      {error && (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
