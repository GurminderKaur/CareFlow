import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/auth/supabase';

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const response = NextResponse.redirect(new URL('/login', origin));
  const supabase = await createServerComponentClient();
  await supabase.auth.signOut();

  return response;
}
