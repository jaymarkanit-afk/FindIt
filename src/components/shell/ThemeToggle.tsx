"use client";

import { useEffect } from "react";
import { Icon } from "@/components/Icon";
import { setTheme } from "@/lib/api";
import { useUserState } from "@/lib/hooks";
import { applyTheme } from "@/lib/theme";

// A toggle button: "Dark theme", pressed when dark. The saved choice is
// applied before first paint by THEME_SCRIPT; this keeps <html> in step
// with later changes, including ones made in another tab.
export function ThemeToggle() {
  const { theme } = useUserState();
  const dark = theme === "dark";

  useEffect(() => {
    if (theme) applyTheme(theme);
  }, [theme]);

  function toggle() {
    const next = dark ? "light" : "dark";
    applyTheme(next);
    void setTheme(next);
  }

  return (
    <button type="button" className="icon-btn" aria-label="Dark theme" aria-pressed={dark} onClick={toggle}>
      <Icon name={dark ? "sun" : "moon"} />
    </button>
  );
}
