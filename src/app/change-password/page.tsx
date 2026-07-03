'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { setAuth, getUser, clearAuth } from '@/lib/auth';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    if (form.newPassword !== form.confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const { data } = await authApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setAuth(data.token, data.user);
      toast.success('Password changed successfully!');
      router.push(data.user.role !== 'EMPLOYEE' ? '/dashboard' : '/my-tasks');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const user = getUser();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F4FA] p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-[#0EA5E9] rounded-xl p-2.5"><CheckSquare size={24} className="text-white" /></div>
          <span className="font-bold text-2xl text-[#0F1C3F]">TaskCRM</span>
        </div>
        <div className="card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-100 rounded-xl p-2.5"><Lock size={20} className="text-amber-600" /></div>
            <div>
              <h2 className="text-xl font-bold text-[#0F1C3F]">Set New Password</h2>
              <p className="text-sm text-gray-500">Hi {user?.firstName}, please set a new password to continue.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Current Password</label>
              <input type="password" className="input" placeholder="••••••••" value={form.currentPassword} onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
              <input type="password" className="input" placeholder="Min 8 characters" value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
              <input type="password" className="input" placeholder="Re-enter new password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex items-center gap-2 py-2.5 text-sm mt-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</> : 'Change Password'}
            </button>
          </form>
          <button onClick={() => { clearAuth(); router.push('/login'); }} className="mt-4 text-xs text-gray-400 hover:text-gray-600 w-full text-center">Sign out instead</button>
        </div>
      </motion.div>
    </div>
  );
}
