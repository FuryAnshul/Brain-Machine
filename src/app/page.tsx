'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCRMStore } from '@/lib/store';

export default function RootPage() {
  const router = useRouter();
  const { isHydrated, currentUser, init } = useCRMStore();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!isHydrated) return;
    if (currentUser) {
      router.replace('/clients');
    } else {
      router.replace('/login');
    }
  }, [isHydrated, currentUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
