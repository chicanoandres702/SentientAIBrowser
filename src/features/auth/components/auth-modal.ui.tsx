// Feature: Auth | Trace: src/features/auth/trace.md
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/use-auth.hook';
import { AppTheme } from '../../../../App';
import { styles } from './AuthModal/AuthModal.styles';

export const AuthModal: React.FC<{ theme: AppTheme }> = ({ theme }) => {
    const { login, signup, loginWithGoogle, isLoading } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const accent = theme === 'red' ? '#ff003c' : '#00d2ff';

    const handleSubmit = async () => {
        setErrorMsg('');
        try { isLogin ? await login(email, password) : await signup(email, password); }
        catch (err: any) { setErrorMsg(err.message || 'Authentication failed.'); }
    };

    const handleGoogleLogin = async () => {
        setErrorMsg('');
        try { await loginWithGoogle(); }
        catch (err: any) { setErrorMsg(err.message || 'Google login failed.'); }
    };

    return (
        <View style={styles.overlay}>
            <View style={styles.modalBg}>
                <Text style={styles.title}>SENTIENT <Text style={{ color: accent }}>OS</Text></Text>
                <Text style={styles.subtitle}>{isLogin ? 'AUTHORIZE ACCESS' : 'CREATE IDENTITY'} | v1.2.0-DIAGNOSTIC</Text>
                <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#555" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#555" value={password} onChangeText={setPassword} secureTextEntry />
                {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: accent, shadowColor: accent }]} onPress={handleSubmit} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.submitText}>{isLogin ? 'INITIALIZE' : 'REGISTER'}</Text>}
                </TouchableOpacity>
                <View style={styles.divider}><View style={styles.line} /><Text style={styles.dividerText}>OR</Text><View style={styles.line} /></View>
                <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.googleText}>CONTINUE WITH GOOGLE</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.toggleBtn} onPress={() => setIsLogin(!isLogin)}><Text style={styles.toggleText}>{isLogin ? 'Register' : 'Access'}</Text></TouchableOpacity>
            </View>
        </View>
    );
};
