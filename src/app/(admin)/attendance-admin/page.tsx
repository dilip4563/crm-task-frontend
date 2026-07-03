'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '@/lib/api';
import Navbar from '@/components/shared/Navbar';
import { Users, UserCheck, UserX, Clock, Coffee, Download, CheckCircle, XCircle, TrendingUp, Timer } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const fmt = (min: number) => `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`;
const timeStr = (d: string | null) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_STYLE: Record<string, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  LATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  ABSENT: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
};

export default function AttendanceAdminPage() {
  const qc = useQueryClient();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const { data, isLoading } = useQuery({
    queryKey: ['attendance-overview'],
    queryFn: () => attendanceApi.adminOverview().then(r => r.data),
    refetchInterval: 60000,
  });

  const { data: pending } = useQuery({
    queryKey: ['pending-corrections'],
    queryFn: () => attendanceApi.pendingCorrections().then(r => r.data.corrections),
    refetchInterval: 60000,
  });

  const review = useMutation({
    mutationFn: ({ id, action }: any) => attendanceApi.reviewCorrection(id, action),
    onSuccess: (_r, v) => { toast.success(`Correction ${v.action.toLowerCase()}`); qc.invalidateQueries({ queryKey: ['pending-corrections'] }); qc.invalidateQueries({ queryKey: ['attendance-overview'] }); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const exportCsv = async () => {
    try {
      const r = await attendanceApi.exportCsv(month);
      const url = URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `attendance-${month}.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch { toast.error('Export failed'); }
  };

  const s = data?.summary;

  return (
    <div>
      <Navbar title="Team Attendance" />
      <div className="p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Team', value: s?.totalEmployees ?? 0, icon: Users, color: 'from-[#0F1C3F] to-[#2a3f77]' },
            { label: 'Present', value: s?.present ?? 0, icon: UserCheck, color: 'from-emerald-500 to-green-400' },
            { label: 'Late', value: s?.late ?? 0, icon: Clock, color: 'from-amber-500 to-yellow-400' },
            { label: 'Absent', value: s?.absent ?? 0, icon: UserX, color: 'from-red-500 to-rose-400' },
            { label: 'Online Now', value: s?.online ?? 0, icon: TrendingUp, color: 'from-[#0EA5E9] to-cyan-400' },
            { label: 'Avg Hours', value: fmt(s?.avgWorkMinutes ?? 0), icon: Timer, color: 'from-purple-600 to-indigo-500' },
          ].map(({ label, value, icon: Icon, color }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card p-4 flex items-center gap-3">
              <div className={`bg-gradient-to-br ${color} p-2.5 rounded-xl flex-shrink-0`}><Icon size={16} className="text-white" /></div>
              <div className="min-w-0">
                <p className="text-lg font-extrabold text-[#0F1C3F] dark:text-white truncate">{value}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">{label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Live team table */}
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0F1C3F] dark:text-white">Live Team Status — Today</h3>
              <div className="flex items-center gap-2">
                <input type="month" className="input w-36 text-xs" value={month} onChange={e => setMonth(e.target.value)} />
                <button onClick={exportCsv} className="btn-secondary text-xs flex items-center gap-1"><Download size={12} /> Export CSV</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100 dark:border-gray-800">
                    {['Employee', 'Status', 'Login', 'Worked', 'Break', 'State'].map(h => <th key={h} className="py-2 pr-3 font-semibold">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading…</td></tr>
                  ) : (data?.employees || []).map((e: any) => (
                    <tr key={e.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#0F1C3F] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {e.firstName?.[0]}{e.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-100 text-xs">{e.firstName} {e.lastName}</p>
                            <p className="text-gray-400 text-[10px]">{e.username}{e.department ? ` · ${e.department}` : ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[e.status]}`}>{e.status}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-gray-600 dark:text-gray-300 text-xs">{timeStr(e.firstLogin)}</td>
                      <td className="py-2.5 pr-3 font-bold text-gray-800 dark:text-gray-100 text-xs">{e.workMinutes ? fmt(e.workMinutes) : '—'}
                        {e.overtimeMinutes > 0 && <span className="text-purple-500 font-semibold ml-1">+OT</span>}
                      </td>
                      <td className="py-2.5 pr-3 text-gray-500 text-xs">{e.breakMinutes ? fmt(e.breakMinutes) : '—'}</td>
                      <td className="py-2.5">
                        <span className="flex items-center gap-1.5 text-xs">
                          <span className={`w-2 h-2 rounded-full ${e.onBreak ? 'bg-amber-400' : e.online ? 'bg-emerald-400 animate-pulse' : 'bg-gray-300'}`} />
                          <span className="text-gray-500">{e.onBreak ? 'On Break' : e.online ? 'Online' : 'Offline'}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            {/* Trend chart */}
            <div className="card p-5">
              <h3 className="font-bold text-[#0F1C3F] dark:text-white mb-3 text-sm">7-Day Attendance Trend</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data?.trend || []}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(15,28,63,0.12)', fontSize: 12 }} />
                  <Bar dataKey="present" name="Present" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pending corrections */}
            <div className="card p-5">
              <h3 className="font-bold text-[#0F1C3F] dark:text-white mb-3 text-sm">Pending Corrections {pending?.length ? `(${pending.length})` : ''}</h3>
              <div className="space-y-2">
                {(pending || []).length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">Nothing pending 🎉</p>
                ) : (pending || []).map((c: any) => (
                  <div key={c.id} className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-200">{c.user.firstName} {c.user.lastName} · {c.date}</p>
                    <p className="text-[10px] text-gray-400">{c.type.replace(/_/g, ' ')}
                      {c.requestedLoginAt && ` · In: ${timeStr(c.requestedLoginAt)}`}
                      {c.requestedLogoutAt && ` · Out: ${timeStr(c.requestedLogoutAt)}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.reason}</p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => review.mutate({ id: c.id, action: 'APPROVED' })}
                        className="flex-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 rounded-lg py-1.5 flex items-center justify-center gap-1">
                        <CheckCircle size={12} /> Approve
                      </button>
                      <button onClick={() => review.mutate({ id: c.id, action: 'REJECTED' })}
                        className="flex-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 rounded-lg py-1.5 flex items-center justify-center gap-1">
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
