'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Shield, Users, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { setAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      const { data } = await authApi.login(form);
      setAuth(data.token, data.user);
      toast.success(`Welcome back, ${data.user.firstName}!`);
      if (data.user.mustChangePassword) { router.push('/change-password'); return; }
      router.push(data.user.role === 'ADMIN' ? '/dashboard' : '/my-tasks');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left – Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0F1C3F] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-[#0EA5E9] rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-600 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-[#0EA5E9] rounded-xl p-2.5"><CheckSquare size={24} className="text-white" /></div>
            <span className="text-white font-bold text-2xl">TaskCRM</span>
          </div>
        </div>
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-extrabold text-white leading-tight">Enterprise Task<br />Management System</h1>
            <p className="text-slate-400 mt-3 text-lg">Streamline your team's productivity with real-time task tracking and analytics.</p>
          </div>
          <div className="space-y-4">
            {[
              { icon: Shield, text: 'Role-based access control' },
              { icon: Users, text: 'Manage up to 500+ employees' },
              { icon: CheckSquare, text: 'Real-time task notifications' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-slate-300">
                <div className="bg-white/10 rounded-lg p-2"><Icon size={16} className="text-[#0EA5E9]" /></div>
                <span className="text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-slate-500 text-xs">© 2024 TaskCRM. All rights reserved.</p>
      </div>

      {/* Right – Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F0F4FA]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="bg-[#0EA5E9] rounded-xl p-2"><CheckSquare size={20} className="text-white" /></div>
            <span className="font-bold text-xl text-[#0F1C3F]">TaskCRM</span>
          </div>
          <div className="card p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-[#0F1C3F]">Welcome back</h2>
              <p className="text-gray-500 mt-1 text-sm">Sign in to your account to continue</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
                <input className="input" placeholder="Enter your user ID" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} autoComplete="username" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input className="input pr-10" type={show ? 'text' : 'password'} placeholder="Enter your password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} autoComplete="current-password" />
                  <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex items-center gap-2 py-2.5 text-sm">
                {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in…</> : 'Sign In'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
