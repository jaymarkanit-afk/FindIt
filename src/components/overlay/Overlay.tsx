"use client";

import { useId, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/Icon";
import { makePageInert } from "./overlayStore";
import styles from "./overlay.module.css";

// One accessible overlay for the filter drawer ("sheet"), the alerts panel
// ("side"), the place picker ("sheet") and the photo viewer ("viewer").
//
// - role="dialog" + aria-modal, named by its title
// - focus moves in on open: to the element marked data-autofocus, else the
//   first focusable element; Tab and Shift+Tab stay inside
// - Escape, the close button and a click on the backdrop call onClose
// - focus returns to whatever had it before opening (usually the trigger)
// - the page behind (the shell's data-app-root) is inert while it is open
//
// Focus has to be moved with element.focus(); that and the focusable-element
// lookup inside the panel are the only direct DOM calls here.

export type OverlayVariant = "sheet" | "side" | "viewer";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  hideTitle?: boolean;
  variant?: OverlayVariant;
  // Extra keys for the whole panel (the photo viewer's arrow keys)
  onPanelKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  children: ReactNode;
};

export function Overlay({ open, ...rest }: Props) {
  if (!open || typeof document === "undefined") return null;
  return createPortal(<OverlayPanel {...rest} />, document.body);
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
}

function OverlayPanel({ onClose, title, hideTitle = false, variant = "sheet", onPanelKeyDown, children }: Omit<Props, "open">) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // A layout effect: the page becomes inert (and focus moves in) before the
  // browser paints, and on close `inert` is gone before focus returns.
  // An overlay that opens as another closes (a menu sheet opening a dialog)
  // runs after that close, so it records the original trigger.
  useLayoutEffect(() => {
    const returnTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const release = makePageInert();
    const panel = panelRef.current;
    if (panel) {
      const target = panel.querySelector<HTMLElement>("[data-autofocus]") ?? focusables(panel)[0] ?? panel;
      target.focus();
    }
    return () => {
      release();
      // The trigger may have re-rendered; only return focus if it still exists
      if (returnTo?.isConnected) returnTo.focus();
    };
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    onPanelKeyDown?.(event);
    const panel = panelRef.current;
    if (event.key !== "Tab" || !panel) return;
    const items = focusables(panel);
    if (items.length === 0) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className={styles.root} data-variant={variant} data-overlay-open="">
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <div className={styles.head}>
          <h2 id={titleId} className={hideTitle ? "visually-hidden" : styles.title}>
            {title}
          </h2>
          <button type="button" className={`icon-btn ${styles.close}`} aria-label="Close" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
