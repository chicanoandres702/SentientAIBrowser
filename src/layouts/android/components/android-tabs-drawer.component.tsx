// Feature: Android Layout | Trace: src/layouts/android/components/
// Why: Slide-up tab grid — Material-style card per tab, screenshot thumbnail, close + new tab.
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, TouchableWithoutFeedback, FlatList, Image, StyleSheet } from 'react-native';
import type { AppTheme } from '../../../../App';
import { uiColors } from '../../../features/ui/theme/ui.theme';
import { BASE } from '../../../features/ui/theme/ui.primitives';
import { sheetBase } from '../android.styles';
import type { BrowserTab } from '../../../features/core/core.types';

interface Props {
  visible:     boolean;
  onClose:     () => void;
  theme:       AppTheme;
  tabs:        BrowserTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab:  (id: string) => void;
  onNewTab:    () => void;
}

const ITEM_W = 150;
const SHEET_H = 340;

export const AndroidTabsDrawer: React.FC<Props> = ({ visible, onClose, theme, tabs, activeTabId, onSelectTab, onCloseTab, onNewTab }) => {
  const colors  = uiColors(theme);
  const slideY  = useRef(new Animated.Value(SHEET_H)).current;
  const backdropA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY,    { toValue: visible ? 0 : SHEET_H, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(backdropA, { toValue: visible ? 1 : 0,       useNativeDriver: true, duration: 200 }),
    ]).start();
  }, [visible, slideY, backdropA]);

  const select = (id: string) => { onSelectTab(id); onClose(); };

  const renderTab = ({ item }: { item: BrowserTab }) => {
    const isActive = item.id === activeTabId;
    return (
      <TouchableOpacity onPress={() => select(item.id)} style={[s.card, isActive && { borderColor: colors.accent }]}>
        <TouchableOpacity onPress={() => onCloseTab(item.id)} hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }} style={s.closeBtn}>
          <Text style={{ color: colors.textMuted, fontSize: 12, lineHeight: 14 }}>✕</Text>
        </TouchableOpacity>
        {item.domMap?.screenshot
          ? <Image source={{ uri: item.domMap.screenshot as string }} style={s.thumb} resizeMode="cover" />
          : <View style={[s.thumb, s.thumbPlaceholder]}><Text style={[s.placeholderIcon, { color: colors.textFaint }]}>🌐</Text></View>
        }
        <Text style={[s.tabTitle, { color: isActive ? colors.accent : colors.text }]} numberOfLines={1}>{item.title || item.url}</Text>
        <Text style={[s.tabUrl, { color: colors.textMuted }]} numberOfLines={1}>{item.url}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[sheetBase.backdrop, { opacity: backdropA }]} />
      </TouchableWithoutFeedback>
      <Animated.View style={[sheetBase.sheet, s.sheet, { transform: [{ translateY: slideY }] }]}>
        <View style={sheetBase.handle} />
        <View style={s.header}>
          <Text style={[sheetBase.heading, { paddingTop: 2 }]}>Tabs  ({tabs.length})</Text>
          <TouchableOpacity onPress={() => { onNewTab(); onClose(); }} style={[s.newTabBtn, { borderColor: colors.accent }]}>
            <Text style={[s.newTabText, { color: colors.accent }]}>+ New Tab</Text>
          </TouchableOpacity>
        </View>
        <FlatList data={tabs} keyExtractor={t => t.id} renderItem={renderTab} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.list} />
        <View style={s.bottomSpacer} />
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  sheet:       { height: SHEET_H },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 },
  list:        { paddingHorizontal: 14, gap: 10 },
  card:        { width: ITEM_W, borderRadius: 10, borderWidth: 1.5, borderColor: BASE.borderMed, backgroundColor: BASE.bgSurface, overflow: 'hidden', marginVertical: 4 },
  thumb:       { width: '100%', height: 90, backgroundColor: BASE.bgElevated },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderIcon: { fontSize: 28 },
  tabTitle:    { fontSize: 11.5, fontWeight: '600', paddingHorizontal: 8, paddingTop: 5 },
  tabUrl:      { fontSize: 9.5, paddingHorizontal: 8, paddingBottom: 8 },
  closeBtn:    { position: 'absolute', top: 4, right: 4, zIndex: 2, backgroundColor: BASE.panel, borderRadius: 8, padding: 3 },
  newTabBtn:   { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, borderWidth: 1 },
  newTabText:  { fontSize: 12, fontWeight: '600' },
  bottomSpacer:{ height: 16 },
});
