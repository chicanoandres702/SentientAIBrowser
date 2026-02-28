// Feature: Core | Trace: README.md
import React, { useState, useEffect } from 'react';
import { View, Platform } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useSentientBrowser } from './src/hooks/useSentientBrowser';
import { useAuth } from './src/features/auth/hooks/use-auth.hook';
import { AuthModal } from './src/features/auth/components/auth-modal.ui';
import { MainLayout } from './src/layouts/MainLayout';
import { uiColors, BASE } from './src/features/ui/theme/ui.theme';

export type AppTheme = 'red' | 'blue';

export default function App() {
  const [theme, setTheme] = useState<AppTheme>('red');
  const colors = uiColors(theme);
  const s = useSentientBrowser(theme);
  const { user, isLoading } = useAuth();

  // Enable passive event listeners for better web performance
  useEffect(() => {
    if (Platform.OS === 'web') {
      const originalAddEventListener = window.addEventListener;
      window.addEventListener = function(type: string, listener: any, options?: any) {
        if (type === 'wheel' || type === 'touchmove' || type === 'touchstart') {
          const newOptions = typeof options === 'object' ? { ...options, passive: true } : { passive: true };
          return originalAddEventListener.call(window, type, listener, newOptions);
        }
        return originalAddEventListener.call(window, type, listener, options);
      } as any;
    }
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: BASE.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ExpoStatusBar style="light" />
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
