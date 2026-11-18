// While any overlay is open, the page behind it is inert (no focus, no
// clicks, hidden from screen readers).
//
// `inert` is set directly on the app's root (marked data-app-root) from the
// overlay's layout effect, not through a React render: browsers do not focus
// inert elements, so `inert` must be gone the moment the last overlay
// closes, before focus returns to its trigger and before any other effect
// in the same render moves focus.

let openCount = 0;

function appRoot(): HTMLElement | null {
  return typeof document === "undefined" ? null : document.querySelector<HTMLElement>("[data-app-root]");
}

// Call when an overlay opens; call the returned function when it closes
export function makePageInert(): () => void {
  openCount += 1;
  appRoot()?.setAttribute("inert", "");
  let released = false;
  return () => {
    if (released) return;
    released = true;
    openCount -= 1;
    if (openCount === 0) appRoot()?.removeAttribute("inert");
  };
}
