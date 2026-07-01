'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import Navbar from '@/components/shared/Navbar';
import { Download, FileText, FileSpreadsheet, Calendar } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import toast from 'react-hot-toast';

const PERIOD_OPTS = [{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }];

export default function ReportsPage() {
  const [period, setPeriod] = useState('weekly');
  const [exporting, setExporting] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['reports', period],
    queryFn: () => adminApi.getReports({ period }).then(r => r.data),
  });

  const exportReport = async (format: string) => {
    setExporting(format);
    try {
      const res = await adminApi.exportReport({ period, format });
      const blob = new Blob([res.data], { type: format === 'csv' ? 'text/csv' : format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `report-${period}.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} exported!`);
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting('');
    }
  };

  const summary = data?.summary || {};
  const chart = data?.chart || [];
  const employeePerf = data?.employeePerformance || [];

  return (
    <div>
      <Navbar title="Reports" />
      <div className="p-6 space-y-6">
        {/* Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-1">
            {PERIOD_OPTS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${period === p.value ? 'bg-[#0F1C3F] text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {[{ fmt: 'csv', icon: FileText, label: 'CSV' }, { fmt: 'excel', icon: FileSpreadsheet, label: 'Excel' }].map(({ fmt, icon: Icon, label }) => (
              <button key={fmt} onClick={() => exportReport(fmt)} disabled={!!exporting}
                className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-60">
                <Icon size={15} /> {exporting === fmt ? 'Exporting…' : label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Tasks Assigned', value: summary.totalAssigned },
            { label: 'Completed', value: summary.totalCompleted, color: 'text-emerald-600' },
            { label: 'Overdue', value: summary.totalOverdue, color: 'text-red-600' },
            { label: 'Completion Rate', value: summary.completionRate ? `${summary.completionRate}%` : '—', color: 'text-blue-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-5">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
              <p className={`text-3xl font-extrabold mt-1 ${color || 'text-[#0F1C3F]'}`}>{value ?? '—'}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="card p-5">
          <h3 className="font-bold text-[#0F1C3F] mb-4 flex items-center gap-2"><Calendar size={16} className="text-[#0EA5E9]" /> Task Activity ({period})</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="completed" fill="#22c55e" name="Completed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="assigned" fill="#0EA5E9" name="Assigned" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Employee performance table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-[#0F1C3F]">Employee Performance</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Employee', 'Assigned', 'Completed', 'Overdue', 'Rate'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading…</td></tr>
              ) : employeePerf.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No data available</td></tr>
              ) : employeePerf.map((emp: any, i: number) => {
                const rate = emp.totalAssigned > 0 ? Math.round((emp.completed / emp.totalAssigned) * 100) : 0;
                return (
                  <tr key={emp.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#0F1C3F] flex items-center justify-center text-white text-xs font-bold">{emp.firstName?.[0]}{emp.lastName?.[0]}</div>
                        <span className="font-medium text-gray-800">{emp.firstName} {emp.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{emp.totalAssigned}</td>
                    <td className="px-4 py-3 text-emerald-600 font-semibold">{emp.completed}</td>
                    <td className="px-4 py-3 text-red-500">{emp.overdue}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#0EA5E9] rounded-full" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-600">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
