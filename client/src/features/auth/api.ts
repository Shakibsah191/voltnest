import { api, apiRequest } from '@/shared/api-client';
import type { LoginInput, RegisterInput, SessionData, User } from './types';

export const authApi = {
  login: (body: LoginInput) => api.post<SessionData>('/auth/login', body, { auth: false }).then((r) => r.data),
  register: (body: RegisterInput) => api.post<SessionData>('/auth/register', body, { auth: false }).then((r) => r.data),
  refresh: () => apiRequest<SessionData>('/auth/refresh', { method: 'POST', auth: false }).then((r) => r.data),
  logout: () => api.post<{ loggedOut: boolean }>('/auth/logout', undefined, { auth: false }),
  me: () => api.get<{ user: User }>('/auth/me').then((r) => r.data.user),
};
