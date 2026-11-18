// The demo owner's sign-in. As in the old app it is a flag in memory:
// moving between pages keeps it, a reload signs the owner out, and any
// email and password are accepted. Real accounts come with the backend.

let signedIn = false;
const listeners = new Set<() => void>();

function set(next: boolean) {
  signedIn = next;
  for (const listener of listeners) listener();
}

export function subscribeOwnerSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getOwnerSession = () => signedIn;
export const getServerOwnerSession = () => false;

export function signIn(): void {
  set(true);
}

export function signOut(): void {
  set(false);
}
