import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

type MemberRow = {
  id: string;
  username: string | null;
  created_at: string;
  last_seen_at: string | null;
  member_moderation?: { is_verified: boolean; banned_at: string | null }[] | null;
};

type AuditRow = {
  id: number;
  action: string;
  created_at: string;
  target_user_id: string | null;
};

type DailyActivityRow = {
  user_id: string;
  username: string | null;
  active_minutes: number;
  messages_sent: number;
  messages_received: number;
  chat_partners: number;
  activity_alert: boolean;
};

type DailyActivityReport = {
  report_date: string;
  timezone: string;
  members: DailyActivityRow[];
};

export const SuperAdminPanel: React.FC<{ email: string; onSignOut: () => void }> = ({ email, onSignOut }) => {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [dailyReport, setDailyReport] = useState<DailyActivityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!supabase) { setError('Supabase is not configured.'); setLoading(false); return; }
    setLoading(true);
    setError('');
    const auth = await supabase.rpc('is_current_user_super_admin');
    if (auth.error || auth.data !== true) {
      setAuthorized(false);
      setLoading(false);
      return;
    }
    setAuthorized(true);
    const [memberResult, moderationResult, auditResult, activityResult] = await Promise.all([
      supabase.from('profiles').select('id, username, created_at, last_seen_at').order('created_at', { ascending: false }),
      supabase.from('member_moderation').select('user_id, is_verified, banned_at'),
      supabase.from('admin_audit_log').select('id, action, created_at, target_user_id').order('created_at', { ascending: false }).limit(30),
      supabase.rpc('get_latest_admin_daily_report'),
    ]);
    if (memberResult.error) setError(memberResult.error.message);
    else {
      const moderation = new Map((moderationResult.data ?? []).map((row) => [row.user_id, row]));
      setMembers((memberResult.data ?? []).map((row) => ({ ...row, member_moderation: moderation.has(row.id) ? [moderation.get(row.id)!] : [] })) as MemberRow[]);
    }
    if (moderationResult.error) setError(moderationResult.error.message);
    if (!auditResult.error) setAudit((auditResult.data ?? []) as AuditRow[]);
    if (!activityResult.error && activityResult.data) setDailyReport(activityResult.data as DailyActivityReport);
    else if (activityResult.error) setError(activityResult.error.message);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return members.filter((m) => !term || (m.username ?? '').toLowerCase().includes(term) || m.id.toLowerCase().includes(term));
  }, [members, query]);

  const counts = useMemo(() => ({
    total: members.length,
    verified: members.filter((m) => m.member_moderation?.[0]?.is_verified).length,
    banned: members.filter((m) => Boolean(m.member_moderation?.[0]?.banned_at)).length,
  }), [members]);

  const updateMember = async (member: MemberRow, flag: 'verified' | 'banned') => {
    if (!supabase) return;
    const current = member.member_moderation?.[0];
    const nextVerified = flag === 'verified' ? !current?.is_verified : Boolean(current?.is_verified);
    const nextBanned = flag === 'banned' ? !current?.banned_at : Boolean(current?.banned_at);
    setBusyId(member.id);
    setError('');
    const { error: updateError } = await supabase.rpc('admin_set_member_status', {
      p_user_id: member.id,
      p_is_verified: nextVerified,
      p_is_banned: nextBanned,
    });
    setBusyId(null);
    if (updateError) setError(updateError.message);
    else await load();
  };

  if (loading) return <div className="min-h-screen bg-surface p-8 text-on-surface">Loading secure admin panel…</div>;
  if (!authorized) return <div className="min-h-screen bg-surface p-8 text-on-surface"><div className="mx-auto max-w-lg rounded-3xl border border-outline-variant bg-surface-container-lowest p-6"><h1 className="text-xl font-bold">Access denied</h1><p className="mt-2 text-sm text-on-surface-variant">This signed-in account is not authorized as a Super Admin.</p><button className="mt-5 rounded-xl bg-primary px-4 py-2 text-white" onClick={onSignOut}>Sign out</button></div></div>;

  return (
    <main className="min-h-screen bg-surface px-4 py-6 text-on-surface sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-primary">Gupshup Control Center</p><h1 className="mt-1 text-3xl font-bold">Super Admin</h1><p className="mt-1 text-sm text-on-surface-variant">{email}</p></div>
          <div className="flex gap-2"><button onClick={() => void load()} className="rounded-xl border border-outline-variant px-4 py-2 text-sm font-semibold">Refresh</button><button onClick={onSignOut} className="rounded-xl bg-surface-container px-4 py-2 text-sm font-semibold">Sign out</button></div>
        </header>
        {error && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[['Total members', counts.total], ['Blue ticks', counts.verified], ['Banned accounts', counts.banned]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5"><p className="text-sm text-on-surface-variant">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>)}
        </section>
        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Daily activity report</h2>
              <p className="text-sm text-on-surface-variant">Date: {dailyReport?.report_date ?? 'Today'} · Pakistan time · Approximate active app time</p>
            </div>
            <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold">Private content hidden</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead><tr className="border-b border-outline-variant text-on-surface-variant"><th className="p-3">Member</th><th className="p-3">Active minutes</th><th className="p-3">Sent</th><th className="p-3">Received</th><th className="p-3">Chat partners</th><th className="p-3">Safety signal</th></tr></thead>
              <tbody>
                {(dailyReport?.members ?? []).map((m) => <tr key={m.user_id} className="border-b border-outline-variant/60">
                  <td className="p-3 font-semibold">@{m.username || 'member'}</td>
                  <td className="p-3 tabular-nums">{m.active_minutes} min</td>
                  <td className="p-3 tabular-nums">{m.messages_sent}</td>
                  <td className="p-3 tabular-nums">{m.messages_received}</td>
                  <td className="p-3 tabular-nums">{m.chat_partners}</td>
                  <td className="p-3">{m.activity_alert ? <span className="font-semibold text-amber-700">High volume — review</span> : <span className="text-emerald-700">No flag</span>}</td>
                </tr>)}
                {!dailyReport?.members?.length && <tr><td colSpan={6} className="p-6 text-center text-on-surface-variant">No activity data yet. Active time starts recording when users open the updated app.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-on-surface-variant">High-volume is a simple threshold (over 200 sent or received messages), not an AI finding or proof of misconduct. No message text, photos, voice notes, or private chat history is shown.</p>
        </section>
        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Member management</h2><p className="text-sm text-on-surface-variant">Profile and account status only — private message contents are not shown.</p></div><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search username or user ID" className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm sm:w-72" /></div>
          <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr className="border-b border-outline-variant text-on-surface-variant"><th className="p-3">Member</th><th className="p-3">Joined</th><th className="p-3">Last seen</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead><tbody>
            {filtered.map((m) => { const state = m.member_moderation?.[0]; return <tr key={m.id} className="border-b border-outline-variant/60"><td className="p-3"><div className="font-semibold">@{m.username || 'member'}</div><div className="max-w-52 truncate text-xs text-on-surface-variant">{m.id}</div></td><td className="p-3">{new Date(m.created_at).toLocaleDateString()}</td><td className="p-3">{m.last_seen_at ? new Date(m.last_seen_at).toLocaleString() : '—'}</td><td className="p-3"><div>{state?.is_verified ? '✓ Verified' : 'Not verified'}</div><div className={state?.banned_at ? 'text-red-600' : 'text-emerald-700'}>{state?.banned_at ? 'Banned' : 'Active'}</div></td><td className="p-3"><div className="flex gap-2"><button disabled={busyId === m.id} onClick={() => void updateMember(m, 'verified')} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{state?.is_verified ? 'Remove Tick' : 'Blue Tick'}</button><button disabled={busyId === m.id} onClick={() => void updateMember(m, 'banned')} className="rounded-lg border border-red-300 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50">{state?.banned_at ? 'Unban' : 'Ban'}</button></div></td></tr>; })}
            {!filtered.length && <tr><td colSpan={5} className="p-6 text-center text-on-surface-variant">No members found.</td></tr>}
          </tbody></table></div>
        </section>
        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 sm:p-6"><h2 className="text-xl font-bold">Recent admin activity</h2><div className="mt-3 divide-y divide-outline-variant">{audit.map((a) => <div key={a.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span className="font-medium">{a.action.toUpperCase()} · {a.target_user_id ?? 'Account removed'}</span><span className="text-on-surface-variant">{new Date(a.created_at).toLocaleString()}</span></div>)}{!audit.length && <p className="py-4 text-sm text-on-surface-variant">No actions recorded yet.</p>}</div></section>
        <p className="text-xs text-on-surface-variant">This panel shows account metadata and moderation records only. It does not expose private chats or message contents.</p>
      </div>
    </main>
  );
};
