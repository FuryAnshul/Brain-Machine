'use client';

import React, { useEffect, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCRMStore } from '@/lib/store';
import { sanitizeRedirectUrl } from '@/lib/security';
import { STORAGE_KEYS } from '@/lib/storageKeys';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * ARCHITECTURAL SECURITY DISCLOSURE:
 * Client-side route guarding is provided for application routing, navigation
 * flow, and user convenience. Client-side guards do NOT constitute a trusted
 * security boundary against determined client-side inspection or tampering.
 * True security enforcement must always occur on trusted server APIs and database boundaries.
 */

function AuthGuardInner({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    isHydrated,
    currentUser,
    init,
    validateSession,
    sessionTerminationReason,
    clearSessionTerminationReason,
  } = useCRMStore();

  // 1. Initial hydration on mount
  useEffect(() => {
    init();
  }, [init]);

  // 2. Handle browser bfcache, back/forward navigation & cross-tab sync
  useEffect(() => {
    const handlePageShow = () => {
      init();
      validateSession();
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.AUTH_SESSION || event.key === null) {
        init();
        validateSession();
      }
    };
    const handlePopState = () => {
      validateSession();
    };
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [init, validateSession]);

  // 3. Periodic session expiration check (every 60s)
  useEffect(() => {
    if (!isHydrated || !currentUser) return;
    const interval = setInterval(() => {
      const res = validateSession();
      if (!res.valid) {
        const reason = res.reason || 'expired';
        const returnUrl = encodeURIComponent(pathname);
        router.replace(`/login?reason=${reason}&returnUrl=${returnUrl}`);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [isHydrated, currentUser, pathname, router, validateSession]);

  // 4. Primary Route Guarding & Navigation Synchronization
  useEffect(() => {
    if (!isHydrated) return;

    const isLoginPage = pathname === '/login';

    // Verify session validity
    if (currentUser) {
      const res = validateSession();
      if (!res.valid) {
        const reason = res.reason || 'expired';
        const fullPath = searchParams.toString()
          ? `${pathname}?${searchParams.toString()}`
          : pathname;
        const returnUrl = encodeURIComponent(fullPath);
        router.replace(`/login?reason=${reason}&returnUrl=${returnUrl}`);
        return;
      }
    }

    if (!currentUser && !isLoginPage) {
      // Unauthenticated visitor on a protected route:
      // Capture current path + query parameters to preserve user destination
      const searchStr = searchParams.toString();
      const fullPath = searchStr ? `${pathname}?${searchStr}` : pathname;
      const returnUrl =
        fullPath && fullPath !== '/' ? encodeURIComponent(fullPath) : '';
      const reason = sessionTerminationReason;
      const queryParts: string[] = [];
      if (reason) queryParts.push(`reason=${reason}`);
      if (returnUrl) queryParts.push(`returnUrl=${returnUrl}`);
      const loginTarget = queryParts.length > 0 ? `/login?${queryParts.join('&')}` : '/login';
      router.replace(loginTarget);
    } else if (currentUser && isLoginPage) {
      // Authenticated user landing on /login -> direct them to returnUrl or dashboard
      const rawReturnUrl = searchParams.get('returnUrl');
      const target = sanitizeRedirectUrl(rawReturnUrl);
      router.replace(target);
    }

    if (isLoginPage && sessionTerminationReason) {
      clearSessionTerminationReason();
    }
  }, [
    isHydrated,
    currentUser,
    pathname,
    router,
    searchParams,
    validateSession,
    sessionTerminationReason,
    clearSessionTerminationReason,
  ]);

  // A. While hydrating store from localStorage:
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Initializing workspace...
          </p>
        </div>
      </div>
    );
  }

  // B. While unauthenticated on a protected route: prevent protected UI flash
  if (!currentUser && pathname !== '/login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Redirecting to sign in...
          </p>
        </div>
      </div>
    );
  }

  // C. While authenticated on /login: prevent login form flash while redirecting to app
  if (currentUser && pathname === '/login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Redirecting to workspace...
          </p>
        </div>
      </div>
    );
  }

  // D. Allowed state: render protected or public content
  return <>{children}</>;
}

export function AuthGuard({ children }: AuthGuardProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthGuardInner>{children}</AuthGuardInner>
    </Suspense>
  );
}
