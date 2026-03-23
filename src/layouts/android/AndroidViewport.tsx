// Feature: Android Viewport | Trace: src/layouts/android/AndroidViewport.tsx
// Why: Extracts viewport logic from AndroidLayout for modularity and Sentient compliance.
import React from 'react';
import { View } from 'react-native';
import { BrowserPreview } from '../../components/BrowserPreview';
import { RemoteMirrorPreview } from '../../components/RemoteMirrorPreview';
import type { AppTheme } from '../../../App';
import type { AndroidSState } from './AndroidLayout';

interface Props {
  s: AndroidSState;
  theme: AppTheme;
}

export const AndroidViewport: React.FC<Props> = ({ s, theme }) => (
  <View style={{ flex: 1 }}>
    {s.isRemoteMirrorEnabled
      ? <RemoteMirrorPreview
          screenshot={s.remoteMirror?.screenshot ?? null}
          error={s.remoteMirror?.lastError ?? null}
          isConnected={s.remoteMirror?.isConnected ?? false}
          theme={theme} onPress={s.handleManualClick}
          onMouseMove={s.handleManualMouseMove} onScroll={s.handleManualScroll}
        />
      : <BrowserPreview tabId={s.activeTabId} theme={theme}
          onPress={s.handleManualClick}
          onMouseMove={s.handleManualMouseMove} onScroll={s.handleManualScroll}
        />
    }
  </View>
);
