"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { PostCard } from "@/components/board/PostCard";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/shell/Toast";
import { OWNER_CAFE_ID, ownerPost, saveComposedPost, visibleCafes, type Cafe, type Place, type Post, type PostType } from "@/lib/api";
import {
  buildPost,
  CAPTION_MAX,
  CAPTION_PLACEHOLDERS,
  CAPTION_WARN_AT,
  COMPOSER_TYPES,
  emptyForm,
  formFromPost,
  PHOTO_HINTS,
  PHOTO_LIMITS,
  photoOverflowNote,
  previewPost,
  STORAGE_FULL_POST,
  type ComposerForm,
  type FieldError,
} from "@/lib/composer";
import { useNow, useOwnerSession, useUserState } from "@/lib/hooks";
import { MoreMenu } from "@/components/menu/MoreMenu";
import { TextDialog } from "@/components/menu/TextDialog";
import { PHOTO_MAX_WIDTH, resizePhotos } from "@/lib/photos";
import styles from "./composer.module.css";

type Props = { cafes: Cafe[]; place: Place; posts: Post[]; now: number; postId: string | null };

// /owner/post and /owner/post/<id>: the composer, as in the old Owner panel.
// Signed-out visits (and unknown posts) go back to /owner.
export function Composer(props: Props) {
  const router = useRouter();
  const signedIn = useOwnerSession();
  const state = useUserState();
  const original = props.postId ? ownerPost(state, props.postId) : undefined;
  const missing = props.postId !== null && !original;

  useEffect(() => {
    if (!signedIn || missing) router.replace("/owner");
  }, [signedIn, missing, router]);

  if (!signedIn || missing) return null;
  // Keyed by the post, so the form starts from it (or empty) each time
  return <ComposerBody key={props.postId ?? "new"} {...props} original={original} />;
}

