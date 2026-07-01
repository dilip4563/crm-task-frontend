'use client';
import { useState } from 'react';
import { Search, Sun, Moon } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { getUser } from '@/lib/auth';

export default function Navbar({ title }: { title: string }) {
  const [dark, setDark] = useState(false);
  const user = getUser();

  const toggleDark = () => {
    setDark(d => !d);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="h-[68px] bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 flex items-center px-6 gap-4 sticky top-0 z-20 shadow-sm">
      <h1 className="font-bold text-[#0F1C3F] dark:text-white text-lg flex-1">{title}</h1>
      <div className="flex items-center gap-3">
        <button onClick={toggleDark} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <NotificationBell />
        <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200 dark:border-slate-600">
          <div className="w-8 h-8 rounded-full bg-[#0F1C3F] flex items-center justify-center text-white text-xs font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 dark:text-white">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
