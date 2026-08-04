import { NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase';
import { validateLoginInput } from '@/lib/auth/session';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = validateLoginInput(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        role: 'staff',
      },
    },
  });

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message ?? 'Unable to create account' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, user: data.user });
}
