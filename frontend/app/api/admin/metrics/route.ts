import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function startOfTodayUTC() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function daysAgoUTC(n: number) {
  const d = startOfTodayUTC();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

export async function GET() {
  try {
    // Auth users (Supabase Admin API)
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (usersError) throw usersError;

    const users = usersData?.users ?? [];
    const totalUsers = users.length;

    const today = startOfTodayUTC();
    const weekAgo = daysAgoUTC(6);

    const todayNewUsers = users.filter((u) => u.created_at && new Date(u.created_at) >= today).length;
    const todaySignins = users.filter((u) => u.last_sign_in_at && new Date(u.last_sign_in_at) >= today).length;
    const activeToday = todaySignins;

    // Subscriptions
    const { data: subs } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id, plan, status, current_period_end');

    const activePaid = (subs ?? []).filter((s) => {
      if (s.status !== 'active') return false;
      if (s.plan === 'free' || !s.plan) return false;
      if (s.current_period_end && new Date(s.current_period_end) < new Date()) return false;
      return true;
    });
    const paidUsers = activePaid.length;
    const freeUsers = Math.max(totalUsers - paidUsers, 0);

    // Rough revenue from active Pro (PKR 999/mo) — stays 0 until real payments exist
    const monthRevenue = paidUsers * 999;
    const totalRevenue = monthRevenue;

    // Queries + FIR placeholders
    const { count: totalChats } = await supabaseAdmin
      .from('queries')
      .select('*', { count: 'exact', head: true });

    // Daily signups (last 7 days, Mon→Sun chart order)
    const signupCounts = [0, 0, 0, 0, 0, 0, 0];
    for (const u of users) {
      if (!u.created_at) continue;
      const created = new Date(u.created_at);
      if (created < weekAgo) continue;
      signupCounts[created.getUTCDay()] += 1;
    }
    const order = [1, 2, 3, 4, 5, 6, 0];
    const dailySignups = order.map((d) => ({ day: DAY_LABELS[d], users: signupCounts[d] }));

    // Daily revenue — 0 unless we have paid users created that day (simple estimate)
    const dailyRevenue = order.map((d) => ({ day: DAY_LABELS[d], revenue: 0 }));

    // Recent users
    const recentUsers = [...users]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 8)
      .map((u) => {
        const sub = (subs ?? []).find((s) => s.user_id === u.id && s.status === 'active' && s.plan !== 'free');
        const plan = sub?.plan === 'enterprise' ? 'Enterprise' : sub ? 'Pro' : 'Free';
        const joinedAt = u.created_at ? new Date(u.created_at) : null;
        return {
          name: (u.user_metadata?.name as string) || (u.user_metadata?.full_name as string) || u.email?.split('@')[0] || 'User',
          email: u.email || '—',
          plan,
          joined: joinedAt ? relativeTime(joinedAt) : '—',
          status: u.last_sign_in_at && new Date(u.last_sign_in_at) >= today ? 'active' : 'inactive',
        };
      });

    // Recent activity from queries
    const { data: recentQueries } = await supabaseAdmin
      .from('queries')
      .select('user_id, query, created_at')
      .order('created_at', { ascending: false })
      .limit(8);

    const userById = new Map(users.map((u) => [u.id, u]));
    const recentActivity = (recentQueries ?? []).map((q) => {
      const u = userById.get(q.user_id);
      const name =
        (u?.user_metadata?.name as string) || (u?.user_metadata?.full_name as string) || u?.email?.split('@')[0] || 'User';
      return {
        user: name,
        action: `Asked: ${(q.query || '').slice(0, 48)}${(q.query || '').length > 48 ? '…' : ''}`,
        time: q.created_at ? relativeTime(new Date(q.created_at)) : '—',
        type: 'chat' as const,
      };
    });

    // Also surface recent signups in activity if few queries
    const signupActivity = [...users]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 4)
      .map((u) => ({
        user: (u.user_metadata?.name as string) || (u.user_metadata?.full_name as string) || u.email?.split('@')[0] || 'User',
        action: 'Signed up',
        time: u.created_at ? relativeTime(new Date(u.created_at)) : '—',
        type: 'signup' as const,
      }));

    const mergedActivity = [...recentActivity, ...signupActivity]
      .slice(0, 8);

    return NextResponse.json({
      stats: {
        totalUsers,
        todaySignins,
        todayNewUsers,
        freeUsers,
        paidUsers,
        totalRevenue,
        monthRevenue,
        totalChats: totalChats ?? 0,
        totalFIRs: 0,
        activeToday,
      },
      dailySignups,
      dailyRevenue,
      pieData: [
        { name: 'Free Users', value: freeUsers },
        { name: 'Paid Users', value: paidUsers },
      ],
      recentUsers,
      recentActivity: mergedActivity,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load metrics';
    // Still return zeros so charts render empty instead of crashing
    const emptyDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({ day, users: 0 }));
    const emptyRev = emptyDays.map(({ day }) => ({ day, revenue: 0 }));
    return NextResponse.json(
      {
        stats: {
          totalUsers: 0,
          todaySignins: 0,
          todayNewUsers: 0,
          freeUsers: 0,
          paidUsers: 0,
          totalRevenue: 0,
          monthRevenue: 0,
          totalChats: 0,
          totalFIRs: 0,
          activeToday: 0,
        },
        dailySignups: emptyDays,
        dailyRevenue: emptyRev,
        pieData: [
          { name: 'Free Users', value: 0 },
          { name: 'Paid Users', value: 0 },
        ],
        recentUsers: [],
        recentActivity: [],
        updatedAt: new Date().toISOString(),
        warning: message,
      },
      { status: 200 }
    );
  }
}

function relativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}
