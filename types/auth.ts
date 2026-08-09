import type { SessionUser } from '@/lib/auth/session';

export interface LoginResponse {
  ok: true;
  user: SessionUser;
}

export interface MeResponse {
  user: SessionUser;
}

export interface InviteResponse {
  ok: true;
  email: string;
}
