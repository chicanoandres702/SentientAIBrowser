// Feature: UI | Why: Native-only edge strip vignette for HazeOverlay on mobile
import React from 'react';
import { View } from 'react-native';
import { edgeStripStyles as styles } from './EdgeStrip.styles';

const HAZE_DEPTH = 60;
const BANDS = 5;

/** Returns absolute positioning for a given edge */
const stripPosition = (side: string, isHoriz: boolean) => {
    const base = { position: 'absolute' as const };
    if (isHoriz) {
        return {
            ...base, left: 0, right: 0,
            ...(side === 'top' ? { top: 0 } : { bottom: 0 }),
            height: HAZE_DEPTH,
        };
    }
    return {
        ...base, top: 0, bottom: 0,
        ...(side === 'left' ? { left: 0 } : { right: 0 }),
        width: HAZE_DEPTH,
        flexDirection: 'row' as const,
    };
};

interface Props {
    color: string;
    side: 'top' | 'bottom' | 'left' | 'right';
}

/** Renders a single edge's layered opacity bands for native vignette */
export const EdgeStrip: React.FC<Props> = ({ color, side }) => {
    const isHoriz = side === 'top' || side === 'bottom';

    return (
        <View style={[styles.strip, stripPosition(side, isHoriz)]}>
            {Array.from({ length: BANDS }).map((_, i) => {
                const opacity = 0.10 * (1 - i / BANDS);
                const size = `${(100 / BANDS)}%`;
                return (
                    <View
                        key={i}
                        style={{
                            backgroundColor: `rgba(${color},${opacity})`,
                            ...(isHoriz
                                ? { width: '100%', height: size }
                                : { height: '100%', width: size }),
                        }}
                    />
                );
            })}
        </View>
    );
};
