'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AuthScreen from './AuthScreen';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // The OAuth callback page's entire job is to run while still logged out
  // (it's what turns the redirect's token into an authenticated session) --
  // gating it behind "is there a user yet" would prevent it from ever
  // mounting.
  if (pathname === '/auth/callback') {
    return <>{children}</>;
  }

  // Allow guest mode and application interface to render immediately
  return <>{children}</>;
}
