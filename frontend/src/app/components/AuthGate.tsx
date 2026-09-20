'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AuthScreen from './AuthScreen';
import SplashScreen, { SPLASH_TOTAL_MS, SPLASH_FADE_MS } from '@/components/SplashScreen';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Splash plays on initial entry (unless landing on OAuth callback)
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === 'undefined') return true;
    return pathname !== '/auth/callback';
  });
  const [splashVisible, setSplashVisible] = useState(true);

  const handleDismiss = useCallback(() => {
    setSplashVisible(false);
    setTimeout(() => setShowSplash(false), SPLASH_FADE_MS);
  }, []);

  useEffect(() => {
    if (!showSplash) return;
    const fadeTimer = setTimeout(() => setSplashVisible(false), SPLASH_TOTAL_MS - SPLASH_FADE_MS);
    const removeTimer = setTimeout(() => setShowSplash(false), SPLASH_TOTAL_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [showSplash]);

  // The OAuth callback page's entire job is to run while still logged out
  // (it's what turns the redirect's token into an authenticated session) --
  // gating it behind "is there a user yet" would prevent it from ever
  // mounting.
  if (pathname === '/auth/callback') {
    return <>{children}</>;
  }

  if (showSplash) {
    return <SplashScreen visible={splashVisible} onDismiss={handleDismiss} />;
  }

  if (loading) {
    return <SplashScreen visible={true} />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <>{children}</>;
}
