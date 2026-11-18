"use client";

import { useEffect } from "react";
import { setLastCafe } from "@/lib/api";

// Saves the café as the last one opened (findit.cafe), so the Café tab
// returns to it, as in the old app
export function RememberCafe({ id }: { id: number }) {
  useEffect(() => {
    void setLastCafe(id);
  }, [id]);
  return null;
}
