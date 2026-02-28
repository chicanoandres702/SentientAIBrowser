// Feature: UI | Why: Visual pseudo-cursor that shows AI clicking/typing in real-time
// Renders an animated pointer overlay synced with dom-action.executor
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { CursorState } from '../hooks/useCursorController';

interface Props {
    cursor: CursorState;
    accentColor: string;
}

/** Animated virtual cursor — pointer + ripple + type caret overlay */
export const VirtualCursor: React.FC<Props> = React.memo(({ cursor, accentColor }) => {
    const posX = useRef(new Animated.Value(cursor.x)).current;
    const posY = useRef(new Animated.Value(cursor.y)).current;
    const rippleScale = useRef(new Animated.Value(0)).current;
    const rippleOpacity = useRef(new Animated.Value(0)).current;
    const caretOpacity = useRef(new Animated.Value(0)).current;
    const pointerScale = useRef(new Animated.Value(1)).current;

    // Animate movement when position changes
    useEffect(() => {
        Animated.parallel([
            Animated.spring(posX, { toValue: cursor.x, useNativeDriver: false, tension: 60, friction: 12 }),
            Animated.spring(posY, { toValue: cursor.y, useNativeDriver: false, tension: 60, friction: 12 }),
        ]).start();
    }, [cursor.x, cursor.y]);

    // Click ripple animation
    useEffect(() => {
        if (cursor.effect !== 'click') return;
        rippleScale.setValue(0);
        rippleOpacity.setValue(0.7);
        pointerScale.setValue(0.7);
        Animated.parallel([
            Animated.spring(pointerScale, { toValue: 1, useNativeDriver: false, tension: 200, friction: 10 }),
            Animated.timing(rippleScale, { toValue: 1, duration: 400, useNativeDriver: false }),
            Animated.timing(rippleOpacity, { toValue: 0, duration: 400, useNativeDriver: false }),
        ]).start();
    }, [cursor.effectKey]);

    // Type caret blink
    useEffect(() => {
        if (cursor.effect !== 'type') { caretOpacity.setValue(0); return; }
        const blink = Animated.loop(
            Animated.sequence([
                Animated.timing(caretOpacity, { toValue: 1, duration: 300, useNativeDriver: false }),
                Animated.timing(caretOpacity, { toValue: 0, duration: 300, useNativeDriver: false }),
            ]),
        );
        blink.start();
        return () => blink.stop();
    }, [cursor.effect, cursor.effectKey]);

    if (!cursor.visible) return null;

    return (
        <Animated.View
            style={[s.root, { transform: [{ translateX: posX }, { translateY: posY }] }]}
            pointerEvents="none"
        >
            {/* Click ripple ring */}
            <Animated.View style={[
                s.ripple,
                { borderColor: accentColor, opacity: rippleOpacity, transform: [{ scale: Animated.multiply(rippleScale, 40) }] },
            ]} />

            {/* Pointer arrow */}
            <Animated.View style={[s.pointer, { borderLeftColor: accentColor, transform: [{ scale: pointerScale }] }]}>
                <View style={[s.pointerInner, { backgroundColor: accentColor }]} />
            </Animated.View>

            {/* Type caret indicator */}
            <Animated.View style={[s.caret, { backgroundColor: accentColor, opacity: caretOpacity }]} />

            {/* Glow aura */}
            <View style={[s.glow, { backgroundColor: accentColor }]} />
        </Animated.View>
    );
});

const s = StyleSheet.create({
    root: { position: 'absolute', top: 0, left: 0, zIndex: 1000, width: 0, height: 0 },
    pointer: {
        width: 0, height: 0,
        borderLeftWidth: 14, borderLeftColor: '#ff3366',
        borderTopWidth: 5, borderTopColor: 'transparent',
        borderBottomWidth: 10, borderBottomColor: 'transparent',
        transform: [{ rotate: '-30deg' }, { translateX: -2 }, { translateY: -2 }],
    },
    pointerInner: {
        position: 'absolute', top: -3, left: -12, width: 10, height: 14,
        borderRadius: 2, opacity: 0.3,
    },
    ripple: {
        position: 'absolute', top: -1, left: -1, width: 2, height: 2,
        borderRadius: 20, borderWidth: 2,
    },
    caret: {
        position: 'absolute', top: 4, left: 16, width: 2, height: 16,
        borderRadius: 1,
    },
    glow: {
        position: 'absolute', top: -4, left: -4, width: 8, height: 8,
        borderRadius: 4, opacity: 0.2,
    },
});
