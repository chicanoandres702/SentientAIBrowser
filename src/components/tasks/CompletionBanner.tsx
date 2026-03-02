// Feature: Tasks UI | Trace: README.md
import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import * as Animatable from 'react-native-animatable';

interface Props {
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
    onDismiss?: () => void;
    accentColor?: string;
}

export const CompletionBanner: React.FC<Props> = ({ 
    visible, 
    message, 
    type, 
    duration = 3000, 
    onDismiss,
    accentColor = '#00ffaa'
}) => {
    const [isVisible, setIsVisible] = useState(visible);

    useEffect(() => {
        setIsVisible(visible);
        if (visible && duration > 0) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                onDismiss?.();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [visible, duration, onDismiss]);

    if (!isVisible) return null;

    const getColors = () => {
        switch (type) {
            case 'success':
                return { bg: 'rgba(0, 255, 170, 0.15)', border: accentColor, icon: '✓', text: accentColor };
            case 'error':
                return { bg: 'rgba(255, 68, 68, 0.15)', border: '#ff4444', icon: '✕', text: '#ff4444' };
            case 'info':
            default:
                return { bg: 'rgba(0, 210, 255, 0.15)', border: '#00d2ff', icon: 'ℹ', text: '#00d2ff' };
        }
    };

    const colors = getColors();

    return (
        <Animatable.View
            animation="slideInDown"
            duration={400}
            useNativeDriver={false}
            style={[
                styles.banner,
                {
                    backgroundColor: colors.bg,
                    borderBottomColor: colors.border,
                },
            ]}
        >
            <Text style={[styles.icon, { color: colors.text }]}>{colors.icon}</Text>
            <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
        </Animatable.View>
    );
};

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 2,
        marginBottom: 12,
        borderRadius: 8,
        ...Platform.select({
            web: {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            } as any,
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3,
            },
        }),
    },
    icon: {
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 12,
    },
    message: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
});
