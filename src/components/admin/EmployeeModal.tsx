'use client';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { isSuperAdmin } from '@/lib/auth';

interface Props {
  open: boolean;
  employee?: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

const DEPTS = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Support', 'Design'];

export default function EmployeeModal({ open, employee, onClose, onSubmit, isLoading }: Props) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', username: '', department: '', position: '', phone: '', managerId: '' });
  const [errors, setErrors] = useState<any>({});
  const superAdmin = isSuperAdmin();

  const { data: adminsData } = useQuery({
    queryKey: ['admins-for-select'],
    queryFn: () => adminApi.getAdmins().then(r => r.data.admins),
    enabled: open && superAdmin,
  });

  useEffect(() => {
    if (open) {
      if (employee) {
        setForm({ firstName: employee.firstName || '', lastName: employee.lastName || '', email: employee.email || '', username: employee.username || '', department: employee.department || '', position: employee.position || '', phone: employee.phone || '', managerId: employee.managerId || '' });
      } else {
        setForm({ firstName: '', lastName: '', email: '', username: '', department: '', position: '', phone: '', managerId: '' });
      }
      setErrors({});
    }
  }, [open, employee]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const set = (k: string, v: string) => { setForm(f => ({ ...f, [k]: v })); setErrors((e: any) => ({ ...e, [k]: undefined })); };

  const validate = () => {
    const errs: any = {};
    if (!form.firstName.trim()) errs.firstName = 'Required';
    if (!form.lastName.trim()) errs.lastName = 'Required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => { if (validate()) onSubmit(form); };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-[#0F1C3F] dark:text-white">{employee ? 'Edit Employee' : 'Add Employee'}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{employee ? 'Update employee details' : 'Create a new employee account'}</p>
              </div>
              <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-300 rounded"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[['firstName', 'First Name'], ['lastName', 'Last Name']].map(([k, label]) => (
                  <div key={k}>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">{label} <span className="text-red-500">*</span></label>
                    <input className={`input ${errors[k] ? 'border-red-400' : ''}`} value={form[k as keyof typeof form]} onChange={e => set(k, e.target.value)} />
                    {errors[k] && <p className="text-xs text-red-500 mt-1">{errors[k]}</p>}
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Email <span className="text-red-500">*</span></label>
                <input type="email" className={`input ${errors.email ? 'border-red-400' : ''}`} value={form.email} onChange={e => set('email', e.target.value)} disabled={!!employee} />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              {employee ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">User ID</label>
                  <input className="input" value={form.username} disabled />
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-xs text-blue-700">🔐 A <b>User ID</b> and <b>Password</b> will be generated automatically after you create this employee. Share them with the employee — they must change the password on first login.</p>
                </div>
              )}
              {superAdmin && !employee && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Reports To (Department Admin)</label>
                  <select className="input" value={form.managerId} onChange={e => set('managerId', e.target.value)}>
                    <option value="">No manager (reports to you)</option>
                    {(adminsData || []).map((a: any) => (
                      <option key={a.id} value={a.id}>{a.firstName} {a.lastName} — {a.department}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Department</label>
                  <select className="input" value={form.department} onChange={e => set('department', e.target.value)}>
                    <option value="">Select...</option>
                    {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Position</label>
                  <input className="input" placeholder="e.g. Senior Dev" value={form.position} onChange={e => set('position', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Phone</label>
                <input className="input" placeholder="+91 9876543210" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 justify-end p-6 border-t border-gray-100 dark:border-gray-800">
              <button onClick={onClose} className="btn-secondary">Cancel</button>
              <button onClick={handleSubmit} disabled={isLoading} className="btn-primary">
                {isLoading ? 'Saving…' : employee ? 'Save Changes' : 'Add Employee'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
