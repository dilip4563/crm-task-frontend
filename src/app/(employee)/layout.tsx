'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import { getUser } from '@/lib/auth';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    const user = getUser();
    if (!user) { router.replace('/login'); return; }
    if (user.mustChangePassword) { router.replace('/change-password'); }
  }, [router]);

  return (
    <div className="flex min-h-screen bg-[#F0F4FA] dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 ml-[240px] transition-all duration-200">
        {children}
      </main>
    </div>
  );
}
