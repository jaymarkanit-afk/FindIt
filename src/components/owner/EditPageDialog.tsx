"use client";

import { useState, type FormEvent } from "react";
import { Overlay } from "@/components/overlay/Overlay";
import { useToast } from "@/components/shell/Toast";
import { saveCafeDetails, type Cafe } from "@/lib/api";
import { ABOUT_MAX, detailsInputOf, type DetailsError, type DetailsInput } from "@/lib/cafe";
import { STORAGE_FULL_DETAILS } from "@/lib/owner";
import styles from "./owner.module.css";

type Props = { cafe: Cafe; onClose: () => void };

// "Edit page": what customers see under the café's name. Only the café's
// own details; every field is optional and empty ones are hidden.
// Mount it when opening, so it starts from the saved details.
export function EditPageDialog({ cafe, onClose }: Props) {
  const toast = useToast();
  const [input, setInput] = useState<DetailsInput>(() => detailsInputOf(cafe));
  const [errors, setErrors] = useState<DetailsError[]>([]);
  const [storageFull, setStorageFull] = useState(false);

  const errorFor = (field: keyof DetailsInput) => errors.find((error) => error.field === field)?.message ?? "";
  // Typing in a field clears its error (either hours field clears both)
  const set = (field: keyof DetailsInput, value: string) => {
    setInput((current) => ({ ...current, [field]: value }));
    const cleared = field === "open" || field === "close" ? ["open", "close"] : [field];
    setErrors((current) => current.filter((error) => !cleared.includes(error.field)));
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await saveCafeDetails(cafe.id, input);
    if (result.ok) {
      onClose();
      toast("Page details saved");
      return;
    }
    setErrors(result.errors);
    setStorageFull(result.storageFull);
  }

  const field = (id: keyof DetailsInput, label: string, type: string, placeholder: string, autoComplete = "off") => (
    <div className={styles.fg}>
      <label htmlFor={`page-${id}`}>{label}</label>
      <input
        className={styles.fi}
        id={`page-${id}`}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={input[id]}
        aria-invalid={errorFor(id) ? true : undefined}
        aria-describedby={errorFor(id) ? `page-${id}-error` : undefined}
        onChange={(event) => set(id, event.target.value)}
      />
      {errorFor(id) && (
        <p className={styles.formError} id={`page-${id}-error`}>
          {errorFor(id)}
        </p>
      )}
    </div>
  );

  return (
    <Overlay open onClose={onClose} title="Edit page">
      <form className={styles.pageForm} onSubmit={(event) => void submit(event)} noValidate>
        <p className={styles.pageNote}>Shown on your café page under its name. Leave a field empty to hide it. Change the background on the banner and your highlights below it.</p>
        <div className={styles.fg}>
          <div className={styles.fgRow}>
            <label htmlFor="page-about">About</label>
            <span className={styles.secNote} id="page-about-count">
              {input.about.length} / {ABOUT_MAX}
            </span>
          </div>
          <textarea
            className={`${styles.fi} ${styles.textarea}`}
            id="page-about"
            maxLength={ABOUT_MAX}
            placeholder="A line about your café"
            value={input.about}
            aria-describedby="page-about-count"
            data-autofocus=""
            onChange={(event) => set("about", event.target.value)}
          />
        </div>
        {field("phone", "Phone", "tel", "0917 000 0000")}
        {field("facebook", "Facebook link", "url", "https://facebook.com/yourcafe")}
        {field("instagram", "Instagram link", "url", "https://instagram.com/yourcafe")}
        <fieldset className={styles.hoursSet}>
          <legend>Hours (same every day)</legend>
          <div className={styles.hoursRow}>
            {field("open", "Opens", "time", "")}
            {field("close", "Closes", "time", "")}
          </div>
        </fieldset>
        {storageFull && (
          <p className={styles.formError} role="alert">
            {STORAGE_FULL_DETAILS}
          </p>
        )}
        {errors.length > 0 && (
          <p className="visually-hidden" role="alert">
            {errors.length === 1 ? "1 thing to fix." : `${errors.length} things to fix.`}
          </p>
        )}
        <div className={styles.pageBtns}>
          <button type="button" className="btn btn-quiet" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-accent">
            Save
          </button>
        </div>
      </form>
    </Overlay>
  );
}
