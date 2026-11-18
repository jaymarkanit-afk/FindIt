// How many overlays are open. The app shell reads it to make the page
// behind an open overlay inert (no focus, no clicks, hidden from screen
// readers), declaratively, through useSyncExternalStore.

let openCount = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

// Returns the function that unregisters it
export function registerOpenOverlay(): () => void {
  openCount += 1;
  emit();
  let done = false;
  return () => {
    if (done) return;
    done = true;
    openCount -= 1;
    emit();
  };
}

export function subscribeOverlays(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getOpenOverlayCount = () => openCount;
export const getServerOpenOverlayCount = () => 0;
