// Feature: Settings | Trace: README.md
import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView, Platform, TextInput } from 'react-native';
import { AppTheme } from '../../App';
import { ConfigRow } from './settings/ConfigRow';
import { ThemeSelector } from './settings/ThemeSelector';
import { LayoutSelector } from './settings/LayoutSelector';
import { LayoutMode } from '../hooks/useBrowserState';
import { uiColors } from '../features/ui/theme/ui.theme';

interface Props {
    visible: boolean; onClose: () => void; theme: AppTheme; setTheme: (theme: AppTheme) => void;
    isAIMode: boolean; setIsAIMode: (val: boolean) => void;
    useProxy: boolean; setUseProxy: (val: boolean) => void;
    isScholarMode: boolean; setIsScholarMode: (val: boolean) => void;
    isDaemonRunning: boolean; onToggleDaemon: () => void;
    layoutMode: LayoutMode; setLayoutMode: (mode: LayoutMode) => void;
    runtimeGeminiApiKey: string; setRuntimeGeminiApiKey: (key: string) => void;
}

export const SettingsMenu: React.FC<Props> = (p) => {
    const colors = uiColors(p.theme);
    const accent = colors.accent;
    const scholarAccent = '#bf5af2';
    return (
        <Modal visible={p.visible} transparent animationType="slide">
            <View style={[s.overlay]}>
                <View style={[s.sheet, { borderColor: colors.border, backgroundColor: colors.panel2 }]}>
                    <View style={[s.handleBar, { backgroundColor: accent }]} />
                    <View style={[s.header, { borderBottomColor: colors.border }]}> 
                        <View>
                            <Text style={[s.title, { color: colors.text }]}>Configuration</Text>
                            <Text style={[s.subtitle, { color: colors.textMuted }]}>Engine behavior, appearance & workspace layout</Text>
                        </View>
                        <TouchableOpacity style={[s.closeBtn, { borderColor: colors.border, backgroundColor: colors.bgElevated }]} onPress={p.onClose}>
                            <Text style={[s.closeIcon, { color: colors.textDim }]}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
                        <Text style={[s.section, { color: colors.textMuted }]}>CORE ENGINE</Text>
                        <View style={[s.sectionCard, { borderColor: colors.border, backgroundColor: colors.bgElevated }]}>
                            <ConfigRow label="Sentient AI Mode" sub="Enable autonomous navigation" value={p.isAIMode} onToggle={p.setIsAIMode} accent={accent} />
                            <ConfigRow label="CORS Proxy" sub="Bypass security restrictions" value={p.useProxy} onToggle={p.setUseProxy} accent={accent} />
                            <ConfigRow label="Scholar Mode" sub="MISSION: SCHOLAR (Capella.edu)" value={p.isScholarMode} onToggle={p.setIsScholarMode} accent={scholarAccent} />
                        </View>

                        <Text style={[s.section, { color: colors.textMuted }]}>APPEARANCE</Text>
                        <View style={[s.sectionCard, { borderColor: colors.border, backgroundColor: colors.bgElevated }]}>
                            <ThemeSelector current={p.theme} onSelect={p.setTheme} />
                        </View>

                        <Text style={[s.section, { color: colors.textMuted }]}>WORKSPACE LAYOUT</Text>
                        <View style={[s.sectionCard, { borderColor: colors.border, backgroundColor: colors.bgElevated }]}>
                            <Text style={[s.layoutHint, { color: colors.textMuted }]}>Choose a layout optimized for your workflow. All layouts adapt to both desktop and mobile.</Text>
                            <LayoutSelector current={p.layoutMode} onSelect={p.setLayoutMode} accent={accent} />
                        </View>

                        <Text style={[s.section, { color: colors.textMuted }]}>DAEMON</Text>
                        <TouchableOpacity style={[s.daemonBtn, { borderColor: p.isDaemonRunning ? colors.danger + '44' : accent + '33', backgroundColor: p.isDaemonRunning ? colors.dangerSoft : `${accent}0a` }]} onPress={p.onToggleDaemon}>
                            <View style={[s.daemonDot, { backgroundColor: p.isDaemonRunning ? colors.danger : accent }]} />
                            <Text style={[s.daemonText, { color: p.isDaemonRunning ? colors.danger : accent }]}>{p.isDaemonRunning ? 'TERMINATE DAEMON' : 'LAUNCH DAEMON'}</Text>
                        </TouchableOpacity>

                        <Text style={[s.section, { color: colors.textMuted }]}>LLM OVERRIDE</Text>
                        <View style={[s.sectionCard, { borderColor: colors.border, backgroundColor: colors.bgElevated }]}>
                            <Text style={[s.layoutHint, { color: colors.textMuted }]}>Optional runtime Gemini API key override (stored locally in this browser).</Text>
                            <TextInput
                                value={p.runtimeGeminiApiKey}
                                onChangeText={p.setRuntimeGeminiApiKey}
                                placeholder="AIza..."
                                placeholderTextColor={colors.textDim}
                                autoCapitalize="none"
                                autoCorrect={false}
                                style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.panel2 }]}
                            />
                        </View>
                    </ScrollView>
                    <View style={[s.footer, { borderTopColor: colors.border }]}>
                        <Text style={[s.version, { color: colors.textMuted }]}>SENTIENT BROWSER · v2.0.0</Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const s = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(3, 5, 10, 0.82)',
    },
    sheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        maxHeight: '92%',
        ...Platform.select({
            web: { boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.4)' } as any,
            default: { elevation: 20 },
        }),
    },
    handleBar: { width: 36, height: 3, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4, opacity: 0.5 },
    header: { paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
    title: { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
    subtitle: { marginTop: 2, fontSize: 11, fontWeight: '500' },
    closeBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    closeIcon: { fontSize: 14, lineHeight: 18 },
    body: { padding: 16 },
    section: { fontSize: 9, fontWeight: '800', letterSpacing: 2, marginBottom: 10, marginTop: 10, marginLeft: 2 },
    sectionCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
    layoutHint: { fontSize: 11, marginBottom: 10, lineHeight: 16 },
    daemonBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 14, gap: 10, marginBottom: 8 },
    daemonDot: { width: 7, height: 7, borderRadius: 3.5 },
    daemonText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
    input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, fontSize: 12 },
    footer: { padding: 12, borderTopWidth: 1, alignItems: 'center' },
    version: { fontSize: 8, letterSpacing: 2, fontWeight: '700' },
});
