'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

const navItems = [{ href: '/dashboard', label: 'Dashboard' }];

export function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col justify-between border-r border-slate-200 bg-white px-4 py-6">
        <div>
          <div className="mb-8 px-2 text-lg font-semibold text-slate-900">CareFlow</div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  pathname === item.href ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Sign out
        </button>
      </aside>
      <main className="flex-1 px-8 py-8">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">{title}</h1>
        {children}
      </main>
    </div>
  );
}
