// Feature: UI | Trace: src/layouts/MainLayout.tsx
import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../features/auth/firebase-config';

interface Props {
    tabId: string;
    theme: 'red' | 'blue';
}

export const BrowserPreview: React.FC<Props> = ({ tabId, theme }) => {
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!tabId) return;
        setLoading(true);
        const tabRef = doc(db, 'browser_tabs', tabId);
        
        const unsubscribe = onSnapshot(tabRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.screenshot) {
                    setScreenshot(data.screenshot);
                    setLoading(false);
                }
            } else {
                setError('Tab data not found in cloud');
                setLoading(false);
            }
        }, (err) => {
            console.error('Preview sync error:', err);
            setError('Failed to sync preview');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [tabId]);

    const activeColor = theme === 'red' ? '#ff003c' : '#0070f3';

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={{ color: activeColor }}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {loading && !screenshot && (
                <View style={styles.loader}>
                    <ActivityIndicator color={activeColor} size="large" />
                    <Text style={{ color: '#fff', marginTop: 10 }}>Syncing Headless Stream...</Text>
                </View>
            )}
            {screenshot && (
                <Image 
                    source={{ uri: screenshot }} 
                    style={styles.screenshot} 
                    resizeMode="contain"
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050505',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loader: {
        position: 'absolute',
        zIndex: 10,
        alignItems: 'center',
    },
    screenshot: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
    },
});
