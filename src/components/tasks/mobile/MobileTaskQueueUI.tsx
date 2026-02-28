// Feature: Tasks | Why: Top-level mobile task UI — wraps all 3 layouts + switcher
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TaskItem } from '../../../features/tasks/types';
import { AppTheme } from '../../../../App';
import { uiColors } from '../../../features/ui/theme/ui.theme';
import { MobileCommandLayout } from './MobileCommandLayout';
import { MobileStreamLayout } from './MobileStreamLayout';
import { MobileFocusLayout } from './MobileFocusLayout';
import { MobileLayoutSwitcher, MobileLayoutVariant } from './MobileLayoutSwitcher';
import { BASE } from '../../../features/ui/theme/ui.primitives';

interface Props {
    tasks: TaskItem[];
    theme: AppTheme;
    addTask: (t: string) => void;
    removeTask: (id: string) => void;
    clearTasks: () => void;
    editTask: (id: string, t: string) => void;
    /** If true, render the layout switcher at the top */
    showSwitcher?: boolean;
}

/**
 * Drop-in replacement for TaskQueueUI on mobile.
 * Renders one of 3 mobile-optimised layouts with an optional switcher strip.
 */
export const MobileTaskQueueUI: React.FC<Props> = ({
    tasks, theme, addTask, removeTask, clearTasks, editTask, showSwitcher = true,
}) => {
    const [variant, setVariant] = useState<MobileLayoutVariant>('command');
    const colors = uiColors(theme);
    const accent = colors.accent;

    const layoutProps = { tasks, theme, addTask, removeTask, clearTasks, editTask };

    return (
        <View style={s.root}>
            {showSwitcher && (
                <View style={s.switcherWrap}>
                    <MobileLayoutSwitcher active={variant} onSelect={setVariant} accentColor={accent} tasks={tasks} />
                </View>
            )}

            <View style={s.layoutWrap}>
                {variant === 'command' && <MobileCommandLayout {...layoutProps} />}
                {variant === 'stream' && <MobileStreamLayout {...layoutProps} />}
                {variant === 'focus' && <MobileFocusLayout {...layoutProps} />}
            </View>
        </View>
    );
};

const s = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: BASE.bgDeep,
    },
    switcherWrap: {
        backgroundColor: BASE.panelGlass,
        borderBottomWidth: 1,
        borderBottomColor: BASE.borderSubtle,
    },
    layoutWrap: {
        flex: 1,
    },
});
