// Feature: Workflow | Trace: src/features/workflow/workflow.bar.component.tsx
/*
 * [Parent Feature/Milestone] Workflow
 * [Child Task/Issue] WorkflowBar — horizontal workflow pill strip above tab bar
 * [Subtask] Select/add/remove workflows; each workflow groups multiple browser tabs
 * [Upstream] useWorkflows -> [Downstream] MainLayout
 * [Law Check] 62 lines | Passed 100-Line Law
 */
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import type { AppTheme } from '../../../App';
import { uiColors } from '@features/ui/theme/ui.theme';
import type { Workflow } from './workflow.types';
import { wbs } from './workflow.bar.styles';

interface Props {
  workflows: Workflow[];
  onSelectWorkflow: (id: string) => void;
  onAddWorkflow: () => void;
  onRemoveWorkflow: (id: string) => void;
  theme: AppTheme;
}

export const WorkflowBar: React.FC<Props> = React.memo(({ workflows, onSelectWorkflow, onAddWorkflow, onRemoveWorkflow, theme }) => {
  const colors = uiColors(theme);
  return (
    <View style={[wbs.bar, { borderBottomColor: colors.border, backgroundColor: colors.surface ?? colors.bg }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={wbs.scroll}
      >
        {workflows.map((wf) => (
          <TouchableOpacity
            key={wf.id}
            style={[
              wbs.pill,
              { borderColor: wf.isActive ? colors.accent + '70' : colors.border, backgroundColor: wf.isActive ? colors.accent + '15' : colors.inputBg ?? colors.bg },
            ]}
            onPress={() => onSelectWorkflow(wf.id)}
            activeOpacity={0.75}
          >
            <Text style={[wbs.pillText, { color: wf.isActive ? colors.accent : colors.textDim }]}>
              {wf.name}
            </Text>
            {wf.tabIds.length > 0 && (
              <Text style={[wbs.count, { color: colors.textMuted, backgroundColor: colors.accent + '20' }]}>
                {wf.tabIds.length}
              </Text>
            )}
            {workflows.length > 1 && (
              <TouchableOpacity style={[wbs.closeBtn, { backgroundColor: 'rgba(255,255,255,0.07)' }]} onPress={() => onRemoveWorkflow(wf.id)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Text style={[wbs.closeBtnText, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[wbs.addBtn, { borderColor: colors.border }]} onPress={onAddWorkflow}>
          <Text style={[wbs.addBtnText, { color: colors.accent }]}>+</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
});

WorkflowBar.displayName = 'WorkflowBar';
