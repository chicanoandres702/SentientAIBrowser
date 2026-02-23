import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { AppTheme } from '../../App';

interface Props {
    url: string;
    onNavigate: (url: string) => void;
    onBack?: () => void;
    onForward?: () => void;
    onReload?: () => void;
    theme: AppTheme;
}

export const BrowserChrome: React.FC<Props> = ({ url, onNavigate, onBack, onForward, onReload, theme }) => {
    const [inputUrl, setInputUrl] = useState(url);

    useEffect(() => {
        setInputUrl(url);
    }, [url]);

    const handleGo = () => {
        let finalUrl = inputUrl.trim();
        if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            finalUrl = 'https://' + finalUrl;
        }
        if (finalUrl !== url && finalUrl !== '') {
            onNavigate(finalUrl);
        }
    };

    const glowColor = theme === 'red' ? '#ff003c' : '#00d2ff';

    return (
        <View style={styles.container}>
            <View style={styles.navButtons}>
                <TouchableOpacity onPress={onBack} style={styles.navButton}>
                    <Text style={[styles.navButtonText, { color: glowColor }]}>←</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onForward} style={styles.navButton}>
                    <Text style={[styles.navButtonText, { color: glowColor }]}>→</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onReload} style={styles.navButton}>
                    <Text style={[styles.navButtonText, { color: glowColor }]}>↻</Text>
                </TouchableOpacity>
            </View>
            <TextInput
                style={[
                    styles.input,
                    {
                        borderColor: theme === 'red' ? 'rgba(255, 0, 60, 0.4)' : 'rgba(0, 210, 255, 0.4)',
                        backgroundColor: '#1a1a1a',
                        color: '#fff',
                    }
                ]}
                value={inputUrl}
                onChangeText={setInputUrl}
                onSubmitEditing={handleGo}
                placeholder="Search or enter web address"
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                selectTextOnFocus={true}
                clearButtonMode="while-editing"
                enablesReturnKeyAutomatically={true}
            />
            <TouchableOpacity
                style={[
                    styles.button,
                    {
                        backgroundColor: glowColor,
                        shadowColor: glowColor,
                    }
                ]}
                onPress={handleGo}
            >
                <Text style={styles.buttonText}>Go</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#0a0a0a',
        borderBottomWidth: 1,
        borderBottomColor: '#222',
        alignItems: 'center',
    },
    navButtons: {
        flexDirection: 'row',
        marginRight: 10,
    },
    navButton: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 2,
    },
    navButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    input: {
        flex: 1,
        height: 36,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 15,
        marginRight: 10,
        fontSize: 16,
    },
    button: {
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 6,
    },
    buttonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
