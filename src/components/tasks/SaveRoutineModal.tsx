// Feature: Routines | Why: Name, optionally AI-generalize, and persist a completed mission as a reusable routine
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { auth } from '../../features/auth/firebase-config';
import { syncRoutineToFirestore } from '../../utils/browser-sync-service';
import { TaskItem } from '../../features/tasks/types';

interface Props {
    visible: boolean;
    goal: string;
    tasks: TaskItem[];
    proxyBaseUrl: string;
    accentColor: string;
    onClose: () => void;
}

/** Calls /agent/plan with a generalization prompt and extracts segment names as abstract steps */
async function generalizeSteps(goal: string, rawSteps: string[], proxyBaseUrl: string): Promise<string[]> {
    if (!proxyBaseUrl || !auth.currentUser) return rawSteps;
    const prompt = [
        'Convert these specific mission steps into a GENERIC, reusable routine.',
        `GOAL: ${goal}`,
        `STEPS: ${rawSteps.join(' → ')}`,
        'Output abstract step names that work across different runs (e.g. "Navigate to target site" not "Go to swagbucks.com").',
    ].join('\n');
    const token = await auth.currentUser.getIdToken();
    const res = await fetch(`${proxyBaseUrl}/agent/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt, tabId: 'default' }),
    });
    if (!res.ok) {
        console.warn(`[Planner] source=fallback mode=routine-generalize reason=http_${res.status}`);
        return rawSteps;
    }
    const d = await res.json();
    console.info('[Planner] source=remote mode=routine-generalize status=ok');
    const segs: any[] = d.missionResponse?.execution?.segments || [];
    const names = segs.map(s => s.name || s.steps?.[0]?.explanation).filter(Boolean);
    return names.length ? names : rawSteps;
}

export const SaveRoutineModal: React.FC<Props> = ({ visible, goal, tasks, proxyBaseUrl, accentColor, onClose }) => {
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);

    const rawSteps = tasks.filter(t => !t.isMission).map(t => t.title);

    const save = async (generalize: boolean) => {
        if (!name.trim() || !auth.currentUser) return;
        setSaving(true);
        try {
            const steps = generalize ? await generalizeSteps(goal, rawSteps, proxyBaseUrl).catch(() => rawSteps) : rawSteps;
            await syncRoutineToFirestore({
                id: Math.random().toString(36).slice(2, 11),
                userId: auth.currentUser.uid,
                name: name.trim(),
                description: generalize ? `Generalized routine for: ${goal.slice(0, 80)}` : `Routine for: ${goal.slice(0, 80)}`,
                initialUrl: '',
                steps,
                createdAt: Date.now(),
            });
            setName('');
            onClose();
        } finally { setSaving(false); }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={s.overlay}>
                <View style={[s.modal, { borderColor: accentColor + '55' }]}>
                    <Text style={s.title}>Save as Routine</Text>
                    <Text style={s.sub}>{rawSteps.length} tasks · {goal.slice(0, 65)}</Text>
                    <TextInput
                        style={[s.input, { borderColor: accentColor + '66' }]}
                        placeholder="Routine name…"
                        placeholderTextColor="#555"
                        value={name}
                        onChangeText={setName}
                    />
                    <TouchableOpacity
                        style={[s.btn, { backgroundColor: accentColor }]}
                        onPress={() => save(true)}
                        disabled={!name.trim() || saving}
                    >
                        {saving ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={s.btnText}>✨ Save &amp; Generalize (AI)</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[s.btn, { backgroundColor: 'rgba(255,255,255,0.09)', marginTop: 8 }]}
                        onPress={() => save(false)}
                        disabled={!name.trim() || saving}
                    >
                        <Text style={[s.btnText, { color: 'rgba(255,255,255,0.7)' }]}>Save As-Is</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose} style={s.cancel}>
                        <Text style={s.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
    modal: { backgroundColor: '#111', borderRadius: 16, padding: 24, width: 340, borderWidth: 1 },
    title: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 4 },
    sub: { color: '#555', fontSize: 11, marginBottom: 16 },
    input: { backgroundColor: '#1a1a1a', color: '#fff', borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 13, marginBottom: 14 },
    btn: { padding: 13, borderRadius: 8, alignItems: 'center' },
    btnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    cancel: { padding: 10, alignItems: 'center', marginTop: 4 },
    cancelText: { color: '#555', fontSize: 11 },
});
