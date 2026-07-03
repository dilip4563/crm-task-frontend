'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '@/lib/api';
import Navbar from '@/components/shared/Navbar';
import { Clock, Coffee, LogIn, LogOut, CalendarDays, Timer, AlertCircle, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const fmt = (min: number) => `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`;
const timeStr = (d: string | Date | null) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_STYLE: Record<string, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  LATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  ABSENT: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
  HALF_DAY: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300',
};

export default function AttendancePage() {
  const qc = useQueryClient();
  const [tick, setTick] = useState(0);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [corrOpen, setCorrOpen] = useState(false);
  const [corrForm, setCorrForm] = useState({ date: '', type: 'MISSED_LOGIN', requestedLoginAt: '', requestedLogoutAt: '', reason: '' });

  useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 30000); return () => clearInterval(t); }, []);

  const { data: today } = useQuery({
    queryKey: ['attendance-today', tick],
    queryFn: () => attendanceApi.getToday().then(r => r.data),
    refetchInterval: 60000,
  });

  const { data: history } = useQuery({
    queryKey: ['attendance-history', month],
    queryFn: () => attendanceApi.getHistory(month).then(r => r.data),
  });

  const { data: myCorr } = useQuery({
    queryKey: ['my-corrections'],
    queryFn: () => attendanceApi.myCorrections().then(r => r.data.corrections),
  });

  const breakMutation = useMutation({
    mutationFn: (start: boolean) => start ? attendanceApi.startBreak() : attendanceApi.endBreak(),
    onSuccess: (_r, start) => { toast.success(start ? '☕ Break started' : '✅ Back to work!'); qc.invalidateQueries({ queryKey: ['attendance-today'] }); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const corrMutation = useMutation({
    mutationFn: (d: any) => attendanceApi.submitCorrection(d),
    onSuccess: () => { toast.success('Correction request submitted'); setCorrOpen(false); qc.invalidateQueries({ queryKey: ['my-corrections'] }); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const submitCorrection = () => {
    if (!corrForm.date || !corrForm.reason) return toast.error('Date and reason are required');
    const payload: any = { date: corrForm.date, type: corrForm.type, reason: corrForm.reason };
    if (corrForm.requestedLoginAt) payload.requestedLoginAt = `${corrForm.date}T${corrForm.requestedLoginAt}:00+05:30`;
    if (corrForm.requestedLogoutAt) payload.requestedLogoutAt = `${corrForm.date}T${corrForm.requestedLogoutAt}:00+05:30`;
    corrMutation.mutate(payload);
  };

  const summary = history?.summary;
  const statusLabel = today?.onBreak ? 'On Break' : today?.online ? 'Online' : 'Offline';
  const statusColor = today?.onBreak ? 'bg-amber-400' : today?.online ? 'bg-emerald-400' : 'bg-gray-400';

  return (
    <div>
      <Navbar title="My Attendance" />
      <div className="p-6 space-y-6">
        {/* Live status hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F1C3F] via-[#16295c] to-[#0F1C3F] p-6 md:p-8 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-3 w-3">
                  {today?.online && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusColor} opacity-60`} />}
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${statusColor}`} />
                </span>
                <span className="text-white font-bold">{statusLabel}</span>
                {today?.status && today.firstLogin && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[today.status]}`}>{today.status}</span>
                )}
              </div>
              <p className="text-slate-400 text-sm">Today's login: <span className="text-white font-semibold">{timeStr(today?.firstLogin)}</span></p>
              <p className="text-slate-400 text-sm mt-1">Office hours: {today?.settings?.workStart} – {today?.settings?.workEnd}</p>
            </div>
            <div className="flex gap-6 md:gap-10">
              {[
                { label: 'Worked Today', value: fmt(today?.workMinutes ?? 0), icon: Timer },
                { label: 'Break Time', value: fmt(today?.breakMinutes ?? 0), icon: Coffee },
                { label: 'Remaining', value: fmt(today?.remainingMinutes ?? 0), icon: Clock },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="text-center">
                  <Icon size={18} className="text-[#0EA5E9] mx-auto mb-1" />
                  <p className="text-white text-xl font-extrabold">{value}</p>
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">{label}</p>
                </div>
              ))}
            </div>
            <div>
              {today?.onBreak ? (
                <button onClick={() => breakMutation.mutate(false)} disabled={breakMutation.isPending}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2">
                  <LogIn size={18} /> End Break
                </button>
              ) : (
                <button onClick={() => breakMutation.mutate(true)} disabled={breakMutation.isPending || !today?.online}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold px-6 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2">
                  <Coffee size={18} /> Start Break
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Monthly summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Present', value: summary?.present ?? 0, color: 'text-emerald-600' },
            { label: 'Late', value: summary?.late ?? 0, color: 'text-amber-600' },
            { label: 'Absent', value: summary?.absent ?? 0, color: 'text-red-500' },
            { label: 'Half Days', value: summary?.halfDays ?? 0, color: 'text-orange-500' },
            { label: 'Total Hours', value: fmt(summary?.totalWorkMinutes ?? 0), color: 'text-[#0EA5E9]' },
            { label: 'Overtime', value: fmt(summary?.totalOvertimeMinutes ?? 0), color: 'text-purple-600' },
          ].map(({ label, value, color }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4 text-center">
              <p className={`text-xl font-extrabold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Attendance calendar/list */}
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0F1C3F] dark:text-white flex items-center gap-2"><CalendarDays size={16} className="text-[#0EA5E9]" /> Attendance History</h3>
              <input type="month" className="input w-40" value={month} onChange={e => setMonth(e.target.value)} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100 dark:border-gray-800">
                    {['Date', 'Login', 'Logout', 'Break', 'Hours', 'Status'].map(h => <th key={h} className="py-2 pr-3 font-semibold">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(history?.days || []).slice().reverse().map((d: any) => (
                    <tr key={d.date} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="py-2.5 pr-3 text-gray-700 dark:text-gray-200 font-medium">{new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', weekday: 'short' })}</td>
                      <td className="py-2.5 pr-3 text-gray-600 dark:text-gray-300">{timeStr(d.firstLogin)}</td>
                      <td className="py-2.5 pr-3 text-gray-600 dark:text-gray-300">{timeStr(d.lastLogout)}</td>
                      <td className="py-2.5 pr-3 text-gray-500">{d.breakMinutes ? fmt(d.breakMinutes) : '—'}</td>
                      <td className="py-2.5 pr-3 font-bold text-gray-800 dark:text-gray-100">{d.workMinutes ? fmt(d.workMinutes) : '—'}
                        {d.overtimeMinutes > 0 && <span className="text-purple-500 text-xs font-semibold ml-1">+{fmt(d.overtimeMinutes)} OT</span>}
                      </td>
                      <td className="py-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[d.isHalfDay ? 'HALF_DAY' : d.status]}`}>
                          {d.isHalfDay ? 'HALF DAY' : d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Corrections */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0F1C3F] dark:text-white flex items-center gap-2"><AlertCircle size={16} className="text-amber-500" /> Corrections</h3>
              <button onClick={() => { setCorrForm({ date: '', type: 'MISSED_LOGIN', requestedLoginAt: '', requestedLogoutAt: '', reason: '' }); setCorrOpen(true); }}
                className="btn-secondary text-xs flex items-center gap-1"><Send size={12} /> Request</button>
            </div>
            <div className="space-y-2">
              {(myCorr || []).length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No correction requests</p>
              ) : (myCorr || []).map((c: any) => (
                <div key={c.id} className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-200">{c.date} · {c.type.replace(/_/g, ' ')}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : c.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>{c.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Correction modal */}
      <AnimatePresence>
        {corrOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setCorrOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md z-10">
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-bold text-[#0F1C3F] dark:text-white">Attendance Correction Request</h2>
                <button onClick={() => setCorrOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Date *</label>
                    <input type="date" className="input" value={corrForm.date} onChange={e => setCorrForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Type *</label>
                    <select className="input" value={corrForm.type} onChange={e => setCorrForm(f => ({ ...f, type: e.target.value }))}>
                      <option value="MISSED_LOGIN">Missed Login</option>
                      <option value="MISSED_LOGOUT">Missed Logout</option>
                      <option value="WRONG_ENTRY">Wrong Entry</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Correct Login Time</label>
                    <input type="time" className="input" value={corrForm.requestedLoginAt} onChange={e => setCorrForm(f => ({ ...f, requestedLoginAt: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Correct Logout Time</label>
                    <input type="time" className="input" value={corrForm.requestedLogoutAt} onChange={e => setCorrForm(f => ({ ...f, requestedLogoutAt: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Reason *</label>
                  <textarea className="input resize-none" rows={3} placeholder="Explain what happened…" value={corrForm.reason} onChange={e => setCorrForm(f => ({ ...f, reason: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 justify-end p-5 border-t border-gray-100 dark:border-gray-800">
                <button onClick={() => setCorrOpen(false)} className="btn-secondary">Cancel</button>
                <button onClick={submitCorrection} disabled={corrMutation.isPending} className="btn-primary">
                  {corrMutation.isPending ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
