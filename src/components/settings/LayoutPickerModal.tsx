// Feature: UI | Why: Mobile layout picker modal — extracted from LayoutSwitcher
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { LayoutMode } from '../../hooks/useBrowserState';
import { LAYOUTS } from './layout-options.data';
import { switcherStyles as s } from './LayoutSwitcher.styles';

interface Props {
  visible: boolean;
  current: LayoutMode;
  accent: string;
  onSelect: (mode: LayoutMode) => void;
  onClose: () => void;
}

export const LayoutPickerModal: React.FC<Props> = ({ visible, current, accent, onSelect, onClose }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={onClose}>
      <View style={s.mobileSheet}>
        <View style={s.mobileHandle} />
        <Text style={s.mobileTitle}>LAYOUT</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {LAYOUTS.map(l => {
            const active = l.mode === current;
            return (
              <TouchableOpacity
                key={l.mode}
                style={[s.mobileOption, active && { backgroundColor: `${accent}18`, borderColor: `${accent}44` }]}
                onPress={() => { onSelect(l.mode); onClose(); }}
              >
                <View style={s.mobileOptionLeft}>
                  <Text style={[s.mobileIcon, active && { color: accent }]}>{l.icon}</Text>
                  <View>
                    <Text style={[s.mobileLabel, active && { color: accent }]}>{l.label}</Text>
                    <Text style={s.mobileSub}>{l.mobileDesc}</Text>
                  </View>
                </View>
                {active && <View style={[s.activeDot, { backgroundColor: accent }]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </TouchableOpacity>
  </Modal>
);
