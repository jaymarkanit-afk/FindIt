"use client";

import { useState, type FormEvent } from "react";
import { Overlay } from "@/components/overlay/Overlay";
import styles from "./menu.module.css";

type Props = {
  open: boolean;
  title: string; // "Edit label"
  label: string; // the field's label
  initial: string;
  maxLength: number;
  hint?: string;
  onSave: (value: string) => void;
  onClose: () => void;
};

// A small dialog with one text field and Save / Cancel ("Edit label",
// "Describe photo"). Mount it with a key per opening so it starts fresh.
export function TextDialog({ open, title, label, initial, maxLength, hint, onSave, onClose }: Props) {
  const [value, setValue] = useState(initial);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(value);
    onClose();
  }

  return (
    <Overlay open={open} onClose={onClose} title={title}>
      <form className={styles.dialogForm} onSubmit={submit}>
        <label className={styles.dialogLabel} htmlFor="text-dialog-field">
          {label}
        </label>
        <input
          id="text-dialog-field"
          className={styles.dialogField}
          type="text"
          maxLength={maxLength}
          value={value}
          data-autofocus=""
          aria-describedby={hint ? "text-dialog-hint" : undefined}
          onChange={(event) => setValue(event.target.value)}
        />
        {hint && (
          <p className={styles.dialogHint} id="text-dialog-hint">
            {hint}
          </p>
        )}
        <div className={styles.confirmBtns}>
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
