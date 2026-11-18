"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./shell.module.css";

// Short confirmations ("Showing San Francisco"), as the old app's showToast().
// The live region is always in the page so screen readers announce each
// message; it sits outside the part of the page an overlay makes inert.

const TOAST_MS = 2200;
type ShowToast = (message: string) => void;
const ToastContext = createContext<ShowToast>(() => {});

export function useToast(): ShowToast {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback<ShowToast>((next) => {
    clearTimeout(timer.current);
    setMessage(next);
    setVisible(true);
    timer.current = setTimeout(() => setVisible(false), TOAST_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={styles.toast} data-visible={visible} role="status" aria-live="polite" aria-atomic="true">
        {visible ? message : ""}
      </div>
    </ToastContext.Provider>
  );
}
