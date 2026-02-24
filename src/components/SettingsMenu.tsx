// Feature: Settings | Trace: README.md
import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { AppTheme } from '../../App';
import { ConfigRow } from './settings/ConfigRow';
import { ThemeSelector } from './settings/ThemeSelector';
import { GitHubConfig } from './settings/GitHubConfig';

interface Props {
    visible: boolean; onClose: () => void; theme: AppTheme; setTheme: (theme: AppTheme) => void;
    isAIMode: boolean; setIsAIMode: (val: boolean) => void;
    useProxy: boolean; setUseProxy: (val: boolean) => void;
    isScholarMode: boolean; setIsScholarMode: (val: boolean) => void;
    isDaemonRunning: boolean; onToggleDaemon: () => void;
    github: { token: string; setToken: (v: string) => void; owner: string; setOwner: (v: string) => void; repo: string; setRepo: (v: string) => void; };
}

export const SettingsMenu: React.FC<Props> = (p) => {
    const accent = p.theme === 'red' ? '#ff003c' : '#00d2ff';
    const scholarAccent = '#bf5af2'; // Purple for Scholar Mode
    return (
        <Modal visible={p.visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={[styles.handleBar, { backgroundColor: accent }]} />
                    <View style={styles.header}>
                        <Text style={styles.title}>Configuration</Text>
                        <TouchableOpacity style={styles.closeBtn} onPress={p.onClose}><Text style={styles.closeIcon}>×</Text></TouchableOpacity>
                    </View>
                    <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                        <Text style={styles.section}>CORE ENGINE</Text>
                        <ConfigRow label="Sentient AI Mode" sub="Enable autonomous navigation" value={p.isAIMode} onToggle={p.setIsAIMode} accent={accent} />
                        <ConfigRow label="CORS Proxy" sub="Bypass security restrictions" value={p.useProxy} onToggle={p.setUseProxy} accent={accent} />
                        <ConfigRow label="Scholar Mode" sub="MISSION: SCHOLAR (Capella.edu)" value={p.isScholarMode} onToggle={p.setIsScholarMode} accent={scholarAccent} />

                        <GitHubConfig token={p.github.token} setToken={p.github.setToken} owner={p.github.owner} setOwner={p.github.setOwner} repo={p.github.repo} setRepo={p.github.setRepo} />

                        <Text style={styles.section}>APPEARANCE</Text>
                        <ThemeSelector current={p.theme} onSelect={p.setTheme} />

                        <Text style={styles.section}>DAEMON</Text>
                        <TouchableOpacity style={[styles.daemonBtn, { borderColor: p.isDaemonRunning ? '#f44336' : accent }]} onPress={p.onToggleDaemon}>
                            <View style={[styles.daemonDot, { backgroundColor: p.isDaemonRunning ? '#f44336' : accent }]} />
                            <Text style={[styles.daemonText, { color: p.isDaemonRunning ? '#f44336' : accent }]}>{p.isDaemonRunning ? 'TERMINATE DAEMON' : 'LAUNCH DAEMON'}</Text>
                        </TouchableOpacity>
                    </ScrollView>
                    <View style={styles.footer}><Text style={styles.version}>SENTIENT BROWSER · v1.2.0-ALPHA</Text></View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#060606', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: '#111', overflow: 'hidden', maxHeight: '90%' },
    handleBar: { width: 40, height: 3, borderRadius: 2, alignSelf: 'center', marginTop: 14, marginBottom: 4, opacity: 0.6 },
    header: { paddingHorizontal: 24, paddingVertical: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#0d0d0d' },
    title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
    closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
    closeIcon: { color: '#888', fontSize: 20, lineHeight: 22 },
    body: { padding: 24 },
    section: { color: '#2a2a2a', fontSize: 10, fontWeight: '900', letterSpacing: 3, marginBottom: 16, marginTop: 8 },
    daemonBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 16, gap: 12 },
    daemonDot: { width: 8, height: 8, borderRadius: 4 },
    daemonText: { fontSize: 12, fontWeight: '900', letterSpacing: 2 },
    footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#0d0d0d', alignItems: 'center' },
    version: { color: '#1a1a1a', fontSize: 9, letterSpacing: 3, fontWeight: '900' },
});
