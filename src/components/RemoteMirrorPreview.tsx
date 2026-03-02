// Feature: Remote Mirror | Why: Live SSE preview — keeps last frame on reconnect, zero-flicker on web
import React, { useRef, useState } from 'react';
import { Image, Platform, Text, View } from 'react-native';
import { previewStyles as styles } from '../features/browser/components/BrowserPreview.styles';
import { uiColors } from '../features/ui/theme/ui.theme';
import { useRemoteMirrorInteraction } from '../features/browser/hooks/use-remote-mirror-interaction';

interface Props {
    screenshot: string | null;
    error: string | null;
    isConnected: boolean;
    theme: 'red' | 'blue';
    onPress?: (x: number, y: number, w: number, h: number) => void;
    onMouseMove?: (x: number, y: number, w: number, h: number) => void;
    onScroll?: (deltaX: number, deltaY: number) => void;
}

const BADGE: object = { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 };

/** Remote screenshot viewer — buffers last frame so reconnects never flash blank */
export const RemoteMirrorPreview: React.FC<Props> = ({
    screenshot, error, isConnected, theme, onPress, onMouseMove, onScroll,
}) => {
    const colors = uiColors(theme);
    const [size, setSize] = useState({ w: 1, h: 1 });
    const { containerRef } = useRemoteMirrorInteraction(onMouseMove, onScroll);
    // Why: buffer last good frame — on SSE reconnect, screenshot=null briefly;
    // showing blank here is jarring. Keep displaying stale frame + badge instead.
    const lastGoodRef = useRef<string | null>(null);
    if (screenshot) lastGoodRef.current = screenshot;
    const displayUri = screenshot ?? lastGoodRef.current;
    const isReconnecting = !screenshot && !!lastGoodRef.current && !error;

    return (
        <View
            ref={containerRef}
            style={styles.container}
            onLayout={e => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
            onStartShouldSetResponder={() => true}
            onResponderGrant={e => onPress?.(e.nativeEvent.locationX, e.nativeEvent.locationY, size.w, size.h)}
        >
            {displayUri && (Platform.OS === 'web'
                ? <View style={[styles.screenshot, { backgroundImage: `url("${displayUri}")`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' } as any]} />
                : <Image source={{ uri: displayUri }} style={styles.screenshot} resizeMode="contain" />
            )}
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
        </View>
    );
};
