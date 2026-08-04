'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/auth/supabase';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const redirectTo = searchParams.get('redirect') ?? '/dashboard';
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        throw error;
      }

      router.replace(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: '4rem auto', padding: '2rem', background: '#fff', borderRadius: 12 }}>
      <h1>CareFlow staff sign in</h1>
      <p style={{ color: '#475569' }}>Use your Supabase-authenticated staff account to continue.</p>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
        <label>
          <div>Email</div>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
            style={{ width: '100%', padding: '0.75rem' }}
          />
        </label>
        <label>
          <div>Password</div>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            required
            style={{ width: '100%', padding: '0.75rem' }}
          />
        </label>
        {error ? <div style={{ color: '#b91c1c' }}>{error}</div> : null}
        <button type="submit" disabled={loading} style={{ padding: '0.8rem 1rem' }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
