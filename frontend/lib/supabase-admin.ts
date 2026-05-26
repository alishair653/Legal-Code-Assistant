import { createClient } from '@supabase/supabase-js';
import type { Plan } from './supabase';

// Server-only admin client — bypasses RLS
// ONLY import this file in API routes (app/api/...), never in client components
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Subscription helpers ──────────────────────────────────────────────────────

export async function getUserPlan(userId: string): Promise<Plan> {
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('plan, status, current_period_end')
    .eq('user_id', userId)
    .single();

  if (!data) return 'free';

  if (data.status === 'active' && data.current_period_end) {
    const expired = new Date(data.current_period_end) < new Date();
    if (expired) {
      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('user_id', userId);
      return 'free';
    }
  }

  return (data.plan as Plan) ?? 'free';
}

// ── Usage helpers ─────────────────────────────────────────────────────────────

const FREE_DAILY_LIMIT = 10;

export async function checkDailyLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabaseAdmin
    .from('usage')
    .select('query_count')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  const count = data?.query_count ?? 0;
  const remaining = Math.max(FREE_DAILY_LIMIT - count, 0);
  return { allowed: count < FREE_DAILY_LIMIT, remaining };
}

export async function incrementUsage(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  await supabaseAdmin.rpc('increment_usage', { p_user_id: userId, p_date: today });
}

// ── Query history helpers ─────────────────────────────────────────────────────

export async function saveQuery(userId: string, query: string, response: string) {
  await supabaseAdmin.from('queries').insert({ user_id: userId, query, response });
}

export async function getUserQueries(userId: string, limit = 20) {
  const { data } = await supabaseAdmin
    .from('queries')
    .select('id, query, response, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return data ?? [];
}
