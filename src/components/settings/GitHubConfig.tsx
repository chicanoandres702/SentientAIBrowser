// Feature: Settings | Trace: README.md
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface Props {
    token: string;
    setToken: (v: string) => void;
    owner: string;
    setOwner: (v: string) => void;
    repo: string;
    setRepo: (v: string) => void;
}

export const GitHubConfig = ({ token, setToken, owner, setOwner, repo, setRepo }: Props) => (
    <View style={styles.section}>
        <Text style={styles.label}>GITHUB ORCHESTRATION</Text>
        <TextInput
            style={styles.input}
            placeholder="PERSONAL ACCESS TOKEN"
            placeholderTextColor="#333"
            secureTextEntry
            value={token}
            onChangeText={setToken}
        />
        <View style={styles.row}>
            <TextInput
                style={[styles.input, { flex: 1.2 }]}
                placeholder="OWNER"
                placeholderTextColor="#333"
                value={owner}
                onChangeText={setOwner}
            />
            <TextInput
                style={[styles.input, { flex: 2 }]}
                placeholder="REPOSITORY NAME"
                placeholderTextColor="#333"
                value={repo}
                onChangeText={setRepo}
            />
        </View>
    </View>
);

const styles = StyleSheet.create({
    section: { marginBottom: 24 },
    label: { color: '#2a2a2a', fontSize: 10, fontWeight: '900', letterSpacing: 3, marginBottom: 16 },
    input: { backgroundColor: '#0d0d0d', borderRadius: 12, height: 44, paddingHorizontal: 16, color: '#fff', fontSize: 11, fontWeight: '700', marginBottom: 12, borderWidth: 1, borderColor: '#1a1a1a' },
    row: { flexDirection: 'row', gap: 12 }
});
