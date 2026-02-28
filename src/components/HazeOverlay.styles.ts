// Feature: UI | Why: HazeOverlay styles extracted for 100-line law compliance
import { StyleSheet } from 'react-native';

export const hazeStyles = StyleSheet.create({
    fill: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 99,
        pointerEvents: 'none',
    },
});
