'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30000, retry: 1 } } }));
  return (
    <QueryClientProvider client={qc}>
      {children}
      <Toaster position="top-right" toastOptions={{
        style: { background: '#0F1C3F', color: '#fff', borderRadius: '12px', fontSize: '14px' },
        success: { iconTheme: { primary: '#0EA5E9', secondary: '#fff' } },
      }} />
    </QueryClientProvider>
  );
}
