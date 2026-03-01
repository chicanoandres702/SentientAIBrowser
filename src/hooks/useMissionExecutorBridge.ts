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
    remoteActions?: { executeAction: (action: 'click' | 'type', targetId: string, value?: string) => Promise<void> };
}

export const useMissionExecutorBridge = (args: BridgeArgs): void => {
    useEffect(() => {
        if (!auth.currentUser || (!args.webViewRef.current && !args.isRemoteMirrorEnabled)) {
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
        args.setStatusMessage,
        args.setActivePrompt,
        args.setActiveUrl,
        args.updateTask,
        args.remoteActions,
    ]);
};
