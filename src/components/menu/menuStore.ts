// Which "..." menu is open: one at a time across the whole app. Opening a
// menu closes any other.

let openId: string | null = null;
const listeners = new Set<() => void>();

export function subscribeMenu(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getOpenMenu = () => openId;
export const getServerOpenMenu = (): string | null => null;

export function setOpenMenu(id: string | null): void {
  if (openId === id) return;
  openId = id;
  for (const listener of listeners) listener();
}

// Closes the menu only if it is this one (another may have opened since)
export function closeMenu(id: string): void {
  if (openId === id) setOpenMenu(null);
}

// Phones get a bottom sheet instead of a dropdown
const PHONE_QUERY = "(max-width: 699px)";

export function subscribePhone(listener: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

export const getIsPhone = () => typeof window !== "undefined" && Boolean(window.matchMedia?.(PHONE_QUERY).matches);
export const getServerIsPhone = () => false;
