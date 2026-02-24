import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../auth/firebase-config';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { Scanline } from '../../../components/Scanline';

const TypewriterText = ({ text, delay = 20 }: { text: string, delay?: number }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        setDisplayedText('');
        let i = 0;
        const timer = setInterval(() => {
            setDisplayedText((prev) => prev + text.charAt(i));
            i++;
            if (i >= text.length) clearInterval(timer);
        }, delay);
        return () => clearInterval(timer);
    }, [text]);

    return <Text style={styles.reasoning}>{displayedText}</Text>;
};

export const NeuralMonologue = () => {
    const [thoughts, setThoughts] = useState<any[]>([]);
    const [lastThoughtId, setLastThoughtId] = useState<string | null>(null);

    useEffect(() => {
        if (!auth.currentUser) return;

        const q = query(
            collection(db, 'thoughts'),
            where('user_id', '==', auth.currentUser.uid),
            orderBy('timestamp', 'desc'),
            limit(5)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newThoughts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            const reversed = newThoughts.reverse();
            setThoughts(reversed);
            if (reversed.length > 0) {
                setLastThoughtId(reversed[reversed.length - 1].id);
            }
        });

        return () => unsubscribe();
    }, [auth.currentUser]);

    if (thoughts.length === 0) return null;

    return (
        <Animatable.View
            animation="fadeInUp"
            duration={800}
            style={styles.container}
        >
            <LinearGradient
                colors={['rgba(15, 10, 25, 0.9)', 'rgba(5, 5, 8, 0.98)']}
                style={styles.gradient}
            >
                <Scanline color="#a064ff" opacity={0.1} duration={6000} />

                <View style={styles.header}>
                    <Animatable.View
                        animation="pulse"
                        iterationCount="infinite"
                        style={styles.pulse}
                    />
                    <Text style={styles.headerText}>NEURAL STREAM</Text>
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                >
                    {thoughts.map((thought, index) => (
                        <View key={thought.id} style={styles.thoughtItem}>
                            <View style={styles.thoughtHeader}>
                                <Text style={styles.timestamp}>
                                    {new Date(thought.timestamp?.seconds * 1000).toLocaleTimeString()}
                                </Text>
                                <View style={styles.metrics}>
                                    {thought.memoryUsed && (
                                        <View style={styles.memoryBadge}>
                                            <Text style={styles.memoryText}>MEMORY</Text>
                                        </View>
                                    )}
                                    <Text style={styles.ratingText}>IQ {thought.intelligenceRating || 0}%</Text>
                                </View>
                            </View>
                            {thought.id === lastThoughtId ? (
                                <TypewriterText text={thought.reasoning} />
                            ) : (
                                <Text style={styles.reasoning}>{thought.reasoning}</Text>
                            )}
                            <Text style={styles.action}>
                                ACTION: <Text style={styles.actionType}>{thought.action.toUpperCase()}</Text>
                            </Text>
                        </View>
                    ))}
                </ScrollView>
            </LinearGradient>
        </Animatable.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 110,
        right: 20,
        width: 320,
        height: 240,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(160, 100, 255, 0.25)',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    gradient: {
        flex: 1,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        paddingBottom: 6,
    },
    pulse: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#a064ff',
        marginRight: 10,
        shadowColor: '#a064ff',
        shadowOpacity: 1,
        shadowRadius: 6,
    },
    headerText: {
        color: '#a064ff',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 3,
        textShadowColor: 'rgba(160, 100, 255, 0.5)',
        textShadowRadius: 8,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 4,
    },
    thoughtItem: {
        marginBottom: 16,
        paddingLeft: 12,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(160, 100, 255, 0.3)',
    },
    thoughtHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    metrics: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    memoryBadge: {
        backgroundColor: 'rgba(160, 100, 255, 0.2)',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
        marginRight: 8,
        borderWidth: 0.5,
        borderColor: 'rgba(160, 100, 255, 0.5)',
    },
    memoryText: {
        color: '#a064ff',
        fontSize: 7,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    ratingText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 8,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    timestamp: {
        color: 'rgba(160, 100, 255, 0.4)',
        fontSize: 8,
        fontWeight: 'bold',
    },
    reasoning: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 11,
        lineHeight: 16,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    action: {
        color: 'rgba(160, 100, 255, 0.6)',
        fontSize: 9,
        marginTop: 6,
        fontWeight: '900',
        letterSpacing: 1,
    },
    actionType: {
        color: '#fff',
    }
});

