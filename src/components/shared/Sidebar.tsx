'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, LayoutDashboard, Users, ClipboardList, BarChart3, Bell, LogOut, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { clearAuth, getUser, isAdmin } from '@/lib/auth';
import { disconnectSocket } from '@/lib/socket';
import { useState } from 'react';

const adminNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/employees', icon: Users, label: 'Employees' },
  { href: '/tasks', icon: ClipboardList, label: 'Tasks' },
  { href: '/reports', icon: BarChart3, label: 'Reports' },
];
const employeeNav = [
  { href: '/my-tasks', icon: ClipboardList, label: 'My Tasks' },
  { href: '/my-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();
  const admin = isAdmin();
  const [collapsed, setCollapsed] = useState(false);
  const nav = admin ? adminNav : employeeNav;

  const logout = () => { disconnectSocket(); clearAuth(); router.push('/login'); };

  return (
    <motion.aside animate={{ width: collapsed ? 72 : 240 }} transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-full bg-[#0F1C3F] flex flex-col z-30 overflow-hidden shadow-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10 min-h-[68px]">
        <div className="flex-shrink-0 bg-[#0EA5E9] rounded-xl p-2"><CheckSquare size={18} className="text-white" /></div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-bold text-white text-lg whitespace-nowrap">
              TaskCRM
            </motion.span>
          )}
        </AnimatePresence>
        <button onClick={() => setCollapsed(c => !c)}
          className="ml-auto text-white/40 hover:text-white transition-colors flex-shrink-0">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${active ? 'bg-[#0EA5E9] text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
              <Icon size={18} className="flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium whitespace-nowrap">
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-white/10 p-3 space-y-1">
        {user && (
          <div className={`flex items-center gap-3 px-3 py-2 rounded-xl ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-[#0EA5E9] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-white/40 text-xs truncate capitalize">{user.role?.toLowerCase()}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        <button onClick={logout} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all ${collapsed ? 'justify-center' : ''}`}>
          <LogOut size={16} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm">Logout</motion.span>}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
