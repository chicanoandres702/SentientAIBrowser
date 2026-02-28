// Feature: Tasks | Why: Mobile spacing/sizing constants — imported by all mobile task components
import { Dimensions } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

/** Frozen layout tokens for consistent mobile task UI */
export const MOBILE = Object.freeze({
    pad: 12,
    padSm: 8,
    padXs: 4,
    radius: 14,
    radiusSm: 10,
    radiusPill: 20,
    cardGap: 6,
    headerH: 52,
    tabBarH: 56,
    fabSize: 52,
    chipH: 26,
    screenW: SCREEN_W,
});
