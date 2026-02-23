import React from 'react';
import { StyleSheet, Text, View, Switch, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { AppTheme } from '../../App';

interface Props {
    visible: boolean;
    onClose: () => void;
    theme: AppTheme;
    setTheme: (theme: AppTheme) => void;
    isAIMode: boolean;
    setIsAIMode: (val: boolean) => void;
    useProxy: boolean;
    setUseProxy: (val: boolean) => void;
    isDaemonRunning: boolean;
    onToggleDaemon: () => void;
}

export const SettingsMenu: React.FC<Props> = (p) => {
    const accentColor = p.theme === 'red' ? '#ff003c' : '#00d2ff';

    return (
        <Modal visible={p.visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.panel}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Browser Settings</Text>
                        <TouchableOpacity onPress={p.onClose}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content}>
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Core Engine</Text>
                            <View style={styles.row}>
                                <Text style={styles.label}>🤖 Sentient AI Mode</Text>
                                <Switch value={p.isAIMode} onValueChange={p.setIsAIMode} trackColor={{ true: accentColor }} />
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>🌐 Enhanced CORS Proxy</Text>
                                <Switch value={p.useProxy} onValueChange={p.setUseProxy} trackColor={{ true: accentColor }} />
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Appearance</Text>
                            <View style={styles.themeRow}>
                                <TouchableOpacity
                                    style={[styles.themeBtn, p.theme === 'red' && { borderColor: '#ff003c', borderWidth: 2 }]}
                                    onPress={() => p.setTheme('red')}
                                >
                                    <View style={[styles.themeDot, { backgroundColor: '#ff003c' }]} />
                                    <Text style={styles.themeText}>Red Pulse</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.themeBtn, p.theme === 'blue' && { borderColor: '#00d2ff', borderWidth: 2 }]}
                                    onPress={() => p.setTheme('blue')}
                                >
                                    <View style={[styles.themeDot, { backgroundColor: '#00d2ff' }]} />
                                    <Text style={styles.themeText}>Deep Blue</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Automation</Text>
                            <TouchableOpacity
                                style={[styles.daemonBtn, { backgroundColor: p.isDaemonRunning ? '#444' : accentColor }]}
                                onPress={p.onToggleDaemon}
                            >
                                <Text style={styles.daemonText}>
                                    {p.isDaemonRunning ? '🛑 Stop Background Daemon' : '🚀 Start Background Daemon'}
                                </Text>
                            </TouchableOpacity>
                            <Text style={styles.hint}>Daemon allows survey hunting while screen is off.</Text>
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <Text style={styles.version}>Sentient Browser v1.2.0-Alpha</Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    panel: { width: '90%', maxWidth: 400, backgroundColor: '#111', borderRadius: 20, borderWidth: 1, borderColor: '#333', overflow: 'hidden' },
    header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#222' },
    title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    closeBtn: { color: '#666', fontSize: 20 },
    content: { padding: 20 },
    section: { marginBottom: 25 },
    sectionLabel: { color: '#444', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 15, letterSpacing: 1 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    label: { color: '#ccc', fontSize: 15 },
    themeRow: { flexDirection: 'row', justifyContent: 'space-between' },
    themeBtn: { flex: 1, backgroundColor: '#1a1a1a', padding: 12, borderRadius: 12, marginRight: 8, alignItems: 'center', flexDirection: 'row' },
    themeDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
    themeText: { color: '#fff', fontSize: 13 },
    daemonBtn: { padding: 15, borderRadius: 12, alignItems: 'center' },
    daemonText: { color: '#111', fontWeight: 'bold' },
    hint: { color: '#555', fontSize: 11, marginTop: 8, textAlign: 'center' },
    footer: { padding: 15, backgroundColor: '#0a0a0a', alignItems: 'center' },
    version: { color: '#333', fontSize: 10 }
});
