'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { taskApi } from '@/lib/api';
import Navbar from '@/components/shared/Navbar';
import { CheckCircle, Clock, AlertCircle, TrendingUp, CalendarClock, Sparkles } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { getUser } from '@/lib/auth';
import { motion } from 'framer-motion';

const COLORS = ['#94a3b8', '#0EA5E9', '#f59e0b', '#22c55e', '#ef4444'];
const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Not Started', IN_PROGRESS: 'In Progress',
  WAITING_APPROVAL: 'Waiting Approval', COMPLETED: 'Completed', OVERDUE: 'Overdue',
};

/** Animated count-up number */
function CountUp({ value }: { value: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (value === 0) { setN(0); return; }
    let frame: number;
    const start = performance.now();
    const dur = 800;
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3)))); // ease-out cubic
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{n}</>;
}

/** Animated circular progress ring */
function ProgressRing({ percent }: { percent: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-28 h-28">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
        <motion.circle cx="50" cy="50" r={r} fill="none" stroke="#0EA5E9" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (c * percent) / 100 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-white text-2xl font-extrabold"><CountUp value={percent} />%</span>
        <span className="text-slate-400 text-[9px] font-semibold tracking-wider uppercase">Complete</span>
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const user = getUser();
  const { data } = useQuery({
    queryKey: ['my-tasks-stats'],
    queryFn: () => taskApi.getMine({}).then(r => r.data),
    refetchInterval: 60000,
  });

  const stats = data?.stats || {};
  const tasks = data?.tasks || [];

  const pieData = Object.entries(STATUS_LABELS).map(([key, label]) => ({
    name: label,
    value: tasks.filter((t: any) => t.status === key).length,
  })).filter(d => d.value > 0);

  const upcomingTasks = tasks.filter((t: any) => t.status !== 'COMPLETED' && new Date(t.dueAt) > new Date())
    .sort((a: any, b: any) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()).slice(0, 5);

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <Navbar title="My Dashboard" />
      <div className="p-6 space-y-6">
        {/* Hero banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F1C3F] via-[#16295c] to-[#0F1C3F] p-8 flex items-center justify-between shadow-2xl shadow-blue-900/20">
          {/* Animated glow blobs */}
          <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-24 -left-16 w-72 h-72 bg-[#0EA5E9]/20 rounded-full blur-3xl pointer-events-none" />
          <motion.div animate={{ x: [0, -40, 0], y: [0, 25, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-32 right-10 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <motion.div animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 5, repeat: Infinity }}
            className="absolute top-10 right-1/3 w-40 h-40 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="flex items-center gap-2 text-[#0EA5E9] text-xs font-bold tracking-widest uppercase mb-2">
              <Sparkles size={13} /> {greeting}
            </motion.div>
            <h2 className="text-white text-3xl font-extrabold">
              Hello, {user?.firstName}!{' '}
              <motion.span className="inline-block origin-[70%_70%]"
                animate={{ rotate: [0, 18, -8, 18, 0] }} transition={{ duration: 1.4, delay: 0.6, repeat: Infinity, repeatDelay: 4 }}>
                👋
              </motion.span>
            </h2>
            <p className="text-slate-400 mt-1.5 text-sm">Here&apos;s an overview of your tasks today.</p>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35, type: 'spring', stiffness: 150 }}
            className="relative z-10 hidden sm:block">
            <ProgressRing percent={completionRate} />
          </motion.div>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Tasks', value: stats.total, icon: CheckCircle, grad: 'from-[#0F1C3F] to-[#2a3f77]', glow: 'group-hover:shadow-blue-900/30' },
            { label: 'In Progress', value: stats.inProgress, icon: Clock, grad: 'from-[#0EA5E9] to-[#38bdf8]', glow: 'group-hover:shadow-sky-400/40' },
            { label: 'Completed', value: stats.completed, icon: TrendingUp, grad: 'from-emerald-500 to-green-400', glow: 'group-hover:shadow-emerald-400/40' },
            { label: 'Overdue', value: stats.overdue, icon: AlertCircle, grad: 'from-red-500 to-rose-400', glow: 'group-hover:shadow-red-400/40' },
          ].map(({ label, value, icon: Icon, grad, glow }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 120 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="card p-5 group cursor-default relative overflow-hidden">
              {/* hover sheen */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-blue-50/80 dark:to-sky-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
                  <p className="text-3xl font-extrabold text-[#0F1C3F] dark:text-white mt-1"><CountUp value={value ?? 0} /></p>
                </div>
                <motion.div whileHover={{ rotate: 8, scale: 1.1 }}
                  className={`bg-gradient-to-br ${grad} p-3 rounded-2xl shadow-lg transition-shadow duration-300 ${glow}`}>
                  <Icon size={18} className="text-white" />
                </motion.div>
              </div>
              {/* bottom accent line */}
              <div className={`absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full bg-gradient-to-r ${grad} transition-all duration-500`} />
            </motion.div>
          ))}
        </div>

        {/* Charts + upcoming */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Task distribution */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="card p-5 hover:shadow-lg transition-shadow duration-300">
            <h3 className="font-bold text-[#0F1C3F] dark:text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-[#0EA5E9]" /> Task Distribution
            </h3>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={68} innerRadius={44}
                      paddingAngle={pieData.length > 1 ? 4 : 0} cornerRadius={6}
                      animationBegin={400} animationDuration={900}>
                      {pieData.map((d, i) => {
                        const idx = Object.values(STATUS_LABELS).indexOf(d.name);
                        return <Cell key={i} fill={COLORS[idx % COLORS.length]} stroke="none" />;
                      })}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(15,28,63,0.12)', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {pieData.map((d) => {
                    const idx = Object.values(STATUS_LABELS).indexOf(d.name);
                    return (
                      <motion.div key={d.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                        className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
                          <span className="text-gray-600 dark:text-gray-300">{d.name}</span>
                        </div>
                        <span className="font-bold text-gray-800 dark:text-gray-100">{d.value}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-300 dark:text-gray-600 dark:text-gray-300">
                <CheckCircle size={36} className="mb-2" />
                <p className="text-gray-400 text-sm">No tasks yet</p>
              </div>
            )}
          </motion.div>

          {/* Upcoming deadlines */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            className="card p-5 hover:shadow-lg transition-shadow duration-300">
            <h3 className="font-bold text-[#0F1C3F] dark:text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-amber-400" /> Upcoming Deadlines
            </h3>
            <div className="space-y-3">
              {upcomingTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300 dark:text-gray-600 dark:text-gray-300">
                  <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
                    <CalendarClock size={36} className="mb-2" />
                  </motion.div>
                  <p className="text-gray-400 text-sm">No upcoming tasks — enjoy the calm! 🎉</p>
                </div>
              ) : upcomingTasks.map((t: any, i: number) => {
                const dueDate = new Date(t.dueAt);
                const diff = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <motion.div key={t.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.08 }}
                    whileHover={{ x: 4 }}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/70 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm transition-all duration-200">
                    <span className="relative flex h-2 w-2 mt-1.5 flex-shrink-0">
                      {diff <= 1 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />}
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${diff <= 1 ? 'bg-red-400' : diff <= 3 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{t.title}</p>
                      <p className={`text-xs mt-0.5 ${diff <= 1 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                        {diff === 0 ? '⚡ Due today' : diff === 1 ? 'Due tomorrow' : `Due in ${diff} days`}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
