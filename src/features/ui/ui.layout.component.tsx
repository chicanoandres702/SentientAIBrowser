// Feature: UI | Trace: README.md
/*
 * [Parent Feature/Milestone] UI
 * [Child Task/Issue] Layout primitive components
 * [Subtask] Reusable Card, Section, Stack components to reduce duplicate styling
 * [Upstream] Repeated StyleSheet definitions -> [Downstream] Single primitive API
 * [Law Check] 65 lines | Passed 100-Line Law
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const RADIUS = { sm: 4, md: 8, lg: 12 } as const;
export const SHADOWS = { light: '0 1px 3px rgba(0,0,0,0.1)', md: '0 4px 8px rgba(0,0,0,0.15)' } as const;

interface CardProps {
  children: React.ReactNode;
  padding?: keyof typeof SPACING;
  radius?: keyof typeof RADIUS;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ children, padding = 'md', radius = 'md', style }) => (
  <View style={[{ padding: SPACING[padding], borderRadius: RADIUS[radius], backgroundColor: '#fff', shadowOpacity: 0.1 }, style]}>
    {children}
  </View>
);

interface SectionProps {
  children: React.ReactNode;
  title?: string;
  padding?: keyof typeof SPACING;
  style?: ViewStyle;
}

export const Section: React.FC<SectionProps> = ({ children, title, padding = 'lg', style }) => (
  <View style={[{ paddingVertical: SPACING[padding] }, style]}>
    {title && <View style={{ marginBottom: SPACING.md, fontWeight: 'bold', fontSize: 16 }}>{title}</View>}
    {children}
  </View>
);

interface StackProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  gap?: keyof typeof SPACING;
  align?: 'flex-start' | 'center' | 'flex-end';
  justify?: 'flex-start' | 'center' | 'space-between' | 'space-around';
  style?: ViewStyle;
}

export const Stack: React.FC<StackProps> = ({
  children,
  direction = 'column',
  gap = 'md',
  align = 'flex-start',
  justify = 'flex-start',
  style,
}) => (
  <View style={[{ flexDirection: direction, gap: SPACING[gap], alignItems: align, justifyContent: justify }, style]}>
    {children}
  </View>
);

interface GridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: keyof typeof SPACING;
  style?: ViewStyle;
}

export const Grid: React.FC<GridProps> = ({ children, columns = 2, gap = 'md', style }) => (
  <View style={[{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[gap] }, style]}>{children}</View>
);
