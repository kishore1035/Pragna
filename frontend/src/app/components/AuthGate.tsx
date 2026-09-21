'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AuthScreen from './AuthScreen';
import SplashScreen, { SPLASH_TOTAL_MS, SPLASH_FADE_MS } from '@/components/SplashScreen';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Splash plays on initial entry once per browser session (skipped on OAuth callback and reset-password)
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (pathname === '/auth/callback' || pathname === '/reset-password') return false;
    const hasSeen = sessionStorage.getItem('pragna_seen_splash');
    return !hasSeen;
  });
  const [splashVisible, setSplashVisible] = useState(true);

  const handleDismiss = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pragna_seen_splash', '1');
    }
    setSplashVisible(false);
    setTimeout(() => setShowSplash(false), SPLASH_FADE_MS);
  }, []);

  useEffect(() => {
    if (!showSplash) return;
    const fadeTimer = setTimeout(() => {
      setSplashVisible(false);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pragna_seen_splash', '1');
      }
    }, SPLASH_TOTAL_MS - SPLASH_FADE_MS);
    const removeTimer = setTimeout(() => setShowSplash(false), SPLASH_TOTAL_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [showSplash]);

  // The OAuth callback and password reset pages must run while logged out --
  // gating them behind "is there a user yet" would prevent them from ever mounting.
  if (pathname === '/auth/callback' || pathname === '/reset-password') {
    return <>{children}</>;
  }

  if (showSplash) {
    return <SplashScreen visible={splashVisible} onDismiss={handleDismiss} />;
  }

  if (loading) {
    return null;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <>{children}</>;
}
