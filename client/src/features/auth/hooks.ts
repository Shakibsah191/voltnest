import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from './api';
import { useAuthStore } from './auth.store';
import type { LoginInput, RegisterInput, SessionData } from './types';

function useStartSession() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  return (data: SessionData) => {
    // the server merged the guest cart into the account, so drop the guest copy
    queryClient.removeQueries({ queryKey: ['cart'] });
    setSession(data.user, data.accessToken);
  };
}

export function useLogin() {
  const start = useStartSession();
  return useMutation({ mutationFn: (input: LoginInput) => authApi.login(input), onSuccess: start });
}

export function useRegister() {
  const start = useStartSession();
  return useMutation({ mutationFn: (input: RegisterInput) => authApi.register(input), onSuccess: start });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const clear = useAuthStore((s) => s.clear);
  return useMutation({
    mutationFn: () => authApi.logout(),
    // log out locally even if the server can't be reached
    onSettled: () => {
      clear();
      queryClient.removeQueries({ queryKey: ['cart'] });
    },
  });
}

/** Only allow redirects inside this site, e.g. ?next=/checkout (never //evil.com). */
export function safeNext(next: string | null, fallback = '/') {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}
