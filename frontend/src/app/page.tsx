'use client';

// =============================================================================
// Home Page — Redirects to Dashboard or Login
// =============================================================================

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function HomePage() {
  const router = useRouter();
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();

    // After initialization, check auth state and redirect
    const timer = setTimeout(() => {
      const { isAuthenticated } = useAuthStore.getState();
      router.push(isAuthenticated ? '/dashboard' : '/login');
    }, 100);

    return () => clearTimeout(timer);
  }, [router, initialize]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  );
}
