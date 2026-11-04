import { setAuthHandlers } from '@/shared/api-client';
import { authApi } from './api';
import { useAuthStore } from './auth.store';

let refreshing: Promise<string | null> | null = null;

/**
 * Ask the server for a fresh access token using the httpOnly refresh cookie.
 * If several requests hit a 401 at once, they all wait for this ONE refresh.
 */
export function refreshSession(): Promise<string | null> {
  refreshing ??= authApi
    .refresh()
    .then(({ user, accessToken }) => {
      useAuthStore.getState().setSession(user, accessToken);
      return accessToken;
    })
    .catch(() => {
      useAuthStore.getState().clear();
      return null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/** Called once at start-up: connects the API client to the session, then restores it after a reload. */
export function initSession() {
  setAuthHandlers({
    getToken: () => useAuthStore.getState().accessToken,
    refresh: refreshSession,
  });
  if (useAuthStore.getState().status === 'unknown') void refreshSession();
}
