// Feature: Tasks | Trace: src/features/tasks/trace.md
import React from 'react';
import { Text } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { TaskStatus } from '../../types';

export const StatusIcon = ({ status, color }: { status: TaskStatus; color: string }) => {
    switch (status) {
        case 'completed': return <Text style={{ color: '#00ffaa' }}>✓</Text>;
        case 'failed': return <Text style={{ color: '#ff4444' }}>✕</Text>;
        case 'blocked_on_user': return <Text style={{ color: '#ffcc00' }}>⚠</Text>;
        case 'in_progress':
            return (
                <Animatable.View animation="rotate" iterationCount="infinite" duration={2000}>
                    <Text style={{ color: color }}>⚙</Text>
                </Animatable.View>
            );
        default: return <Text style={{ color: '#888' }}>○</Text>;
    }
};
