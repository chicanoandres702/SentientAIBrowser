// Feature: Core | Trace: README.md
import React, { useState } from 'react';
import { View } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useSentientBrowser } from './src/hooks/useSentientBrowser';
import { useAuth } from './src/features/auth/hooks/use-auth.hook';
import { AuthModal } from './src/features/auth/components/auth-modal.ui';
import { MainLayout } from './src/layouts/MainLayout';

export type AppTheme = 'red' | 'blue';

export default function App() {
  const [theme, setTheme] = useState<AppTheme>('red');
  const s = useSentientBrowser(theme);
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ExpoStatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <MainLayout s={s} theme={theme} setTheme={setTheme} />
      <ExpoStatusBar style="light" />
      {!user && !isLoading && <AuthModal theme={theme} />}
    </View>
  );
}
