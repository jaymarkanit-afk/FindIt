"use client";

import { useState, type FormEvent } from "react";
import { useToast } from "@/components/shell/Toast";
import { ownerSignIn } from "@/lib/api";
import styles from "./owner.module.css";

// The demo sign-in, as the old Owner panel: any email and password works,
// and says so. The session lasts until the page is reloaded.
export function OwnerGate() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await ownerSignIn(email, password)) toast("Welcome back!");
    else toast("Please enter your credentials");
  }

  return (
    <div className={styles.gatePage}>
      <header className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Owner</h1>
        <p className={styles.pageIntro}>Sign in to post updates for your café.</p>
      </header>
      <form className={styles.formCard} onSubmit={(event) => void submit(event)} noValidate>
        <div className={styles.fg}>
          <label htmlFor="ow-email">Business email</label>
          <input className={styles.fi} type="email" id="ow-email" placeholder="owner@yourcafe.com" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <div className={styles.fg}>
          <label htmlFor="ow-pass">Password</label>
          <input className={styles.fi} type="password" id="ow-pass" placeholder="Password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>
        <button type="submit" className={`btn btn-accent ${styles.btnBlock}`}>
          Sign in
        </button>
        <p className={styles.fgNote}>Demo: any email and password works</p>
      </form>
    </div>
  );
}
