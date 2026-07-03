'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    const user = getUser();
    if (!user) { router.replace('/login'); return; }
    router.replace(user.role !== 'EMPLOYEE' ? '/dashboard' : '/my-tasks');
  }, [router]);
  return <div className="min-h-screen flex items-center justify-center bg-[#0F1C3F]"><div className="w-8 h-8 border-4 border-[#0EA5E9] border-t-transparent rounded-full animate-spin" /></div>;
}
