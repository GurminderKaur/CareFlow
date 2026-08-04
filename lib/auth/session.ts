import { z } from 'zod';
import { createServerComponentClient } from '@/lib/auth/supabase';

export interface SessionUser {
  id: string;
  email: string;
  role: 'staff' | 'admin';
}

const loginSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export function validateLoginInput(input: unknown) {
  return loginSchema.safeParse(input);
}

export function hasRequiredRole(user: SessionUser | null, requiredRole: SessionUser['role']) {
  if (!user) {
    return false;
  }

  return user.role === requiredRole || user.role === 'admin';
}

export function getRoleFromMetadata(role: unknown): SessionUser['role'] | null {
  return role === 'admin' || role === 'staff' ? role : null;
}

export async function validateStaffCredentials(email: string, password: string): Promise<SessionUser | null> {
  const supabase = await createServerComponentClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return null;
  }

  const role = getRoleFromMetadata(data.user.user_metadata?.role) ?? 'staff';

  return {
    id: data.user.id,
    email: data.user.email ?? email,
    role,
  };
}

export async function getCurrentSessionUser(): Promise<SessionUser | null> {
  const supabase = await createServerComponentClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  const role = getRoleFromMetadata(data.user.user_metadata?.role) ?? 'staff';

  return {
    id: data.user.id,
    email: data.user.email ?? '',
    role,
  };
}
