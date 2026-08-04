import { NextResponse } from 'next/server';
import { validateLoginInput, validateStaffCredentials } from '@/lib/auth/session';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = validateLoginInput(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const user = await validateStaffCredentials(parsed.data.email, parsed.data.password);

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user });
}
