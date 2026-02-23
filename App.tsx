import React, { useState } from 'react';
import { View, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { HeadlessWebView } from './src/components/HeadlessWebView';
import { PromptInterface } from './src/components/PromptInterface';
import { TaskQueueUI } from './src/components/TaskQueueUI';
import { BrowserTabs } from './src/components/BrowserTabs';
import { BrowserChrome } from './src/components/BrowserChrome';
import { SettingsMenu } from './src/components/SettingsMenu';
import { SentientHeader } from './src/components/SentientHeader';
import { SentientStatusBar } from './src/components/SentientStatusBar';
import { BlockedUserModal } from './src/components/BlockedUserModal';
import { SentientControlPanel } from './src/components/SentientControlPanel';
import { useSentientBrowser } from './src/hooks/useSentientBrowser';
import { styles } from './App.styles';
import * as Animatable from 'react-native-animatable';

export type AppTheme = 'red' | 'blue';

export default function App() {
  const [theme, setTheme] = useState<AppTheme>('red');
  const s = useSentientBrowser(theme);

  return (
    <SafeAreaView style={styles.container}>
      <SentientHeader
        isAIMode={s.isAIMode}
        isSidebarVisible={s.isSidebarVisible}
        setIsSidebarVisible={s.setIsSidebarVisible}
        setIsSettingsVisible={s.setIsSettingsVisible}
        theme={theme}
      />

      <BrowserTabs tabs={s.tabs} onSelectTab={(id) => {
        s.setActiveTabId(id);
        const tab = s.tabs.find(t => t.id === id);
        if (tab) s.setActiveUrl(tab.url);
        s.setTabs(s.tabs.map(t => ({ ...t, isActive: t.id === id })));
      }} theme={theme} />

      <BrowserChrome url={s.activeUrl} onNavigate={s.setActiveUrl} onReload={() => {
        const url = s.activeUrl; s.setActiveUrl(''); setTimeout(() => s.setActiveUrl(url), 10);
      }} theme={theme} />

      <View style={styles.mainLayout}>
        <View style={styles.contentArea}>
          <View
            style={[
              styles.webViewWrapper,
              s.isAIMode && !s.isPaused && {
                borderWidth: 2,
                borderColor: theme === 'red' ? '#ff003c' : '#00d2ff',
              }
            ]}
            onStartShouldSetResponder={() => { s.trackManualInteraction(); return false; }}
          >
            {s.isAIMode && !s.isPaused ? (
              <Animatable.View
                animation="pulse"
                iterationCount="infinite"
                duration={2000}
                style={{ flex: 1 }}
              >
                <HeadlessWebView ref={s.webViewRef} isVisible={s.showWebView} url={s.activeUrl} useProxy={s.useProxy} onDomMapReceived={s.handleDomMapReceived} />
              </Animatable.View>
            ) : (
              <HeadlessWebView ref={s.webViewRef} isVisible={s.showWebView} url={s.activeUrl} useProxy={s.useProxy} onDomMapReceived={s.handleDomMapReceived} />
            )}
          </View>

          {s.isAIMode && (
            <SentientControlPanel
              isPaused={s.isPaused}
              onTogglePause={() => s.setIsPaused(!s.isPaused)}
              onStop={() => { s.setIsPaused(true); s.handleExecutePrompt(''); }}
              onNext={() => { }}
              onPrev={() => { }}
              theme={theme}
            />
          )}

          {!s.isDesktop && s.isAIMode && s.isSidebarVisible && (
            <View style={styles.mobileSidebarOverlay}>
              <TaskQueueUI tasks={s.tasks} theme={theme} />
              <PromptInterface onExecutePrompt={s.handleExecutePrompt} theme={theme} />
              <TouchableOpacity style={styles.closeSidebarButton} onPress={() => s.setIsSidebarVisible(false)}>
                <Text style={{ color: '#fff' }}>Close Assistant</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        {s.isDesktop && s.isAIMode && s.isSidebarVisible && (
          <View style={styles.sidebar}>
            <View style={styles.sidebarContent}><TaskQueueUI tasks={s.tasks} theme={theme} /></View>
            <PromptInterface onExecutePrompt={s.handleExecutePrompt} theme={theme} />
          </View>
        )}
      </View>

      <SentientStatusBar isAIMode={s.isAIMode} statusMessage={s.statusMessage} useProxy={s.useProxy} theme={theme} />

      <SettingsMenu
        visible={s.isSettingsVisible}
        onClose={() => s.setIsSettingsVisible(false)}
        theme={theme}
        setTheme={setTheme}
        isAIMode={s.isAIMode}
        setIsAIMode={s.setIsAIMode}
        useProxy={s.useProxy}
        setUseProxy={s.setUseProxy}
        isDaemonRunning={s.isDaemonRunning}
        onToggleDaemon={s.toggleDaemon}
      />

      <BlockedUserModal
        visible={s.isBlockedModalVisible}
        reason={s.blockedReason}
        theme={theme}
        onClose={() => s.setIsBlockedModalVisible(false)}
      />

      <ExpoStatusBar style="light" />
    </SafeAreaView>
  );
}
