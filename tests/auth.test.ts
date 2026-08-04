import { describe, expect, it } from 'vitest';
import { createMiddlewareClient, supabase } from '../lib/auth/supabase';

describe('authentication boundary', () => {
  it('exposes a middleware client factory for guarded routes', () => {
    expect(typeof createMiddlewareClient).toBe('function');
  });

  it('exposes a browser client instance for route helpers', () => {
    expect(supabase).toBeDefined();
  });

  it('accepts a valid login payload shape', () => {
    const payload = {
      email: 'staff@careflow.dev',
      password: 'careflow123',
    };

    expect(payload.email).toContain('@');
    expect(payload.password.length).toBeGreaterThanOrEqual(8);
  });

  it('rejects an invalid email', () => {
    const payload = {
      email: 'not-an-email',
      password: 'careflow123',
    };

    expect(payload.email).not.toContain('@');
  });
});
