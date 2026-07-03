'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '@/lib/api';

const PRIORITY_OPTS = [
  { value: 'LOW', label: 'Low', color: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
  { value: 'MEDIUM', label: 'Medium', color: 'border-amber-400 bg-amber-50 text-amber-700' },
  { value: 'HIGH', label: 'High', color: 'border-red-400 bg-red-50 text-red-700' },
  { value: 'CRITICAL', label: 'Critical', color: 'border-purple-500 bg-purple-50 text-purple-700' },
];

interface Props { open: boolean; task?: any; onClose: () => void; onSubmit: (d: any) => void; isLoading?: boolean; }

export default function TaskModal({ open, task, onClose, onSubmit, isLoading }: Props) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '', dueTime: '', assignedToId: '', notes: '' });
  const [errors, setErrors] = useState<any>({});
  const [empSearch, setEmpSearch] = useState('');
  const [empOpen, setEmpOpen] = useState(false);

  const { data: emps } = useQuery({
    queryKey: ['assignees-search', empSearch],
    queryFn: () => adminApi.getAssignees({ search: empSearch }).then(r => r.data.assignees),
  });

  useEffect(() => {
    if (open) {
      if (task) {
        const [date, time] = (task.dueAt || '').split('T');
        setForm({ title: task.title || '', description: task.description || '', priority: task.priority || 'MEDIUM', dueDate: date || '', dueTime: time?.slice(0, 5) || '', assignedToId: task.assignedToId || '', notes: task.notes || '' });
        setEmpSearch(task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : '');
      } else {
        setForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', dueTime: '', assignedToId: '', notes: '' });
        setEmpSearch('');
      }
      setErrors({});
    }
  }, [open, task]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const set = (k: string, v: string) => { setForm(f => ({ ...f, [k]: v })); setErrors((e: any) => ({ ...e, [k]: undefined })); };

  const validate = () => {
    const errs: any = {};
    if (!form.title.trim()) errs.title = 'Required';
    if (!form.dueDate) errs.dueDate = 'Required';
    if (!form.dueTime) errs.dueTime = 'Required';
    if (!form.assignedToId) errs.assignedToId = 'Select an employee';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({ ...form, dueAt: `${form.dueDate}T${form.dueTime}` });
  };

  const selectedEmp = emps?.find((e: any) => e.id === form.assignedToId);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-[#0F1C3F] dark:text-white">{task ? 'Edit Task' : 'Assign Task'}</h2>
                <p className="text-sm text-gray-500 mt-0.5">Fill in task details below</p>
              </div>
              <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-300 rounded"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Task Title <span className="text-red-500">*</span></label>
                <input className={`input ${errors.title ? 'border-red-400' : ''}`} placeholder="Enter task title" value={form.title} onChange={e => set('title', e.target.value)} />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Description</label>
                <textarea className="input resize-none" rows={3} placeholder="Optional description" value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Due Date <span className="text-red-500">*</span></label>
                  <input type="date" className={`input ${errors.dueDate ? 'border-red-400' : ''}`} value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
                  {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Due Time <span className="text-red-500">*</span></label>
                  <input type="time" className={`input ${errors.dueTime ? 'border-red-400' : ''}`} value={form.dueTime} onChange={e => set('dueTime', e.target.value)} />
                  {errors.dueTime && <p className="text-xs text-red-500 mt-1">{errors.dueTime}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Priority</label>
                <div className="flex gap-2">
                  {PRIORITY_OPTS.map(p => (
                    <button key={p.value} type="button" onClick={() => set('priority', p.value)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${form.priority === p.value ? p.color + ' shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Assign To <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input className={`input ${errors.assignedToId ? 'border-red-400' : ''}`} placeholder="Search employee…"
                    value={selectedEmp ? `${selectedEmp.firstName} ${selectedEmp.lastName}` : empSearch}
                    onFocus={() => setEmpOpen(true)}
                    onChange={e => { setEmpSearch(e.target.value); set('assignedToId', ''); setEmpOpen(true); }} />
                  {empOpen && emps && emps.length > 0 && (
                    <div className="absolute z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg w-full max-h-44 overflow-y-auto">
                      {emps.map((e: any) => (
                        <button key={e.id} type="button" onMouseDown={() => { set('assignedToId', e.id); setEmpSearch(`${e.firstName} ${e.lastName}`); setEmpOpen(false); }}
                          className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#0F1C3F] flex items-center justify-center text-white text-xs font-bold">
                            {e.firstName?.[0]}{e.lastName?.[0]}
                          </div>
                          <div className="flex-1">
                            <span className="font-medium">{e.firstName} {e.lastName}</span>
                            <span className="text-gray-400 text-xs ml-1">· {e.username}</span>
                          </div>
                          {e.role === 'ADMIN' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                              ADMIN{e.department ? ` · ${e.department}` : ''}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {errors.assignedToId && <p className="text-xs text-red-500 mt-1">{errors.assignedToId}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Notes</label>
                <textarea className="input resize-none" rows={2} placeholder="Optional notes" value={form.notes} onChange={e => set('notes', e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 justify-end p-6 border-t border-gray-100 dark:border-gray-800">
              <button onClick={onClose} className="btn-secondary">Cancel</button>
              <button onClick={handleSubmit} disabled={isLoading} className="btn-primary">
                {isLoading ? 'Saving…' : task ? 'Update Task' : 'Assign Task'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
