// Feature: Core | Trace: README.md
import React, { useState, useEffect } from 'react';
import { View, Platform } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useSentientBrowser } from './src/hooks/useSentientBrowser';
import { useAuth } from './src/features/auth/hooks/use-auth.hook';
import { AuthModal } from './src/features/auth/components/auth-modal.ui';
import { MainLayout } from './src/layouts/MainLayout';
import { AndroidLayout } from './src/layouts/android/AndroidLayout';
import { BASE } from './src/features/ui/theme/ui.theme';

export type AppTheme = 'red' | 'blue';

export default function App() {
  const [theme, setTheme] = useState<AppTheme>('red');
  const s = useSentientBrowser(theme);
  const { user, isLoading } = useAuth();

  // Enable passive event listeners for better web performance
  useEffect(() => {
    if (Platform.OS === 'web') {
      const originalAddEventListener = window.addEventListener;
      window.addEventListener = function(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
        if (type === 'wheel' || type === 'touchmove' || type === 'touchstart') {
          const newOptions = typeof options === 'object' ? { ...options, passive: true } : { passive: true };
          return originalAddEventListener.call(window, type, listener, newOptions);
        }
        return originalAddEventListener.call(window, type, listener, options);
      };
    }
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: BASE.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ExpoStatusBar style="light" />
      </View>
    );
  }

  // Why: Android gets its own optimised shell with bottom nav, slide sheets, BackHandler,
  //      and edge-to-edge layout. Web + iOS continue using the existing MainLayout.
  if (Platform.OS === 'android') {
    return (
      <View style={{ flex: 1, backgroundColor: BASE.bg }}>
        {/* Why: cast is safe — useSentientBrowser returns a superset of AndroidSState */}
        <AndroidLayout
          s={{ ...(s as unknown as Parameters<typeof AndroidLayout>[0]['s']), userId: user?.uid }}
          theme={theme} setTheme={setTheme}
        />
        {!user && !isLoading && <AuthModal theme={theme} />}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BASE.bg }}>
      <MainLayout s={s} theme={theme} setTheme={setTheme} />
      <ExpoStatusBar style="light" />
      {!user && !isLoading && <AuthModal theme={theme} />}
    </View>
  );
}
