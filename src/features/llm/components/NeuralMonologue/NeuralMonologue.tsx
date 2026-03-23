// Feature: LLM | Trace: README.md
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../../../features/auth/firebase-config';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { Scanline } from '@features/browser';
import { TypewriterText } from './TypewriterText';
import { styles } from './NeuralMonologue.styles';
import { MISSION_RESPONSE_SCHEMA } from '../../llm-decision.engine';

export const NeuralMonologue = () => {
    const [thoughts, setThoughts] = useState<any[]>([]);
    const [lastId, setLastId] = useState<string | null>(null);
    const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

    useEffect(() => {
        if (!auth.currentUser) return;
        const q = query(collection(db, 'thoughts'), where('user_id', '==', auth.currentUser.uid), orderBy('timestamp', 'desc'), limit(5));
        const unsubscribe = onSnapshot(q, (s) => {
            const list = s.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
            setThoughts(list);
            if (list.length > 0) setLastId(list[list.length - 1].id);
        });
        return () => unsubscribe();
    }, [auth.currentUser?.uid]);

    if (thoughts.length === 0) return null;

    return (
        <Animatable.View animation="fadeInUp" duration={800} style={styles.container}>
            <LinearGradient colors={['rgba(15,10,25,0.9)', 'rgba(5,5,8,0.98)']} style={styles.gradient}>
                <Scanline color="#a064ff" opacity={0.1} duration={6000} />
                <View style={styles.header}>
                    <Animatable.View animation="pulse" iterationCount="infinite" style={styles.pulse} />
                    <Text style={styles.headerText}>NEURAL STREAM</Text>
                </View>
                <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                    {thoughts.map((t) => (
                        <View key={t.id} style={styles.thoughtItem}>
                            <View style={styles.thoughtHeader}>
                                <Text style={styles.timestamp}>{t.timestamp?.seconds ? new Date(t.timestamp.seconds * 1000).toLocaleTimeString() : 'Recent'}</Text>
                                <View style={styles.metrics}>
                                    <TouchableOpacity onPress={() => setExpandedPlanId(expandedPlanId === t.id ? null : t.id)}>
                                        <Text style={[styles.ratingText, { color: '#a064ff', marginRight: 8 }]}>[DEBUG]</Text>
                                    </TouchableOpacity>
                                    {t.memoryUsed && <View style={styles.memoryBadge}><Text style={styles.memoryText}>MEMORY</Text></View>}
                                    <Text style={styles.ratingText}>IQ {t.intelligenceRating || 0}%</Text>
                                </View>
                            </View>
                            {t.id === lastId && !expandedPlanId ? <TypewriterText text={t.reasoning} /> : <Text style={styles.reasoning}>{t.reasoning}</Text>}
                            
                            {expandedPlanId === t.id && (
                                <View style={{ marginTop: 8, backgroundColor: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 4 }}>
                                    <Text style={{ color: '#00ffcc', fontSize: 9, fontWeight: 'bold' }}>SCHEMA:</Text>
                                    <Text style={{ color: 'rgba(0,255,204,0.6)', fontSize: 8, fontFamily: 'monospace' }}>
                                        {JSON.stringify(MISSION_RESPONSE_SCHEMA, null, 2)}
                                    </Text>
                                    <Text style={{ color: '#ffcc00', fontSize: 9, fontWeight: 'bold', marginTop: 8 }}>JSON PLAN:</Text>
                                    <Text style={{ color: 'rgba(255,204,0,0.6)', fontSize: 8, fontFamily: 'monospace' }}>
                                        {JSON.stringify(t.execution || { pending: true }, null, 2)}
                                    </Text>
                                </View>
                            )}

                            <Text style={styles.action}>ACTION: <Text style={styles.actionType}>{t.action.toUpperCase()}</Text></Text>
                        </View>
                    ))}
                </ScrollView>
            </LinearGradient>
        </Animatable.View>
    );
};
