// Feature: Remote Mirror | Why: Lightweight live preview for SSE screenshots
import React from 'react';
import { Image, Text, View } from 'react-native';
import { previewStyles as styles } from '../features/browser/components/BrowserPreview.styles';
import { uiColors } from '../features/ui/theme/ui.theme';

interface Props {
    screenshot: string | null;
    error: string | null;
    isConnected: boolean;
    theme: 'red' | 'blue';
}

export const RemoteMirrorPreview: React.FC<Props> = ({ screenshot, error, isConnected, theme }) => {
    const colors = uiColors(theme);
    if (error) {
        return (
            <View style={styles.container}>
                <Text style={[styles.statusTitle, { color: colors.textMuted }]}>Remote stream error</Text>
                <Text style={[styles.statusHint, { color: colors.textMuted }]}>{error}</Text>
            </View>
        );
    }
    if (!screenshot) {
        return (
            <View style={styles.container}>
                <Text style={[styles.statusTitle, { color: colors.textMuted }]}>Connecting…</Text>
                <Text style={[styles.statusHint, { color: colors.textMuted }]}>
                    {isConnected ? 'Waiting for first frame' : 'No stream yet'}
                </Text>
            </View>
        );
    }
    return (
        <View style={styles.container}>
            <Image source={{ uri: screenshot }} style={styles.screenshot} resizeMode="contain" />
        </View>
    );
};
