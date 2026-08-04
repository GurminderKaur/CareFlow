"use client";

import { useRouter } from 'next/navigation';

export function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>{title}</h1>
        <button onClick={handleLogout} style={{ padding: '0.6rem 0.9rem' }}>
          Log out
        </button>
      </div>
      <div>{children}</div>
    </main>
  );
}
