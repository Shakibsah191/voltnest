import { create } from 'zustand';
import type { User } from './types';

/**
 * unknown       → we haven't asked the server yet (first moment after a page load)
 * authenticated → we have a user and an access token
 * guest         → not logged in
 */
export type AuthStatus = 'unknown' | 'authenticated' | 'guest';

/** Not a secret: only says "this browser had a session", so guests skip the refresh call. */
const SESSION_HINT = 'voltnest-session';

export const hadSession = () => {
  try {
    return localStorage.getItem(SESSION_HINT) === '1';
  } catch {
    return false;
  }
};

const setHint = (on: boolean) => {
  try {
    if (on) localStorage.setItem(SESSION_HINT, '1');
    else localStorage.removeItem(SESSION_HINT);
  } catch {
    /* private mode: fine, we just refresh every time */
  }
};

interface AuthState {
  status: AuthStatus;
  user: User | null;
  /** Lives in memory only, never in localStorage, so a script injected into the page can't steal a saved copy. */
  accessToken: string | null;
  setSession: (user: User, accessToken: string) => void;
  setUser: (user: User) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: hadSession() ? 'unknown' : 'guest',
  user: null,
  accessToken: null,
  setSession: (user, accessToken) => {
    setHint(true);
    set({ status: 'authenticated', user, accessToken });
  },
  setUser: (user) => set({ user }),
  clear: () => {
    setHint(false);
    set({ status: 'guest', user: null, accessToken: null });
  },
}));
