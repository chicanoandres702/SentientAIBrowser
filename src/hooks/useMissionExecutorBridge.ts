// Feature: Core | Trace: README.md
import { useEffect } from 'react';
import { auth } from '../features/auth/firebase-config';
import { missionTaskExecutor } from '../services/mission-task.executor';
import { HeadlessWebViewRef } from '../components/HeadlessWebView';

interface BridgeArgs {
    webViewRef: React.RefObject<HeadlessWebViewRef>;
    isRemoteMirrorEnabled: boolean;
    setStatusMessage: (m: string) => void;
    setActivePrompt: (p: string) => void;
    setActiveUrl: (url: string) => void;
    updateTask: (id: string, status: any, details?: string) => Promise<void>;
    remoteActions?: { executeAction: (action: 'click' | 'type', targetId: string | undefined, value?: string, ariaSelector?: { role?: string; name?: string; text?: string }) => Promise<void> };
}

export const useMissionExecutorBridge = (args: BridgeArgs): void => {
    useEffect(() => {
        missionTaskExecutor.updateContext({
            webViewRef: args.webViewRef,
            setStatusMessage: args.setStatusMessage,
            setActivePrompt: args.setActivePrompt,
            setActiveUrl: args.setActiveUrl,
            updateTask: args.updateTask,
            remoteActions: args.remoteActions,
        });
    }, [
        args.webViewRef,
        args.setStatusMessage,
        args.setActivePrompt,
        args.setActiveUrl,
        args.updateTask,
        args.remoteActions,
    ]);

    useEffect(() => {
        // Why: backend mission loop is the source of truth in remote mirror/proxy mode.
        // Running MissionTaskExecutor in the client at the same time creates duplicate
        // writes and repeated start/stop churn.
        if (args.isRemoteMirrorEnabled) {
            return () => missionTaskExecutor.stop();
        }

        if (!auth.currentUser || !args.webViewRef.current) {
            return () => missionTaskExecutor.stop();
        }
        missionTaskExecutor.start({
            webViewRef: args.webViewRef,
            setStatusMessage: args.setStatusMessage,
            setActivePrompt: args.setActivePrompt,
            setActiveUrl: args.setActiveUrl,
            updateTask: args.updateTask,
            remoteActions: args.remoteActions,
        });
        return () => missionTaskExecutor.stop();
    }, [
        args.webViewRef,
        args.isRemoteMirrorEnabled,
    ]);
};
