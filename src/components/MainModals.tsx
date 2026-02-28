// Feature: UI | Trace: src/layouts/MainLayout.tsx
import React, { Suspense, lazy } from 'react';

const SettingsMenu = lazy(() => import('../components/SettingsMenu').then(m => ({ default: m.SettingsMenu })));
const SentinelInteractiveModal = lazy(() => import('../components/SentinelInteractiveModal').then(m => ({ default: m.SentinelInteractiveModal })));
const SentinelIntelModal = lazy(() => import('../components/SentinelIntelModal').then(m => ({ default: m.SentinelIntelModal })));
const BlockedUserModal = lazy(() => import('../components/BlockedUserModal').then(m => ({ default: m.BlockedUserModal })));

export const MainModals = ({ s, theme, setTheme }: any) => (
    <Suspense fallback={null}>
        <SettingsMenu 
            visible={s.isSettingsVisible} 
            onClose={() => s.setIsSettingsVisible(false)} 
            theme={theme} 
            setTheme={setTheme} 
            isAIMode={s.isAIMode} 
            setIsAIMode={s.setIsAIMode} 
            useProxy={s.useProxy} 
            setUseProxy={s.setUseProxy} 
            isScholarMode={s.isScholarMode} 
            setIsScholarMode={s.setIsScholarMode} 
            isDaemonRunning={s.isDaemonRunning} 
            onToggleDaemon={s.toggleDaemon} 
            layoutMode={s.layoutMode}
            setLayoutMode={s.setLayoutMode}
        />
        <SentinelInteractiveModal 
            visible={s.isInteractiveModalVisible} 
            question={s.interactiveRequest?.question || ''} 
            requestType={s.interactiveRequest?.type || 'confirm'} 
            theme={theme} 
            onResponse={s.handleInteractiveResponse} 
        />
        <SentinelIntelModal 
            visible={s.isIntelVisible} 
            onClose={() => s.setIsIntelVisible(false)} 
            theme={theme} 
            earningsData={s.earningsData} 
            domain={s.currentDomain} 
        />
        <BlockedUserModal 
            visible={s.isBlockedModalVisible} 
            reason={s.blockedReason} 
            theme={theme} 
            onClose={() => s.setIsBlockedModalVisible(false)} 
        />
    </Suspense>
);
