// Feature: Workflow | Trace: src/features/workflow/workflow.bar.component.tsx
/*
 * [Parent Feature/Milestone] Workflow
 * [Child Task/Issue] WorkflowBar — horizontal workflow pill strip above tab bar
 * [Subtask] Select/add/remove workflows; each workflow groups multiple browser tabs
 * [Upstream] useWorkflows -> [Downstream] MainLayout
 * [Law Check] 80 lines | Passed 100-Line Law
 */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import type { AppTheme } from '../../../App';
import { uiColors } from '@features/ui/theme/ui.theme';
import type { Workflow } from './workflow.types';
import { wbs } from './workflow.bar.styles';

interface Props {
  workflows: Workflow[];
  onSelectWorkflow: (id: string) => void;
  onAddWorkflow: () => void;
  onRemoveWorkflow: (id: string) => void;
  onRenameWorkflow: (id: string, name: string) => void;
  theme: AppTheme;
}

export const WorkflowBar: React.FC<Props> = React.memo(({ workflows, onSelectWorkflow, onAddWorkflow, onRemoveWorkflow, onRenameWorkflow, theme }) => {
  const colors = uiColors(theme);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const startRename = (wf: Workflow) => { setEditingId(wf.id); setEditName(wf.name); };
  const commitRename = () => { if (editingId) onRenameWorkflow(editingId, editName); setEditingId(null); };
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
            {editingId === wf.id ? (
              <TextInput
                style={[wbs.pillText, { color: colors.accent, minWidth: 64 }]}
                value={editName}
                onChangeText={setEditName}
                onBlur={commitRename}
                onSubmitEditing={commitRename}
                autoFocus
                selectTextOnFocus
              />
            ) : (
              <Text
                style={[wbs.pillText, { color: wf.isActive ? colors.accent : colors.textDim }]}
                onLongPress={() => startRename(wf)}
              >
                {wf.name}
              </Text>
            )}
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
