'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import Navbar from '@/components/shared/Navbar';
import { Plus, CheckCircle, XCircle, KeyRound, Copy, ShieldCheck, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { isSuperAdmin } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const DEPTS = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Support', 'Design'];

export default function AdminsPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', department: '', phone: '' });
  const [credentials, setCredentials] = useState<{ userId: string; password: string; name: string } | null>(null);

  useEffect(() => { if (!isSuperAdmin()) router.replace('/dashboard'); }, [router]);

  const { data, isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: () => adminApi.getAdmins().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => adminApi.createAdmin(d),
    onSuccess: (r, vars: any) => {
      toast.success('Admin created!');
      qc.invalidateQueries({ queryKey: ['admins'] });
      setModalOpen(false);
      const creds = r.data?.credentials;
      if (creds) setCredentials({ userId: creds.userId, password: creds.password, name: `${vars.firstName} ${vars.lastName}` });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: any) => adminApi.updateAdmin(id, { isActive }),
    onSuccess: () => { toast.success('Updated!'); qc.invalidateQueries({ queryKey: ['admins'] }); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const resetPassword = useMutation({
    mutationFn: (id: string) => adminApi.resetAdminPassword(id),
    onSuccess: (r) => toast.success(`Temp password: ${r.data.tempPassword}`, { duration: 10000 }),
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const admins = data?.admins || [];

  const submit = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.department) return toast.error('Fill all required fields');
    createMutation.mutate(form);
  };

  return (
    <div>
      <Navbar title="Department Admins" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Department managers who can manage their own team and assign tasks to their employees.</p>
          <button onClick={() => { setForm({ firstName: '', lastName: '', email: '', department: '', phone: '' }); setModalOpen(true); }}
            className="btn-primary flex items-center gap-2 text-sm"><Plus size={16} /> Add Admin</button>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#0F1C3F] text-white">
              <tr>
                {['Admin', 'User ID', 'Department', 'Team Size', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading…</td></tr>
              ) : admins.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No admins yet — add your first department manager</td></tr>
              ) : admins.map((adm: any, i: number) => (
                <motion.tr key={adm.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className={`border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/30'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        <ShieldCheck size={15} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-100">{adm.firstName} {adm.lastName}</p>
                        <p className="text-gray-400 text-xs">{adm.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono text-xs">{adm.username}</td>
                  <td className="px-4 py-3"><span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">{adm.department || '—'}</span></td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{adm._count?.teamMembers ?? 0} employees</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${adm.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                      {adm.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleActive.mutate({ id: adm.id, isActive: !adm.isActive })} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title={adm.isActive ? 'Deactivate' : 'Activate'}>
                        {adm.isActive ? <XCircle size={14} /> : <CheckCircle size={14} />}
                      </button>
                      <button onClick={() => { if (confirm('Reset password?')) resetPassword.mutate(adm.id); }} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Reset Password">
                        <KeyRound size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create admin modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg z-10">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h2 className="text-lg font-bold text-[#0F1C3F] dark:text-white">Add Department Admin</h2>
                  <p className="text-sm text-gray-500 mt-0.5">This manager will run their own team</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[['firstName', 'First Name'], ['lastName', 'Last Name']].map(([k, label]) => (
                    <div key={k}>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">{label} <span className="text-red-500">*</span></label>
                      <input className="input" value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Email <span className="text-red-500">*</span></label>
                  <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Department <span className="text-red-500">*</span></label>
                    <select className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                      <option value="">Select...</option>
                      {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Phone</label>
                    <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl p-3">
                  <p className="text-xs text-purple-700 dark:text-purple-300">🔐 A <b>User ID</b> (adm000X) and <b>Password</b> will be generated automatically. The admin can then create and manage their own employees.</p>
                </div>
              </div>
              <div className="flex gap-3 justify-end p-6 border-t border-gray-100 dark:border-gray-800">
                <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                <button onClick={submit} disabled={createMutation.isPending} className="btn-primary">
                  {createMutation.isPending ? 'Creating…' : 'Add Admin'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Credentials dialog */}
      <AnimatePresence>
        {credentials && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
              <div className="bg-gradient-to-br from-purple-700 to-indigo-600 p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck size={24} className="text-white" />
                </div>
                <h2 className="text-white font-bold text-lg">Admin Created!</h2>
                <p className="text-white/70 text-sm mt-1">Login credentials for {credentials.name}</p>
              </div>
              <div className="p-6 space-y-3">
                {[['User ID', credentials.userId], ['Password', credentials.password]].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold">{label}</p>
                      <p className="font-mono font-bold text-[#0F1C3F] dark:text-white">{value}</p>
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(value); toast.success(`${label} copied!`); }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Copy size={16} /></button>
                  </div>
                ))}
                <button onClick={() => { navigator.clipboard.writeText(`User ID: ${credentials.userId}\nPassword: ${credentials.password}`); toast.success('Credentials copied!'); }}
                  className="w-full btn-secondary text-sm flex items-center justify-center gap-2"><Copy size={14} /> Copy Both</button>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                  <p className="text-xs text-amber-700 dark:text-amber-300">⚠️ Shown <b>only once</b>. Share securely — the admin must change it on first login.</p>
                </div>
                <button onClick={() => setCredentials(null)} className="w-full btn-primary">Done</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
