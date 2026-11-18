"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent } from "react";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/shell/Toast";
import type { Cafe } from "@/lib/api";
import { bestMatch } from "@/lib/board";
import { setBoardSearch } from "@/lib/boardView";
import { useBoardView } from "@/lib/hooks";

type Props = { cafes: readonly Cafe[]; placeName: string; className?: string };

// "Search cafés": typing filters the board (two letters or more); Enter
// opens the best match, this place first, as in the old app. The top bar
// (wider screens) and the board (phones) show the same search.
export function SearchField({ cafes, placeName, className }: Props) {
  const router = useRouter();
  const toast = useToast();
  const { search } = useBoardView();

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const term = search.trim();
    if (!term) {
      toast("Enter a café name to search");
      return;
    }
    const cafe = bestMatch(cafes, placeName, term);
    if (cafe) router.push(`/cafe/${cafe.id}`);
    else toast(`No café found matching "${term.toLowerCase()}"`);
  }

  return (
    <label className={`search-field ${className ?? ""}`}>
      <Icon name="search" />
      <input
        type="search"
        placeholder="Search cafés"
        aria-label="Search cafés"
        value={search}
        onChange={(event) => setBoardSearch(event.target.value)}
        onKeyDown={onKeyDown}
      />
    </label>
  );
}
