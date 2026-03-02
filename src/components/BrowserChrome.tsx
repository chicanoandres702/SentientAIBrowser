// Feature: UI | Trace: README.md
import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, Animated } from 'react-native';
import { AppTheme } from '../../App';
import { uiColors } from '../features/ui/theme/ui.theme';

import { styles } from './BrowserChrome.styles';

interface Props {
    url: string;
    onNavigate: (url: string) => void;
    onBack?: () => void;
    onForward?: () => void;
    onReload?: () => void;
    theme: AppTheme;
}

export const BrowserChrome: React.FC<Props> = React.memo(({ url, onNavigate, onBack, onForward, onReload, theme }) => {
    const [inputUrl, setInputUrl] = useState(url);
    const [isFocused, setIsFocused] = useState(false);
    const focusAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => { setInputUrl(url); }, [url]);

    useEffect(() => {
        Animated.spring(focusAnim, { toValue: isFocused ? 1 : 0, useNativeDriver: false, tension: 80, friction: 10 }).start();
    }, [isFocused]);

    const handleGo = () => {
        let finalUrl = inputUrl.trim();
        if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            finalUrl = 'https://' + finalUrl;
        }
        if (finalUrl !== url && finalUrl !== '') onNavigate(finalUrl);
    };

    const colors = uiColors(theme);
    const accent = colors.accent;
    const borderColor = focusAnim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(185, 205, 230, 0.12)', accent] });

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={onBack} style={styles.navBtn}>
                <Text style={styles.navIcon}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onForward} style={styles.navBtn}>
                <Text style={styles.navIcon}>›</Text>
            </TouchableOpacity>

            <Animated.View style={[styles.addressBar, { borderColor }]}>
                <Text style={styles.lockIcon}>🔒</Text>
                <TextInput
                    style={styles.urlInput}
                    value={inputUrl}
                    onChangeText={setInputUrl}
                    onSubmitEditing={handleGo}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Search or enter website..."
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectTextOnFocus
                />
                <TouchableOpacity onPress={onReload} style={styles.reloadBtn}>
                    <Text style={[styles.reloadIcon, { color: isFocused ? accent : colors.textMuted }]}>↻</Text>
                </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity onPress={handleGo} style={[styles.goBtn, { backgroundColor: accent }]}>
                <Text style={styles.goText}>GO</Text>
            </TouchableOpacity>
        </View>
    );
});
