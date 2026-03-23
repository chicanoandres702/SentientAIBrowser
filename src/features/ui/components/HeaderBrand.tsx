// Feature: UI | Trace: ui.header.component.tsx
import React from 'react';
import { View, Text } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { styles } from './ui.header.styles';

interface Props {
  accent: string;
  domain?: string;
  isAIMode: boolean;
  isPaused: boolean;
}

export const HeaderBrand: React.FC<Props> = ({ accent, domain, isAIMode, isPaused }) => (
  <View style={styles.brand}>
    <View style={styles.orbStack}>
      <Animatable.View
        animation={isAIMode && !isPaused ? 'pulse' : undefined}
        iterationCount="infinite" duration={2400}
        style={[styles.brandOrbOuter, { backgroundColor: accent + '28', shadowColor: accent }]}
      />
      <View style={[styles.brandOrbInner, { backgroundColor: accent, shadowColor: accent }]} />
    </View>
    <Text style={[styles.brandText, { textShadowColor: accent }]}>
      {domain === 'capella.edu' ? 'SCHOLAR' : 'SENTIENT'}
    </Text>
  </View>
);
