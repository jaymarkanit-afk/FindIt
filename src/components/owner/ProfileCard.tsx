"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/shell/Toast";
import { saveCafeEdit, type Cafe } from "@/lib/api";
import { cafeInitials } from "@/lib/board";
import { dashStats, STORAGE_FULL_PHOTO } from "@/lib/owner";
import { BACKGROUND_MAX_WIDTH, resizePhoto } from "@/lib/photos";
import { imageUrl } from "@/lib/posts";
import styles from "./owner.module.css";

type Props = { cafe: Cafe; liveCount: number; focusCompose?: boolean };

// The dashboard's profile card: background photo (change / remove), logo or
// initials overlapping it, name, address, approval, the tracked numbers
// and the main actions
export function ProfileCard({ cafe, liveCount, focusCompose = false }: Props) {
  const toast = useToast();
  const backgroundInput = useRef<HTMLInputElement>(null);
  const composeLink = useRef<HTMLAnchorElement>(null);
  const [error, setError] = useState("");
  const background = cafe.backgroundPhoto;

  // Back from the composer with Cancel: focus returns to "Post an update"
  useEffect(() => {
    if (focusCompose) composeLink.current?.focus();
  }, [focusCompose]);

  async function onBackground(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // the same file can be picked again later
    if (!file) return;
    const src = await resizePhoto(file, BACKGROUND_MAX_WIDTH);
    if (!src) {
      setError("That file could not be read as an image.");
      return;
    }
    if (!(await saveCafeEdit(cafe.id, { backgroundPhoto: src }))) {
      setError(STORAGE_FULL_PHOTO);
      return;
    }
    setError("");
    backgroundInput.current?.focus();
    toast("Background photo updated");
  }

  async function removeBackground() {
    if (!(await saveCafeEdit(cafe.id, { backgroundPhoto: null }))) return;
    setError("");
    backgroundInput.current?.focus();
    toast("Background photo removed");
  }

  // "Edit page": the page's look is its background and featured photos
  function editPage() {
    backgroundInput.current?.focus();
    toast("Change your background here and your featured photos below.");
  }

  return (
    <section className={`${styles.card} ${styles.profile}`} aria-labelledby="dash-name">
      <div className={styles.banner}>
        {background && <Image src={imageUrl(background)} alt={`${cafe.name} background photo`} fill sizes="(max-width: 1000px) 100vw, 760px" className={styles.cover} />}
        <div className={styles.bannerActs}>
          <label className={`btn ${styles.btnBanner}`}>
            <Icon name="camera" />
            {background ? "Change background" : "Add a background photo"}
            <input ref={backgroundInput} type="file" accept="image/*" className="visually-hidden" onChange={(event) => void onBackground(event)} />
          </label>
          {background && (
            <button type="button" className={`btn ${styles.btnBanner}`} onClick={() => void removeBackground()}>
              Remove
            </button>
          )}
        </div>
      </div>

      <div className={styles.ident}>
        {cafe.logo ? (
          <span className={`${styles.logo} ${styles.logoImg}`}>
            <Image src={imageUrl(cafe.logo)} alt={`${cafe.name} logo`} width={96} height={96} />
          </span>
        ) : (
          <span className={styles.logo} aria-hidden="true">
            {cafeInitials(cafe)}
          </span>
        )}
        <div className={styles.identText}>
          <h1 className={styles.name} id="dash-name">{cafe.name}</h1>
          <p className={styles.address}>{cafe.address}</p>
          <p className={styles.approved}>
            <Icon name="check" /> Approved · visible to customers
          </p>
        </div>
      </div>

      {/* Only numbers that are tracked. "People getting alerts" waits for a
          backend that counts every customer's alerts. */}
      <dl className={styles.stats}>
        {dashStats(liveCount, cafe).map((stat) => (
          <div key={stat.label} className={styles.stat}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className={styles.acts}>
        <Link ref={composeLink} className="btn btn-accent" href="/owner/post" id="compose-new">
          <Icon name="spark" /> Post an update
        </Link>
        <button type="button" className="btn btn-quiet" onClick={editPage}>
          Edit page
        </button>
        <Link className="btn btn-quiet" href={`/cafe/${cafe.id}`}>
          View as customer
        </Link>
      </div>
      {error && (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
