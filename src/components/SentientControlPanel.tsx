// Feature: UI | Trace: README.md — Persistent collapsible control panel HUD
/*
 * [Parent Feature/Milestone] Control Panel UI
 * [Child Task/Issue] Persistent docked HUD — always visible, collapsible
 * [Subtask] Collapsed = status strip; expanded = full playback pill
 * [Upstream] PreviewStage → [Downstream] all layout modes
 * [Law Check] 88 lines | Passed 100-Line Law
 */
import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Animated } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { AppTheme } from '../../App';
import { uiColors, BASE } from '../features/ui/theme/ui.theme';
import { styles } from './SentientControlPanel.styles';

interface Props {
    isPaused: boolean;
    onTogglePause: () => void;
    onStop: () => void;
    onNext: () => void;
    onPrev: () => void;
    isAIMode?: boolean;
    modeLabel?: string;
    isRemoteMirrorEnabled?: boolean;
    onToggleRemoteMirror?: () => void;
    theme: AppTheme;
}

export const SentientControlPanel: React.FC<Props> = React.memo(({
    isPaused, onTogglePause, onStop, onNext, onPrev,
    isAIMode = false, modeLabel,
    isRemoteMirrorEnabled, onToggleRemoteMirror, theme,
}) => {
    const colors = uiColors(theme);
    const accent = colors.accent;
    const [collapsed, setCollapsed] = useState(false);
    const shockwaveAnim = useRef(new Animated.Value(0)).current;

    const triggerShockwave = () => {
        shockwaveAnim.setValue(0);
        Animated.timing(shockwaveAnim, {
            toValue: 1, duration: 500,
            useNativeDriver: Platform.OS !== 'web',
        }).start(() => shockwaveAnim.setValue(0));
    };

    const handlePress = (cb: () => void) => { triggerShockwave(); cb(); };

    const shockOpacity = shockwaveAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.4, 0] });
    const shockScale = shockwaveAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 2.5] });

    const ledColor = !isAIMode ? BASE.textFaint : isPaused ? BASE.warning : accent;
    const statusText = !isAIMode ? 'IDLE' : isPaused ? 'PAUSED' : 'LIVE';
    const displayMode = modeLabel ?? (isAIMode ? 'SENTIENT' : 'MANUAL');

    if (collapsed) {
        return (
            <View style={styles.container}>
                <View style={styles.collapsedRow}>
                    <View style={styles.collapsedLeft}>
                        <View style={[styles.statusDot, { backgroundColor: ledColor, ...(Platform.OS === 'web' ? { boxShadow: isAIMode ? `0 0 7px ${ledColor}` : 'none' } as any : {}) }]} />
                        <Text style={[styles.collapsedLabel, { color: ledColor }]}>{statusText}</Text>
                        <Text style={styles.collapsedMode}>{displayMode}</Text>
                    </View>
                    <TouchableOpacity style={styles.expandBtn} onPress={() => setCollapsed(false)}>
                        <Text style={styles.expandIcon}>▲</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.pill}>
                <TouchableOpacity style={styles.sideBtn} onPress={() => handlePress(onPrev)}>
                    <Text style={styles.sideIcon}>⏮</Text>
                </TouchableOpacity>
                <Animatable.View animation={isAIMode && !isPaused ? 'pulse' : undefined} iterationCount="infinite" duration={1500}>
                    <TouchableOpacity
                        style={[styles.mainBtn, { borderColor: accent, ...(Platform.OS === 'web' ? { boxShadow: `0 0 12px ${accent}` } as any : {}) }]}
                        onPress={() => handlePress(onTogglePause)}
                    >
                        <Animated.View style={[styles.shockwave, { backgroundColor: accent, opacity: shockOpacity, transform: [{ scale: shockScale }] }]} />
                        <View style={[styles.mainBtnInner, { backgroundColor: isPaused ? 'transparent' : accent }]}>
                            <Text style={[styles.mainBtnText, { color: isPaused ? accent : BASE.onAccent }]}>{isPaused ? '▶' : '⏸'}</Text>
                        </View>
                    </TouchableOpacity>
                </Animatable.View>
                <TouchableOpacity style={styles.sideBtn} onPress={() => handlePress(onNext)}>
                    <Text style={styles.sideIcon}>⏭</Text>
                </TouchableOpacity>
                <View style={styles.sep} />
                <TouchableOpacity style={styles.stopBtn} onPress={() => handlePress(onStop)}>
                    <Text style={styles.stopIcon}>⏹</Text>
                </TouchableOpacity>
                <View style={[styles.statusDot, { backgroundColor: ledColor, ...(Platform.OS === 'web' ? { boxShadow: isAIMode ? `0 0 7px ${ledColor}` : 'none' } as any : {}) }]} />
                <Text style={[styles.statusLabel, { color: ledColor }]}>{statusText}</Text>
                {onToggleRemoteMirror && (
                    <TouchableOpacity style={styles.sideBtn} onPress={() => handlePress(onToggleRemoteMirror)}>
                        <Text style={[styles.sideIcon, { color: isRemoteMirrorEnabled ? accent : BASE.textFaint }]}>REMOTE</Text>
                    </TouchableOpacity>
                )}
                <View style={styles.sep} />
                <TouchableOpacity style={styles.collapseBtn} onPress={() => setCollapsed(true)}>
                    <Text style={styles.collapseIcon}>▼</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});
