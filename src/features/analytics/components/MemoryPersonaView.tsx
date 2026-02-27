// Feature: Analytics | Trace: README.md
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { getHighlyRatedAnswers, SurveyAnswer } from '../../../../shared/survey-memory-db';
import * as Animatable from 'react-native-animatable';
import { styles } from './MemoryPersonaView.styles';

export const MemoryPersonaView: React.FC<{ theme: any }> = ({ theme }) => {
    const [items, setItems] = useState<SurveyAnswer[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => { load(); }, []);
    const load = async () => { setItems(await getHighlyRatedAnswers(20)); setLoading(false); };

    if (loading) return (
        <View style={styles.center}><ActivityIndicator color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.text }]}>HYDRATING PERSONA...</Text></View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}><Text style={[styles.title, { color: theme.text }]}>SENTINEL IDENTITY</Text>
            <Text style={styles.subtitle}>HIGH-YIELD NEURAL WEIGHTS</Text></View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {items.map((item, i) => (
                    <Animatable.View key={item.id} animation="fadeInUp" delay={i * 50} style={[styles.item, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: theme.accent + '33' }]}>
                        <View style={styles.itemHeader}><Text style={[styles.weight, { color: theme.accent }]}>WEIGHT: +{item.success_weight}</Text>
                        <Text style={styles.timestamp}>{new Date(item.created_at?.seconds * 1000).toLocaleDateString()}</Text></View>
                        <Text style={[styles.question, { color: 'rgba(255,255,255,0.5)' }]}>{item.question_context}</Text>
                        <Text style={[styles.answer, { color: theme.text }]}>{item.answer_given}</Text>
                    </Animatable.View>
                ))}
                {items.length === 0 && <View style={styles.empty}><Text style={styles.emptyText}>No Persona Data Found.</Text></View>}
            </ScrollView>
        </View>
    );
};
