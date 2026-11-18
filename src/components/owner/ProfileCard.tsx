"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { CafeHeader } from "@/components/cafe/CafeHeader";
import { Highlights } from "@/components/cafe/Highlights";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/shell/Toast";
import { saveCafeEdit, type Cafe } from "@/lib/api";
import { highlightsOf } from "@/lib/cafe";
import { dashStats, STORAGE_FULL_PHOTO } from "@/lib/owner";
import { BACKGROUND_MAX_WIDTH, resizePhoto } from "@/lib/photos";
import { EditPageDialog } from "./EditPageDialog";
import styles from "./owner.module.css";

type Props = { cafe: Cafe; liveCount: number; now: number; focusCompose?: boolean };

// The dashboard's profile card: the same header customers see (banner,
// logo, name, address, rating, tags, About, contact) with the owner's
// background controls on the banner, then the tracked numbers, the main
// actions and the editable Highlights row
export function ProfileCard({ cafe, liveCount, now, focusCompose = false }: Props) {
  const toast = useToast();
  const backgroundInput = useRef<HTMLInputElement>(null);
  const composeLink = useRef<HTMLAnchorElement>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const background = cafe.backgroundPhoto && cafe.backgroundPhoto !== cafe.logo ? cafe.backgroundPhoto : null;

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

  return (
    <section className={`${styles.card} ${styles.profile}`} aria-label="Your café page">
      <CafeHeader
        cafe={cafe}
        now={now}
        banner={background}
        embedded
        bannerActions={
          <>
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
          </>
        }
      >
        <p className={styles.approved}>
          <Icon name="check" /> Approved · visible to customers
        </p>
      </CafeHeader>

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
        <button type="button" className="btn btn-quiet" aria-haspopup="dialog" onClick={() => setEditing(true)}>
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

      <div className={styles.highlights}>
        <Highlights cafe={cafe} highlights={highlightsOf(cafe)} editable />
      </div>

      {editing && <EditPageDialog cafe={cafe} onClose={() => setEditing(false)} />}
    </section>
  );
}
