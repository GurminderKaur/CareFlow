import { describe, expect, it } from 'vitest';
import { createMiddlewareClient, createClient } from '../lib/auth/supabase';
import { validateLoginInput, validateInviteInput, hasRequiredRole, getRoleFromMetadata } from '../lib/auth/session';

describe('authentication boundary', () => {
  it('exposes a middleware client factory for guarded routes', () => {
    expect(typeof createMiddlewareClient).toBe('function');
  });

  it('exposes a browser client factory for route helpers', () => {
    expect(typeof createClient).toBe('function');
  });

  it('accepts a valid login payload', () => {
    const result = validateLoginInput({ email: 'staff@careflow.dev', password: 'careflow123' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = validateLoginInput({ email: 'not-an-email', password: 'careflow123' });
    expect(result.success).toBe(false);
  });

  it('rejects a password under 8 characters', () => {
    const result = validateLoginInput({ email: 'staff@careflow.dev', password: 'short' });
    expect(result.success).toBe(false);
  });

  it('maps unknown metadata roles to null', () => {
    expect(getRoleFromMetadata('owner')).toBeNull();
    expect(getRoleFromMetadata('admin')).toBe('admin');
  });

  it('allows admins to satisfy a staff requirement', () => {
    expect(hasRequiredRole({ id: '1', email: 'a@b.com', role: 'admin' }, 'staff')).toBe(true);
  });

  it('denies access when there is no user', () => {
    expect(hasRequiredRole(null, 'staff')).toBe(false);
  });

  it('accepts a valid invite email', () => {
    const result = validateInviteInput({ email: 'new-staff@careflow.dev' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid invite email', () => {
    const result = validateInviteInput({ email: 'not-an-email' });
    expect(result.success).toBe(false);
  });
});
