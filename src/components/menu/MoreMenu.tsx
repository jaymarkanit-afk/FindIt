"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/Icon";
import { Overlay } from "@/components/overlay/Overlay";
import { closeMenu, getIsPhone, getOpenMenu, getServerIsPhone, getServerOpenMenu, setOpenMenu, subscribeMenu, subscribePhone } from "./menuStore";
import styles from "./menu.module.css";

export type MenuItem = {
  label: string;
  onSelect: () => void;
  // A destructive item: shown in red, last, and asks first ("Keep" / action)
  confirm?: { question: string; action: string };
};

type Props = { itemName: string; items: MenuItem[]; className?: string };

// The shared "..." menu. A 44px "More options" button opens a small menu
// below it (a bottom sheet on phones). Arrow keys, Home and End move between
// items, Enter selects, Escape or a click outside closes it, and focus goes
// back to the button. One menu is open at a time. Destructive items ask
// first, inline, never with a browser popup.
export function MoreMenu({ itemName, items, className }: Props) {
  const id = useId();
  const menuId = `${id}-menu`;
  const open = useSyncExternalStore(subscribeMenu, getOpenMenu, getServerOpenMenu) === id;
  const phone = useSyncExternalStore(subscribePhone, getIsPhone, getServerIsPhone);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [position, setPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<"first" | "keep" | null>(null);
  const ordered = [...items.filter((item) => !item.confirm), ...items.filter((item) => item.confirm)];

  // Move focus into the menu after it opens or switches to the confirm
  useEffect(() => {
    const target = pendingFocus.current;
    if (!target || !open || !panel.current) return;
    pendingFocus.current = null;
    const selector = target === "keep" ? "[data-keep]" : '[role="menuitem"]';
    panel.current.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
  });

  // Desktop dropdown: a click outside closes it. On scroll or resize it
  // follows its button (a scroll can arrive just after opening, e.g. from
  // momentum), and closes only once the button has left the screen.
  useEffect(() => {
    if (!open || phone) return;
    const outside = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && (panel.current?.contains(target) || button.current?.contains(target))) return;
      closeMenu(id);
      // Clicking on nothing focusable would leave focus nowhere: bring it back
      setTimeout(() => {
        if (document.activeElement === document.body) button.current?.focus();
      });
    };
    const follow = () => {
      const rect = button.current?.getBoundingClientRect();
      if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) {
        closeMenu(id);
        return;
      }
      setPosition({ top: rect.bottom + 4, right: Math.max(8, window.innerWidth - rect.right) });
    };
    document.addEventListener("pointerdown", outside);
    window.addEventListener("scroll", follow, true);
    window.addEventListener("resize", follow);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("scroll", follow, true);
      window.removeEventListener("resize", follow);
    };
  }, [open, phone, id]);

  function toggle() {
    if (open) {
      closeMenu(id);
      return;
    }
    const rect = button.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom + 4, right: Math.max(8, window.innerWidth - rect.right) });
    setConfirming(null);
    pendingFocus.current = "first";
    setOpenMenu(id);
  }

  // On phones the sheet returns focus itself when it closes
  function close(returnFocus: boolean) {
    closeMenu(id);
    setConfirming(null);
    if (returnFocus && !phone) button.current?.focus();
  }

  function select(index: number) {
    const item = ordered[index];
    if (item.confirm) {
      pendingFocus.current = "keep";
      setConfirming(index);
      return;
    }
    close(true);
    item.onSelect();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close(true);
      return;
    }
    if (event.key === "Tab" && !phone) {
      event.preventDefault();
      close(true);
      return;
    }
    const list = Array.from(panel.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    if (!list.length) return;
    const at = list.findIndex((element) => element === document.activeElement);
    const moves: Record<string, number> = { ArrowDown: (at + 1) % list.length, ArrowUp: (at - 1 + list.length) % list.length, Home: 0, End: list.length - 1 };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    list[next].focus();
  }

  const body =
    confirming !== null && ordered[confirming]?.confirm ? (
      <div className={styles.confirm} role="group" aria-label={ordered[confirming].confirm.question}>
        <p className={styles.question}>{ordered[confirming].confirm.question}</p>
        <div className={styles.confirmBtns}>
          <button type="button" className="btn btn-quiet" data-keep="" onClick={() => close(true)}>
            Keep
          </button>
          <button
            type="button"
            className={`btn ${styles.dangerFill}`}
            onClick={() => {
              const item = ordered[confirming];
              close(true);
              item.onSelect();
            }}
          >
            {ordered[confirming].confirm.action}
          </button>
        </div>
      </div>
    ) : (
      <div role="menu" aria-label={`Options for ${itemName}`} className={styles.items}>
        {ordered.map((item, index) => (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            tabIndex={-1}
            className={`${styles.item} ${item.confirm ? styles.danger : ""}`}
            data-autofocus={index === 0 ? "" : undefined}
            onClick={() => select(index)}
          >
            {item.label}
          </button>
        ))}
      </div>
    );

  return (
    <span className={`${styles.wrap} ${className ?? ""}`}>
      <button
        ref={button}
        type="button"
        className={`icon-btn ${styles.button}`}
        aria-label={`More options for ${itemName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={toggle}
      >
        <Icon name="dots" className="ico-dots" />
      </button>
      {open &&
        (phone ? (
          <Overlay open onClose={() => close(false)} title={`Options for ${itemName}`} onPanelKeyDown={onKeyDown}>
            <div ref={panel} id={menuId}>
              {body}
            </div>
          </Overlay>
        ) : (
          typeof document !== "undefined" &&
          createPortal(
            <div ref={panel} id={menuId} className={styles.dropdown} style={{ top: position.top, right: position.right }} onKeyDown={onKeyDown}>
              {body}
            </div>,
            document.body,
          )
        ))}
    </span>
  );
}
