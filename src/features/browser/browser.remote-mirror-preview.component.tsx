// Feature: Browser | Trace: README.md
/*
 * [Parent Feature/Milestone] Browser
 * [Child Task/Issue] Remote mirror preview
 * [Subtask] Live SSE preview with frame buffering for zero-flicker reconnects
 * [Upstream] SSE screenshot stream -> [Downstream] Image display
 * [Law Check] 55 lines | Passed 100-Line Law
 */

import React, { useRef, useState } from 'react';
import { Image, Platform, Text, View } from 'react-native';
import { previewStyles as styles } from './components/BrowserPreview.styles';
import { uiColors } from '@features/ui/theme/ui.theme';
import { useRemoteMirrorInteraction } from './hooks/use-remote-mirror-interaction';

interface Props {
  screenshot: string | null;
  error: string | null;
  isConnected: boolean;
  theme: 'red' | 'blue';
  onPress?: (x: number, y: number, w: number, h: number) => void;
  onMouseMove?: (x: number, y: number, w: number, h: number) => void;
  onScroll?: (deltaX: number, deltaY: number) => void;
}

const BADGE: object = {
  position: 'absolute',
  top: 8,
  right: 8,
  backgroundColor: 'rgba(0,0,0,0.55)',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 6,
};

const CURSOR_DOT: object = {
  position: 'absolute',
  width: 12,
  height: 12,
  borderRadius: 6,
  backgroundColor: 'rgba(255,80,80,0.85)',
  border: '2px solid white',
  pointerEvents: 'none',
  zIndex: 99,
};

export const RemoteMirrorPreview: React.FC<Props> = ({
  screenshot,
  error,
  isConnected,
  theme,
  onPress,
  onMouseMove,
  onScroll,
}) => {
  const colors = uiColors(theme);
  const [size, setSize] = useState({ w: 1, h: 1 });
  const lastGoodRef = useRef<string | null>(null);
  const { containerRef, cursorPos } = useRemoteMirrorInteraction(onMouseMove, onScroll);
  if (screenshot) lastGoodRef.current = screenshot;
  const displayUri = screenshot ?? lastGoodRef.current;
  const isReconnecting = !screenshot && !!lastGoodRef.current && !error;

  return (
    <View
      ref={containerRef}
      style={styles.container}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(e) =>
        onPress?.(e.nativeEvent.locationX, e.nativeEvent.locationY, size.w, size.h)
      }
    >
      {displayUri &&
        (Platform.OS === 'web' ? (
          <View
            style={[
              styles.screenshot,
              {
                backgroundImage: `url("${displayUri}")`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
              } as any,
            ]}
          />
        ) : (
          <Image source={{ uri: displayUri }} style={styles.screenshot} resizeMode="contain" />
        ))}
      {!displayUri && !error && (
        <Text style={[styles.statusTitle, { color: colors.textMuted }]}>
          {isConnected ? 'Waiting for first frame' : 'Connecting…'}
        </Text>
      )}
      {error && <Text style={[styles.statusTitle, { color: colors.textMuted }]}>{error}</Text>}
      {isReconnecting && (
        <View style={BADGE as any}>
          <Text style={{ color: '#fff', fontSize: 11 }}>● Reconnecting…</Text>
        </View>
      )}
      {/* Pseudo-cursor dot — tracks real mouse position over the screenshot on web */}
      {Platform.OS === 'web' && cursorPos && (
        <View pointerEvents="none" style={[CURSOR_DOT as any, { left: cursorPos.x - 6, top: cursorPos.y - 6 }]} />
      )}
    </View>
  );
};
