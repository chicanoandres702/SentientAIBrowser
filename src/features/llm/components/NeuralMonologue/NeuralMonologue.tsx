// Feature: LLM | Trace: README.md
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../auth/firebase-config';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { Scanline } from '../../../components/Scanline';
import { TypewriterText } from './TypewriterText';
import { styles } from './NeuralMonologue.styles';

export const NeuralMonologue = () => {
    const [thoughts, setThoughts] = useState<any[]>([]);
    const [lastId, setLastId] = useState<string | null>(null);

    useEffect(() => {
        if (!auth.currentUser) return;
        const q = query(collection(db, 'thoughts'), where('user_id', '==', auth.currentUser.uid), orderBy('timestamp', 'desc'), limit(5));
        const unsubscribe = onSnapshot(q, (s) => {
            const list = s.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
            setThoughts(list);
            if (list.length > 0) setLastId(list[list.length - 1].id);
        });
        return () => unsubscribe();
    }, [auth.currentUser]);

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
                                <Text style={styles.timestamp}>{new Date(t.timestamp?.seconds * 1000).toLocaleTimeString()}</Text>
                                <View style={styles.metrics}>
                                    {t.memoryUsed && <View style={styles.memoryBadge}><Text style={styles.memoryText}>MEMORY</Text></View>}
                                    <Text style={styles.ratingText}>IQ {t.intelligenceRating || 0}%</Text>
                                </View>
                            </View>
                            {t.id === lastId ? <TypewriterText text={t.reasoning} /> : <Text style={styles.reasoning}>{t.reasoning}</Text>}
                            <Text style={styles.action}>ACTION: <Text style={styles.actionType}>{t.action.toUpperCase()}</Text></Text>
                        </View>
                    ))}
                </ScrollView>
            </LinearGradient>
        </Animatable.View>
    );
};
