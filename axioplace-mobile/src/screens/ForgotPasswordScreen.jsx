import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, KeyboardAvoidingView, Platform,
    ScrollView, ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react-native';
import api from '../lib/api';
import { Colors } from '../constants/Colors';

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail]     = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError]     = useState('');

    const handleSubmit = async () => {
        if (!email.trim()) { setError('Veuillez entrer votre adresse email.'); return; }
        setLoading(true); setError(''); setSuccess('');
        try {
            const res = await api.post('/forgot-password', { email: email.trim().toLowerCase() });
            setSuccess(res.data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Une erreur est survenue. Réessayez.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ImageBackground
                source={require('../../assets/hero-bg.jpg')}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['rgba(255,197,51,0.88)', 'rgba(0,149,67,0.88)']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
            </ImageBackground>

            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.flex}
                >
                    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                        {/* Back button */}
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <ArrowLeft size={20} color="rgba(255,255,255,0.9)" />
                            <Text style={styles.backText}>Retour</Text>
                        </TouchableOpacity>

                        {/* Card */}
                        <View style={styles.card}>
                            {success ? (
                                <View style={styles.successContainer}>
                                    <View style={styles.successIcon}>
                                        <CheckCircle size={40} color={Colors.axioVert} />
                                    </View>
                                    <Text style={styles.successTitle}>Email envoyé !</Text>
                                    <Text style={styles.successText}>{success}</Text>
                                    <Text style={styles.successHint}>Vérifiez vos spams si vous ne trouvez pas l'email.</Text>
                                    <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginBtn}>
                                        <Text style={styles.loginBtnText}>Retour à la connexion</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <>
                                    {/* Header */}
                                    <View style={styles.cardHeader}>
                                        <View style={styles.iconBox}>
                                            <Mail size={28} color={Colors.axioVert} />
                                        </View>
                                        <Text style={styles.cardTitle}>Mot de passe oublié</Text>
                                        <Text style={styles.cardSubtitle}>
                                            Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                                        </Text>
                                    </View>

                                    {/* Champ email */}
                                    <View style={styles.fieldGroup}>
                                        <Text style={styles.fieldLabel}>Adresse email</Text>
                                        <View style={styles.inputRow}>
                                            <Mail size={18} color={Colors.gray400} style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.input}
                                                value={email}
                                                onChangeText={setEmail}
                                                placeholder="votre@email.com"
                                                placeholderTextColor={Colors.gray400}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                autoComplete="email"
                                            />
                                        </View>
                                    </View>

                                    {/* Erreur */}
                                    {!!error && (
                                        <View style={styles.errorBox}>
                                            <Text style={styles.errorText}>{error}</Text>
                                        </View>
                                    )}

                                    {/* Submit */}
                                    <TouchableOpacity
                                        onPress={handleSubmit}
                                        disabled={loading || !email.trim()}
                                        activeOpacity={0.85}
                                        style={[styles.submitBtn, (!email.trim() || loading) && styles.submitBtnDisabled]}
                                    >
                                        <LinearGradient
                                            colors={[Colors.axioVert, '#1e7a32']}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                            style={styles.submitGradient}
                                        >
                                            {loading
                                                ? <ActivityIndicator color="#fff" size="small" />
                                                : <Text style={styles.submitText}>Envoyer le lien</Text>
                                            }
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    flex: { flex: 1 },
    safeArea: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },

    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
    backText: { color: 'rgba(255,255,255,0.9)', fontWeight: '600', fontSize: 15 },

    card: {
        backgroundColor: Colors.white, borderRadius: 24,
        padding: 28, shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12,
        shadowRadius: 24, elevation: 8,
    },
    cardHeader: { alignItems: 'center', marginBottom: 28 },
    iconBox: {
        width: 64, height: 64, borderRadius: 20,
        backgroundColor: Colors.axioVert + '15',
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    cardTitle: { fontSize: 22, fontWeight: '900', color: Colors.gray900, marginBottom: 8 },
    cardSubtitle: { fontSize: 13, color: Colors.gray500, textAlign: 'center', lineHeight: 20 },

    fieldGroup: { marginBottom: 16 },
    fieldLabel: { fontSize: 13, fontWeight: '700', color: Colors.gray700, marginBottom: 8 },
    inputRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14,
        paddingHorizontal: 14, height: 52, backgroundColor: Colors.gray50,
    },
    inputIcon: {},
    input: { flex: 1, fontSize: 15, color: Colors.gray900 },

    errorBox: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, padding: 12, marginBottom: 12 },
    errorText: { color: '#dc2626', fontSize: 13 },

    submitBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
    submitBtnDisabled: { opacity: 0.5 },
    submitGradient: { height: 54, alignItems: 'center', justifyContent: 'center' },
    submitText: { color: Colors.white, fontWeight: '800', fontSize: 16 },

    successContainer: { alignItems: 'center', paddingVertical: 16 },
    successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.axioVert + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    successTitle: { fontSize: 22, fontWeight: '900', color: Colors.gray900, marginBottom: 8 },
    successText: { fontSize: 14, color: Colors.gray600, textAlign: 'center', marginBottom: 8 },
    successHint: { fontSize: 12, color: Colors.gray400, textAlign: 'center', marginBottom: 24 },
    loginBtn: { backgroundColor: Colors.axioVert + '15', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 14 },
    loginBtnText: { color: Colors.axioVert, fontWeight: '800', fontSize: 15 },
});
