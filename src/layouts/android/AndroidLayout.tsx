// Feature: Android Layout | Trace: src/layouts/android/AndroidLayout.tsx
// Why: Full Android app shell — edge-to-edge, bottom-nav, slide sheets, BackHandler.
//      Replaces MainLayout when Platform.OS === 'android'.
import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { BrowserPreview } from '../../components/BrowserPreview';
import { RemoteMirrorPreview } from '../../components/RemoteMirrorPreview';
import { AndroidAddressBar } from './components/android-address-bar.component';
import { AndroidNavBar, type NavTab } from './components/android-nav-bar.component';
import { AndroidAISheet } from './components/android-ai-sheet.component';
import { AndroidTabsDrawer } from './components/android-tabs-drawer.component';
import type { AppTheme } from '../../../App';
import { BASE } from '../../features/ui/theme/ui.primitives';
import type { BrowserTab } from '../../features/core/core.types';

// Minimal typed surface of the useSentientBrowser state that AndroidLayout needs.
interface AndroidSState {
  activeUrl:           string;
  activeTabId:         string;
  tabs:                BrowserTab[];
  navigateWithGuard?:  (url: string) => void;
  navigateActiveTab:   (url: string) => void;
  navigateBack?:       () => void;
  navigateForward?:    () => void;
  handleReload?:       () => void;
  addNewTab:           (url: string) => Promise<string>;
  selectTab:           (id: string) => void;
  closeTab:            (id: string) => Promise<void>;
  handleExecutePrompt: (p: string) => Promise<void>;
  statusMessage:       string;
  isAIMode:            boolean;
  isRemoteMirrorEnabled: boolean;
  remoteMirror?:       { screenshot: string | null; lastError: string | null; isConnected: boolean };
  handleManualClick?:   (x: number, y: number, w: number, h: number) => void;
  handleManualMouseMove?: (x: number, y: number, w: number, h: number) => void;
  handleManualScroll?:  (dx: number, dy: number) => void;
  setIsSettingsVisible: (v: boolean) => void;
}

interface Props { s: AndroidSState; theme: AppTheme; setTheme: (t: AppTheme) => void; }

export const AndroidLayout: React.FC<Props> = ({ s, theme }) => {
  const [sheet, setSheet] = useState<NavTab | null>(null);
  const close = useCallback(() => setSheet(null), []);

  // Android hardware/gesture back button — close open sheet first, then exit
  useEffect(() => {
    const handler = () => { if (sheet) { close(); return true; } return false; };
    const sub = BackHandler.addEventListener('hardwareBackPress', handler);
    return () => sub.remove();
  }, [sheet, close]);

  const nav = s.navigateWithGuard ?? s.navigateActiveTab;

  return (
    <View style={s_.root}>
      <ExpoStatusBar style="light" backgroundColor={BASE.bgElevated} />
      <SafeAreaView style={s_.safe}>

        {/* ── Address Bar ──────────────────────────────────────────── */}
        <AndroidAddressBar
          url={s.activeUrl} onNavigate={nav}
          onBack={s.navigateBack} onForward={s.navigateForward} onReload={s.handleReload}
          theme={theme}
        />

        {/* ── Browser Viewport ──────────────────────────────────────── */}
        <View style={s_.viewport}>
          {s.isRemoteMirrorEnabled
            ? <RemoteMirrorPreview
                screenshot={s.remoteMirror?.screenshot ?? null}
                error={s.remoteMirror?.lastError ?? null}
                isConnected={s.remoteMirror?.isConnected ?? false}
                theme={theme}
                onPress={s.handleManualClick}
                onMouseMove={s.handleManualMouseMove}
                onScroll={s.handleManualScroll}
              />
            : <BrowserPreview
                tabId={s.activeTabId} theme={theme}
                onPress={s.handleManualClick}
                onMouseMove={s.handleManualMouseMove}
                onScroll={s.handleManualScroll}
              />
          }
        </View>

        {/* ── Bottom Nav Bar ────────────────────────────────────────── */}
        <AndroidNavBar
          active={sheet ?? 'browser'} onTabPress={(t) => setSheet(prev => prev === t ? null : t)}
          theme={theme} tabCount={s.tabs.length} isAIActive={s.isAIMode}
        />

      </SafeAreaView>

      {/* ── Slide-up Sheets ───────────────────────────────────────── */}
      <AndroidAISheet
        visible={sheet === 'ai'} onClose={close} theme={theme}
        onExecutePrompt={s.handleExecutePrompt} statusMessage={s.statusMessage} isAIMode={s.isAIMode}
      />
      <AndroidTabsDrawer
        visible={sheet === 'tabs'} onClose={close} theme={theme}
        tabs={s.tabs} activeTabId={s.activeTabId}
        onSelectTab={s.selectTab} onCloseTab={s.closeTab}
        onNewTab={() => s.addNewTab('about:blank')}
      />
    </View>
  );
};

const s_ = StyleSheet.create({
  root:     { flex: 1, backgroundColor: BASE.bg },
  safe:     { flex: 1 },
  viewport: { flex: 1 },
});
