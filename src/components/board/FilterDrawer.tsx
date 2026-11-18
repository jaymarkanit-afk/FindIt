"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Overlay } from "@/components/overlay/Overlay";
import { useToast } from "@/components/shell/Toast";
import { BOARD_FILTERS, type BoardFilter } from "@/lib/board";
import { setBoardFilter } from "@/lib/boardView";
import styles from "./board.module.css";

type Props = { open: boolean; current: BoardFilter; onClose: () => void };

// The filter drawer: pick a card, then "Apply filter" (the old drawer).
// Mount it with a key per opening so it starts on the current filter.
export function FilterDrawer({ open, current, onClose }: Props) {
  const toast = useToast();
  const [picked, setPicked] = useState<BoardFilter>(current);

  function apply() {
    setBoardFilter(picked);
    onClose();
    toast(`Showing: ${BOARD_FILTERS.find((item) => item.key === picked)?.label ?? "All cafés"}`);
  }

  return (
    <Overlay open={open} onClose={onClose} title="Filters">
      <div className={styles.drawerGrid} role="group" aria-label="Show">
        {BOARD_FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={styles.drawerCard}
            aria-pressed={picked === item.key}
            data-autofocus={picked === item.key ? "" : undefined}
            onClick={() => setPicked(item.key)}
          >
            <Icon name={item.icon} />
            {item.label}
          </button>
        ))}
      </div>
      <button type="button" className={`btn btn-accent ${styles.btnBlock}`} onClick={apply}>
        Apply filter
      </button>
    </Overlay>
  );
}
