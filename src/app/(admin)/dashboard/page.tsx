'use client';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import Navbar from '@/components/shared/Navbar';
import { Users, CheckSquare, Clock, TrendingUp, AlertCircle, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { motion } from 'framer-motion';

const PRIORITY_COLORS: Record<string, string> = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#ef4444', CRITICAL: '#7c3aed' };
const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: '#94a3b8', IN_PROGRESS: '#0EA5E9', WAITING_APPROVAL: '#f59e0b',
  COMPLETED: '#22c55e', OVERDUE: '#ef4444',
};

function StatCard({ label, value, sub, icon: Icon, color }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-extrabold text-[#0F1C3F] mt-1">{value ?? '—'}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}><Icon size={20} className="text-white" /></div>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getDashboardStats().then(r => r.data),
    refetchInterval: 60000,
  });

  const stats = data?.stats;
  const weekly = data?.weeklyChart || [];
  const priority = data?.priorityBreakdown || [];
  const statusDist = data?.statusDistribution || [];
  const topEmployees = data?.topEmployees || [];

  return (
    <div>
      <Navbar title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Employees" value={stats?.totalEmployees} sub="Active accounts" icon={Users} color="bg-[#0F1C3F]" />
          <StatCard label="Total Tasks" value={stats?.totalTasks} sub="All time" icon={CheckSquare} color="bg-[#0EA5E9]" />
          <StatCard label="Completed Today" value={stats?.completedToday} sub="Tasks done today" icon={TrendingUp} color="bg-emerald-500" />
          <StatCard label="Overdue" value={stats?.overdue} sub="Need attention" icon={AlertCircle} color="bg-red-500" />
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Weekly activity */}
          <div className="card p-5 lg:col-span-2">
            <h3 className="font-bold text-[#0F1C3F] mb-4 flex items-center gap-2"><BarChart2 size={16} className="text-[#0EA5E9]" /> Weekly Task Activity</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weekly}>
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F1C3F" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0F1C3F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="completed" stroke="#0EA5E9" fill="url(#cg)" name="Completed" strokeWidth={2} />
                <Area type="monotone" dataKey="assigned" stroke="#0F1C3F" fill="url(#ag)" name="Assigned" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Priority breakdown */}
          <div className="card p-5">
            <h3 className="font-bold text-[#0F1C3F] mb-4">Priority Breakdown</h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={priority} dataKey="count" nameKey="priority" cx="50%" cy="50%" outerRadius={65} innerRadius={40}>
                  {priority.map((entry: any) => (
                    <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {priority.map((p: any) => (
                <div key={p.priority} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: PRIORITY_COLORS[p.priority] }} />
                    <span className="text-gray-600 capitalize">{p.priority?.toLowerCase()}</span>
                  </div>
                  <span className="font-bold text-gray-800">{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Status distribution */}
          <div className="card p-5">
            <h3 className="font-bold text-[#0F1C3F] mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusDist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="status" type="category" tick={{ fontSize: 10 }} width={110}
                  tickFormatter={v => v.replace(/_/g, ' ')} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {statusDist.map((entry: any) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top employees */}
          <div className="card p-5">
            <h3 className="font-bold text-[#0F1C3F] mb-4">Top Performers</h3>
            <div className="space-y-3">
              {topEmployees.slice(0, 5).map((emp: any, i: number) => (
                <div key={emp.id} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-gray-400">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-[#0F1C3F] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {emp.firstName?.[0]}{emp.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{emp.firstName} {emp.lastName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#0EA5E9] rounded-full" style={{ width: `${Math.min(100, (emp.completedTasks / Math.max(emp.totalTasks, 1)) * 100)}%` }} />
                      </div>
                      <span className="text-xs text-gray-400">{emp.completedTasks}/{emp.totalTasks}</span>
                    </div>
                  </div>
                </div>
              ))}
              {topEmployees.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No data yet</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
