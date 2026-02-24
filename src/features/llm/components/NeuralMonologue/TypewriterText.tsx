import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';
import { styles } from './NeuralMonologue.styles';

export const TypewriterText = ({ text, delay = 20 }: { text: string, delay?: number }) => {
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
