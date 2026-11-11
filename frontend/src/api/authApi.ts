import { http } from './client';
import type { AuthResponse, Role, User } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    http.post<AuthResponse>('/api/auth/login', { email, password }).then((r) => r.data),

  register: (payload: { name: string; email: string; password: string; role: Role }) =>
    http.post<AuthResponse>('/api/auth/register', payload).then((r) => r.data),

  me: () => http.get<User>('/api/auth/me').then((r) => r.data),
};
