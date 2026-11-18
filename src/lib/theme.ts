import type { Theme } from "@/data/types";

// Runs in <head> before first paint (see app/layout.tsx), exactly like the
// old app's inline script: "findit.theme" holds the bare word "dark" or
// "light". Anything else, or no storage at all, leaves the light default.
export const THEME_SCRIPT =
  'try{var t=localStorage.getItem("findit.theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}';

// The theme lives on <html>, outside React's tree, so it is set directly
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
}

export function currentTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}
