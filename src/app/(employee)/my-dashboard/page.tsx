'use client';
import { useQuery } from '@tanstack/react-query';
import { taskApi } from '@/lib/api';
import Navbar from '@/components/shared/Navbar';
import { CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { getUser } from '@/lib/auth';
import { motion } from 'framer-motion';

const COLORS = ['#94a3b8', '#0EA5E9', '#f59e0b', '#22c55e', '#ef4444'];
const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Not Started', IN_PROGRESS: 'In Progress',
  WAITING_APPROVAL: 'Waiting Approval', COMPLETED: 'Completed', OVERDUE: 'Overdue',
};

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

  const recentTasks = [...tasks].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const upcomingTasks = tasks.filter((t: any) => t.status !== 'COMPLETED' && new Date(t.dueAt) > new Date())
    .sort((a: any, b: any) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()).slice(0, 5);

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div>
      <Navbar title="My Dashboard" />
      <div className="p-6 space-y-6">
        {/* Welcome */}
        <div className="bg-[#0F1C3F] rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h2 className="text-white text-2xl font-extrabold">Hello, {user?.firstName}! 👋</h2>
            <p className="text-slate-400 mt-1 text-sm">Here's an overview of your tasks today.</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-slate-400 text-xs">Completion Rate</p>
            <p className="text-[#0EA5E9] text-4xl font-extrabold">{completionRate}%</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Tasks', value: stats.total, icon: CheckCircle, color: 'bg-[#0F1C3F]' },
            { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'bg-[#0EA5E9]' },
            { label: 'Completed', value: stats.completed, icon: TrendingUp, color: 'bg-emerald-500' },
            { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'bg-red-500' },
          ].map(({ label, value, icon: Icon, color }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                  <p className="text-3xl font-extrabold text-[#0F1C3F] mt-1">{value ?? 0}</p>
                </div>
                <div className={`${color} p-3 rounded-xl`}><Icon size={18} className="text-white" /></div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts + upcoming */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Task distribution */}
          <div className="card p-5">
            <h3 className="font-bold text-[#0F1C3F] mb-4">Task Distribution</h3>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={65} innerRadius={40}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-gray-600">{d.name}</span>
                      </div>
                      <span className="font-bold text-gray-800">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <p className="text-gray-400 text-sm text-center py-10">No tasks yet</p>}
          </div>

          {/* Upcoming deadlines */}
          <div className="card p-5">
            <h3 className="font-bold text-[#0F1C3F] mb-4">Upcoming Deadlines</h3>
            <div className="space-y-3">
              {upcomingTasks.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No upcoming tasks</p>
              ) : upcomingTasks.map((t: any) => {
                const dueDate = new Date(t.dueAt);
                const diff = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={t.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${diff <= 1 ? 'bg-red-400' : diff <= 3 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{t.title}</p>
                      <p className={`text-xs mt-0.5 ${diff <= 1 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                        {diff === 0 ? 'Due today' : diff === 1 ? 'Due tomorrow' : `Due in ${diff} days`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
