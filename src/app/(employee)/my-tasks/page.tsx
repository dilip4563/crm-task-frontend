'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '@/lib/api';
import Navbar from '@/components/shared/Navbar';
import { CheckCircle, Clock, AlertCircle, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const PRIORITY_CHIP: Record<string, string> = {
  LOW: 'bg-emerald-50 text-emerald-700',
  MEDIUM: 'bg-amber-50 text-amber-700',
  HIGH: 'bg-red-50 text-red-600',
  CRITICAL: 'bg-purple-50 text-purple-700',
};
const STATUS_OPTIONS = ['NOT_STARTED', 'IN_PROGRESS', 'WAITING_APPROVAL', 'COMPLETED'];
const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Not Started', IN_PROGRESS: 'In Progress',
  WAITING_APPROVAL: 'Waiting Approval', COMPLETED: 'Completed', OVERDUE: 'Overdue',
};
const STATUS_CHIP: Record<string, string> = {
  NOT_STARTED: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  WAITING_APPROVAL: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  OVERDUE: 'bg-red-50 text-red-600',
};

function TaskCard({ task }: { task: any }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState('');

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: any) => taskApi.update(id, { status }),
    onSuccess: () => { toast.success('Status updated!'); qc.invalidateQueries({ queryKey: ['my-tasks'] }); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const addComment = useMutation({
    mutationFn: ({ id, content }: any) => taskApi.addComment(id, content),
    onSuccess: () => { toast.success('Comment added!'); setComment(''); qc.invalidateQueries({ queryKey: ['my-tasks'] }); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const isOverdue = task.status === 'OVERDUE' || (task.status !== 'COMPLETED' && new Date(task.dueAt) < new Date());

  return (
    <motion.div layout className="card overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex-shrink-0 ${task.status === 'COMPLETED' ? 'text-emerald-500' : isOverdue ? 'text-red-400' : 'text-gray-300'}`}>
            <CheckCircle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <h3 className={`font-bold text-gray-800 ${task.status === 'COMPLETED' ? 'line-through text-gray-400' : ''}`}>{task.title}</h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PRIORITY_CHIP[task.priority]}`}>{task.priority}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CHIP[task.status] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[task.status] || task.status}</span>
              </div>
            </div>
            {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <div className={`flex items-center gap-1.5 text-xs ${isOverdue && task.status !== 'COMPLETED' ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                <Clock size={12} />
                {isOverdue && task.status !== 'COMPLETED' && <AlertCircle size={12} />}
                Due: {new Date(task.dueAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
              {task._count?.comments > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-400"><MessageSquare size={12} /> {task._count.comments} comments</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
          {task.status !== 'COMPLETED' && task.status !== 'OVERDUE' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 font-medium">Update Status:</label>
              <select className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                value={task.status} onChange={e => updateStatus.mutate({ id: task.id, status: e.target.value })}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          )}
          <button onClick={() => setExpanded(e => !e)} className="ml-auto flex items-center gap-1 text-xs text-[#0EA5E9] hover:underline">
            {expanded ? <><ChevronUp size={12} /> Hide</> : <><ChevronDown size={12} /> Comments</>}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 overflow-hidden">
            <div className="p-5 space-y-3">
              {(task.comments || []).map((c: any) => (
                <div key={c.id} className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#0F1C3F] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {c.user?.firstName?.[0]}{c.user?.lastName?.[0]}
                  </div>
                  <div className="bg-gray-50 rounded-xl px-3 py-2 flex-1">
                    <p className="text-xs font-semibold text-gray-700">{c.user?.firstName} {c.user?.lastName}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{c.content}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(c.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {(task.comments || []).length === 0 && <p className="text-xs text-gray-400 text-center py-2">No comments yet</p>}
              <div className="flex gap-2 mt-3">
                <input className="input flex-1 text-sm py-2" placeholder="Add a comment…" value={comment} onChange={e => setComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && comment.trim()) addComment.mutate({ id: task.id, content: comment }); }} />
                <button onClick={() => { if (comment.trim()) addComment.mutate({ id: task.id, content: comment }); }} disabled={!comment.trim() || addComment.isPending}
                  className="btn-primary text-sm px-4 py-2 disabled:opacity-50">Send</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function MyTasksPage() {
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['my-tasks', status, priority],
    queryFn: () => taskApi.getMine({ status, priority }).then(r => r.data),
    refetchInterval: 30000,
  });

  const tasks = data?.tasks || [];
  const stats = data?.stats || {};

  return (
    <div>
      <Navbar title="My Tasks" />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'bg-[#0F1C3F]' },
            { label: 'In Progress', value: stats.inProgress, color: 'bg-[#0EA5E9]' },
            { label: 'Completed', value: stats.completed, color: 'bg-emerald-500' },
            { label: 'Overdue', value: stats.overdue, color: 'bg-red-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                <CheckCircle size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className="text-2xl font-extrabold text-[#0F1C3F]">{value ?? 0}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <select className="input w-40" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Status</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select className="input w-36" value={priority} onChange={e => setPriority(e.target.value)}>
            <option value="">All Priority</option>
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <span className="text-sm text-gray-400">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Task list */}
        {isLoading ? (
          <div className="text-center py-16 text-gray-400">Loading your tasks…</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CheckCircle size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="font-semibold">No tasks found</p>
            <p className="text-sm mt-1">You're all caught up!</p>
          </div>
        ) : (
          <motion.div layout className="space-y-4">
            {tasks.map((t: any) => <TaskCard key={t.id} task={t} />)}
          </motion.div>
        )}
      </div>
    </div>
  );
}
