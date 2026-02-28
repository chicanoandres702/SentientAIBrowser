// Feature: Tasks | Why: Shared status icon/label/color config — reused by Focus, Card, and other layouts
import { TaskStatus } from '../../../features/tasks/types';
import { BASE } from '../../../features/ui/theme/ui.primitives';

/** Canonical status display config — icon + label + color for each task status */
export const STATUS_CFG: Record<TaskStatus, { icon: string; label: string; color: string }> = {
    pending:         { icon: '○', label: 'QUEUED',  color: BASE.textMuted },
    in_progress:     { icon: '⚡', label: 'ACTIVE',  color: '#00d2ff' },
    completed:       { icon: '✓', label: 'DONE',    color: BASE.success },
    failed:          { icon: '✕', label: 'FAILED',  color: BASE.danger },
    blocked_on_user: { icon: '⚠', label: 'BLOCKED', color: BASE.warning },
};

/** Abbreviated status dot config for tree views and compact displays */
export const STATUS_DOT: Record<TaskStatus, { color: string; icon: string }> = {
    pending:         { color: BASE.textFaint,  icon: '○' },
    in_progress:     { color: '#00d2ff',       icon: '⚡' },
    completed:       { color: BASE.success,    icon: '✓' },
    failed:          { color: BASE.danger,     icon: '✕' },
    blocked_on_user: { color: BASE.warning,    icon: '⚠' },
};
