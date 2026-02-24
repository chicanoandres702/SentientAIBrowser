import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { styles } from './EarningsChart.styles';

interface Props {
    theme: { background: string; accent: string; text: string; secondary: string; };
    data: number[];
}

export const EarningsChart: React.FC<Props> = ({ theme, data }) => {
    const maxVal = Math.max(...data, 100);
    const chartHeight = 120;
    return (
        <View style={styles.container}>
            <View style={styles.header}><Text style={[styles.title, { color: theme.text }]}>REWARDS VELOCITY</Text><Text style={styles.subtitle}>SB ACCUMULATION TREND</Text></View>
            <View style={[styles.chartArea, { height: chartHeight }]}>
                <View style={styles.barsContainer}>
                    {data.map((val, i) => (
                        <View key={i} style={styles.barWrapper}>
                            <Animatable.View animation="bounceInUp" delay={i * 100} style={[styles.bar, { height: (val / maxVal) * chartHeight, backgroundColor: theme.accent, shadowColor: theme.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10 }]}><LinearGradient colors={[theme.accent, theme.accent + '22']} style={StyleSheet.absoluteFill} /></Animatable.View>
                        </View>
                    ))}
                </View>
                <View style={[styles.gridLine, { top: 0, borderColor: 'rgba(255,255,255,0.05)' }]} />
                <View style={[styles.gridLine, { top: chartHeight / 2, borderColor: 'rgba(255,255,255,0.05)' }]} />
                <View style={[styles.gridLine, { bottom: 0, borderColor: 'rgba(255,255,255,0.1)' }]} />
            </View>
            <View style={styles.footer}><Text style={styles.footerText}>TOTAL HARVESTED: {data.reduce((a,b) => a+b, 0)} SB</Text><Text style={[styles.footerText, { color: theme.accent }]}>+{(data[data.length-1] || 0)} SB (LAST)</Text></View>
        </View>
    );
};
