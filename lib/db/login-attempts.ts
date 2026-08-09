import type { SupabaseClient } from '@supabase/supabase-js';

const WINDOW_MINUTES = 15;

export async function recordLoginAttempt(client: SupabaseClient, email: string): Promise<void> {
  const { error } = await client.from('login_attempts').insert({ email: email.toLowerCase() });

  if (error) {
    throw new Error(error.message);
  }
}

export async function countRecentLoginAttempts(client: SupabaseClient, email: string): Promise<number> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count, error } = await client
    .from('login_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('email', email.toLowerCase())
    .gte('created_at', since);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}