function ComposerBody({ cafes, place, now: serverNow, original }: Props & { original: Post | undefined }) {
  const router = useRouter();
  const toast = useToast();
  const state = useUserState();
  const now = useNow(serverNow);
  const [form, setForm] = useState<ComposerForm>(() => (original ? formFromPost(original) : emptyForm()));
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [photoNote, setPhotoNote] = useState("");
  const [storageFull, setStorageFull] = useState(false);
  const [alertNow, setAlertNow] = useState(true);
  const [saving, setSaving] = useState(false);
  const [describing, setDescribing] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<string | null>("compose-title");

  // Focus: the title on open; after a photo is removed, the next photo's
  // "..." button ("photo:<n>") or the add-photos field; after a failed
  // publish, the first invalid field (data-focus="<key>")
  useEffect(() => {
    const key = pendingFocus.current;
    if (!key || !root.current) return;
    pendingFocus.current = null;
    const photo = /^photo:(\d+)$/.exec(key)?.[1];
    const selector = photo !== undefined ? `[data-photo="${photo}"] [aria-haspopup="menu"]` : `[data-focus="${key}"]`;
    root.current.querySelector<HTMLElement>(selector)?.focus();
  });

  const cafe = visibleCafes(cafes, state).find((item) => item.id === OWNER_CAFE_ID);
  if (!cafe) return null;

  const limit = PHOTO_LIMITS[form.type];
  const errorFor = (field: string) => errors.find((error) => error.field === field)?.message ?? "";
  const set = <K extends keyof ComposerForm>(key: K, value: ComposerForm[K], field?: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (field) setErrors((current) => current.filter((error) => error.field !== field));
  };

  const preview = previewPost(
    buildPost(form, { id: "preview", cafeId: cafe.id, time: original?.time ?? now, sips: original?.sips ?? 0, pinned: false, eventDay: original?.type === "event" ? original.event.day : undefined }),
  );
  const title = original ? (original.status === "draft" ? "Edit draft" : "Edit post") : "Post an update";

  function chooseType(type: PostType) {
    setForm((current) => ({ ...current, type }));
    setErrors([]);
    setPhotoNote("");
  }

  async function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    const room = Math.max(0, limit.max - form.photos.length);
    const take = files.slice(0, room);
    const read = (await resizePhotos(take, PHOTO_MAX_WIDTH)).filter((src): src is string => src !== null);
    setForm((current) => ({ ...current, photos: [...current.photos, ...read.map((src) => ({ src, alt: "" }))] }));
    setErrors((current) => current.filter((error) => error.field !== "ann-photo"));
    const notes = [];
    if (files.length > room) notes.push(photoOverflowNote(form.type, files.length - room));
    if (read.length < take.length) notes.push("Some files could not be read as images.");
    setPhotoNote(notes.join(" "));
  }

  // Photos keep upload order; the first is "Main"
  function removePhoto(index: number) {
    const left = form.photos.length - 1;
    pendingFocus.current = left > 0 ? `photo:${Math.min(index, left - 1)}` : "add-photos";
    set(
      "photos",
      form.photos.filter((_, i) => i !== index),
    );
  }

  function describePhoto(index: number, alt: string) {
    set(
      "photos",
      form.photos.map((photo, i) => (i === index ? { ...photo, alt: alt.trim() } : photo)),
    );
  }

  async function save(asDraft: boolean) {
    setSaving(true);
    const result = await saveComposedPost(form, { editingId: original?.id ?? null, asDraft, alertNow });
    setSaving(false);
    if (!result.ok) {
      setStorageFull(result.storageFull);
      setErrors(result.errors);
      if (result.errors[0]) pendingFocus.current = result.errors[0].field === "ann-photo" ? "add-photos" : result.errors[0].field;
      return;
    }
    if (asDraft) toast("Draft saved");
    const notice = asDraft ? "" : original ? "updated" : alertNow ? "published-alert" : "published";
    const query = new URLSearchParams({ tab: asDraft ? "draft" : "live", post: result.id, ...(notice ? { notice } : {}) });
    router.push(`/owner?${query.toString()}`);
  }

  function cancel() {
    router.push("/owner?focus=compose");
  }

  const field = (id: string, label: string, input: ReactNode, required = false, wide = false) => (
    <div className={`${styles.fg} ${wide ? styles.wide : ""}`}>
      <label htmlFor={id}>
        {label} {required && <span className={styles.req}>(required)</span>}
      </label>
      {input}
      {errorFor(id) && (
        <p className={styles.fieldError} id={`${id}-error`}>
          {errorFor(id)}
        </p>
      )}
    </div>
  );

  const text = (id: string, key: keyof ComposerForm, maxLength: number, placeholder: string, type = "text") => (
    <input
      className={styles.fi}
      type={type}
      id={id}
      data-focus={id}
      maxLength={type === "text" ? maxLength : undefined}
      placeholder={placeholder}
      value={String(form[key])}
      aria-invalid={errorFor(id) ? true : undefined}
      aria-describedby={errorFor(id) ? `${id}-error` : undefined}
      onChange={(event) => set(key, event.target.value, id)}
    />
  );

  return (
    <div className={styles.page} ref={root}>
      <header className={styles.head}>
        <button type="button" className="icon-btn" aria-label="Cancel and go back to your dashboard" onClick={cancel}>
          <Icon name="close" />
        </button>
        <h1 className={styles.title} tabIndex={-1} data-focus="compose-title">
          {title}
        </h1>
        <span className={styles.headBtns}>
          <button type="button" className="btn btn-quiet" disabled={saving} onClick={() => void save(true)}>
            Save draft
          </button>
          <button type="button" className="btn btn-accent" disabled={saving} onClick={() => void save(false)}>
            Publish
          </button>
        </span>
      </header>
      {storageFull && (
        <p className={styles.composeError} role="alert">
          {STORAGE_FULL_POST}
        </p>
      )}
      {errors.length > 0 && (
        <p className="visually-hidden" role="alert">
          {errors.length === 1 ? "1 thing to fix before publishing." : `${errors.length} things to fix before publishing.`}
        </p>
      )}
      <p className={styles.as}>
        Posting as <strong>{cafe.name}</strong>
      </p>

      <div className={styles.card}>
        <div className={styles.fg}>
          <span className={styles.fieldLabel} id="ann-type-label">
            Post type
          </span>
          <div className={`segmented ${styles.types}`} role="group" aria-labelledby="ann-type-label">
            {COMPOSER_TYPES.map((item) => (
              <button key={item.type} type="button" data-active={form.type === item.type} aria-pressed={form.type === item.type} onClick={() => chooseType(item.type)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {limit.max > 0 && (
          <div className={styles.fg}>
            <span className={styles.fieldLabel} id="ann-photos-label">
              Photos
            </span>
            <p className={styles.hint} id="ann-photos-hint">
              {PHOTO_HINTS[form.type]}
            </p>
            <ul className={styles.thumbs} aria-labelledby="ann-photos-label">
              {form.photos.map((photo, index) => {
                const n = index + 1;
                const unused = index >= limit.max;
                return (
                  <li key={`${index}-${photo.src.slice(-24)}`} className={`${styles.thumb} ${unused ? styles.unused : ""}`} data-photo={index}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- a data: URL picked a moment ago; nothing to optimise */}
                    <img src={photo.src} alt="" />
                    {index === 0 && <span className={styles.main}>Main</span>}
                    <span className={styles.thumbText}>
                      <span className={styles.thumbName}>Photo {n}</span>
                      <span className={photo.alt ? styles.described : styles.undescribed}>{photo.alt || "No description"}</span>
                    </span>
                    <MoreMenu
                      className={styles.thumbMenu}
                      itemName={`photo ${n}`}
                      items={[
                        { label: "Describe", onSelect: () => setDescribing(index) },
                        { label: "Remove", onSelect: () => removePhoto(index), confirm: { question: "Remove this photo?", action: "Remove" } },
                      ]}
                    />
                    {unused && <span className={styles.thumbNote}>Not posted: this type takes {limit.max === 1 ? "1 photo" : `${limit.max} photos`}</span>}
                  </li>
                );
              })}
            </ul>
            {form.photos.length < limit.max && (
              <label className={styles.photoAdd}>
                <Icon name="camera" />
                <span>{form.photos.length ? "Add more photos" : limit.max === 1 ? "Add a photo" : "Add photos"}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  data-focus="add-photos"
                  aria-describedby="ann-photos-hint ann-photos-error"
                  aria-invalid={errorFor("ann-photo") ? true : undefined}
                  onChange={(event) => void addPhotos(event)}
                />
              </label>
            )}
            {(photoNote || errorFor("ann-photo")) && (
              <p className={styles.fieldError} id="ann-photos-error">
                {[errorFor("ann-photo"), photoNote].filter(Boolean).join(" ")}
              </p>
            )}
          </div>
        )}

        {form.type === "new" && (
          <div className={styles.extra}>
            {field("ann-item", "Item name", text("ann-item", "item", 60, "Ube cheesecake"), true, true)}
            {field("ann-new-price", "Price", text("ann-new-price", "price", 30, "₱180"))}
            {field("ann-avail", "Availability", text("ann-avail", "availability", 40, "Available today"))}
          </div>
        )}
        {form.type === "promo" && (
          <div className={styles.extra}>
            {field("ann-promo-title", "Title", text("ann-promo-title", "promoTitle", 60, "Rainy-day special"), true, true)}
            {field("ann-offer", "Offer", text("ann-offer", "offer", 120, "Buy one, get one on iced drinks"), false, true)}
            {field("ann-until", "Valid until", text("ann-until", "validUntil", 10, "", "date"), false, true)}
          </div>
        )}
        {form.type === "event" && (
          <div className={styles.extra}>
            {field("ann-event-title", "Title", text("ann-event-title", "eventTitle", 60, "Poetry night"), true, true)}
            {field("ann-date", "Date", text("ann-date", "date", 10, "", "date"), true)}
            {field("ann-time", "Time", text("ann-time", "time", 5, "", "time"))}
            {field("ann-price", "Price", text("ann-price", "eventPrice", 30, "Free, or ₱350"), false, true)}
          </div>
        )}
        {form.type === "hiring" && (
          <div className={styles.extra}>
            {field("ann-role", "Role", text("ann-role", "role", 50, "Barista"), true, true)}
            {field("ann-schedule", "Schedule", text("ann-schedule", "schedule", 50, "Part-time · Weekends"), false, true)}
            {field("ann-perks", "Perks", text("ann-perks", "perks", 80, "Free meals, flexible hours"), false, true)}
          </div>
        )}

        <div className={styles.fg}>
          <div className={styles.fgRow}>
            <label htmlFor="ann-text">
              Caption <span className={styles.req}>{form.type === "photos" ? "(optional)" : "(required)"}</span>
            </label>
            <span className={`${styles.count} ${form.caption.length >= CAPTION_WARN_AT ? styles.warn : ""}`} id="ann-count">
              {form.caption.length} / {CAPTION_MAX}
            </span>
          </div>
          <textarea
            className={`${styles.fi} ${styles.caption}`}
            id="ann-text"
            data-focus="ann-text"
            maxLength={CAPTION_MAX}
            placeholder={CAPTION_PLACEHOLDERS[form.type]}
            value={form.caption}
            aria-invalid={errorFor("ann-text") ? true : undefined}
            aria-describedby={`ann-count${errorFor("ann-text") ? " ann-text-error" : ""}`}
            onChange={(event) => set("caption", event.target.value, "ann-text")}
          />
          {errorFor("ann-text") && (
            <p className={styles.fieldError} id="ann-text-error">
              {errorFor("ann-text")}
            </p>
          )}
        </div>
      </div>

      <label className={styles.toggleRow}>
        <Icon name="bell" />
        <span className={styles.toggleText}>
          Send alerts now
          <small>People with alerts on for your café get notified</small>
        </span>
        <input type="checkbox" className={styles.switch} checked={alertNow} onChange={(event) => setAlertNow(event.target.checked)} />
      </label>

      <section className={styles.previewWrap} aria-labelledby="preview-h">
        <h2 className={styles.secLabel} id="preview-h">
          Preview
        </h2>
        {/* A picture of the card: nothing in it can be used */}
        <div inert>
          <PostCard post={preview} cafe={cafe} place={place} state={state} now={now} onOpenPhoto={() => {}} />
        </div>
      </section>

      {describing !== null && form.photos[describing] && (
        <TextDialog
          key={describing}
          open
          title={`Describe photo ${describing + 1}`}
          label="Description (optional)"
          hint="Read out to people who use a screen reader."
          initial={form.photos[describing].alt}
          maxLength={120}
          onSave={(value) => describePhoto(describing, value)}
          onClose={() => setDescribing(null)}
        />
      )}
    </div>
  );
}
