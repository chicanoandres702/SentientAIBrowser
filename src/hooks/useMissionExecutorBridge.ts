// Feature: Core | Trace: README.md
import { useEffect } from 'react';
import { missionTaskExecutor } from '../services/mission-task.executor';
import { HeadlessWebViewRef } from '@features/browser';

interface BridgeArgs {
    webViewRef: React.RefObject<HeadlessWebViewRef>;
    isRemoteMirrorEnabled: boolean;
    setStatusMessage: (m: string) => void;
    setActivePrompt: (p: string) => void;
    setActiveUrl: (url: string) => void;
    updateTask: (id: string, status: any, details?: string) => any;
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
        // Why: backend mission loop is the single writer for mission/task progression
        // in BOTH remote and non-remote modes. Enabling the frontend executor creates
        // race conditions (stale active task, flicker, status thrash).
        missionTaskExecutor.stop();
        return () => missionTaskExecutor.stop();
    }, [
        args.isRemoteMirrorEnabled,
    ]);
};
