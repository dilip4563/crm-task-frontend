'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '@/lib/api';
import Navbar from '@/components/shared/Navbar';
import TaskModal from '@/components/admin/TaskModal';
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const PRIORITY_CHIP: Record<string, string> = {
  LOW: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border border-amber-200',
  HIGH: 'bg-red-50 text-red-600 border border-red-200',
  CRITICAL: 'bg-purple-50 text-purple-700 border border-purple-200',
};
const STATUS_CHIP: Record<string, string> = {
  NOT_STARTED: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  WAITING_APPROVAL: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  OVERDUE: 'bg-red-50 text-red-600',
};

export default function AdminTasksPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tasks', search, status, priority, page],
    queryFn: () => taskApi.getAll({ search, status, priority, page, limit: 15 }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => taskApi.create(d),
    onSuccess: () => { toast.success('Task assigned!'); qc.invalidateQueries({ queryKey: ['admin-tasks'] }); setModalOpen(false); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => taskApi.update(id, data),
    onSuccess: () => { toast.success('Task updated!'); qc.invalidateQueries({ queryKey: ['admin-tasks'] }); setModalOpen(false); setEditTask(null); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => taskApi.delete(id),
    onSuccess: () => { toast.success('Task deleted!'); qc.invalidateQueries({ queryKey: ['admin-tasks'] }); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const tasks = data?.tasks || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 15);

  return (
    <div>
      <Navbar title="Tasks" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input pl-9 w-52" placeholder="Search tasks…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select className="input w-40" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              {['NOT_STARTED', 'IN_PROGRESS', 'WAITING_APPROVAL', 'COMPLETED', 'OVERDUE'].map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <select className="input w-36" value={priority} onChange={e => { setPriority(e.target.value); setPage(1); }}>
              <option value="">All Priority</option>
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button onClick={() => { setEditTask(null); setModalOpen(true); }} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Assign Task
          </button>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#0F1C3F] text-white">
              <tr>
                {['Task', 'Assigned To', 'Priority', 'Status', 'Due Date', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading…</td></tr>
              ) : tasks.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No tasks found</td></tr>
              ) : tasks.map((t: any, i: number) => (
                <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3 max-w-[220px]">
                    <p className="font-semibold text-gray-800 truncate">{t.title}</p>
                    {t.description && <p className="text-gray-400 text-xs truncate">{t.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#0F1C3F] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {t.assignedTo?.firstName?.[0]}{t.assignedTo?.lastName?.[0]}
                      </div>
                      <span className="text-gray-700 text-xs">{t.assignedTo?.firstName} {t.assignedTo?.lastName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PRIORITY_CHIP[t.priority]}`}>{t.priority}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CHIP[t.status] || 'bg-gray-100 text-gray-600'}`}>
                      {(t.status || '').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {t.dueAt ? new Date(t.dueAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditTask(t); setModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => { if (confirm('Delete this task?')) deleteMutation.mutate(t.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary p-2 disabled:opacity-40"><ChevronLeft size={16} /></button>
              <span className="text-sm text-gray-600">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary p-2 disabled:opacity-40"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      <TaskModal open={modalOpen} task={editTask} onClose={() => { setModalOpen(false); setEditTask(null); }}
        onSubmit={d => editTask ? updateMutation.mutate({ id: editTask.id, data: d }) : createMutation.mutate(d)}
        isLoading={createMutation.isPending || updateMutation.isPending} />
    </div>
  );
}
