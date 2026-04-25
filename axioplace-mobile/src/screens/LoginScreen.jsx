import React, { useState, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
    ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Home, LogIn } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/Colors';

// Nécessaire pour fermer la fenêtre du navigateur après l'auth
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
    const { login, socialLogin } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState(''); // 'google' | 'facebook' | ''
    const [error, setError] = useState('');

    // ── Google OAuth via expo-auth-session ────────────────────────────────────
    // ⚠ Remplace VOTRE_GOOGLE_CLIENT_ID par ton vrai Client ID Google
    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: '132128550341-8innvpk3g15bq9eefg8e2iuuhlapaq5m.apps.googleusercontent.com',
        redirectUri: makeRedirectUri({ scheme: 'axioplace' }),
        scopes: ['profile', 'email'],
    });

    // Écouter la réponse Google
    React.useEffect(() => {
        if (response?.type === 'success') {
            const { access_token } = response.params;
            handleSocialLogin('google', access_token);
        } else if (response?.type === 'error') {
            setError('Connexion Google annulée ou échouée.');
            setSocialLoading('');
        }
    }, [response]);

    const handleSocialLogin = useCallback(async (provider, token) => {
        setSocialLoading(provider);
        setError('');
        try {
            await socialLogin(provider, token);
        } catch (err) {
            const msg = err.response?.data?.message || `Connexion ${provider} échouée. Réessayez.`;
            setError(msg);
        } finally {
            setSocialLoading('');
        }
    }, [socialLogin]);

    const handleGooglePress = async () => {
        setSocialLoading('google');
        setError('');
        await promptAsync();
    };

    // ── Connexion classique email/mot de passe ────────────────────────────────
    const handleLogin = async () => {
        if (!email || !password) { setError('Veuillez remplir tous les champs.'); return; }
        setLoading(true);
        setError('');
        try {
            await login(email, password);
        } catch (err) {
            const msg = err.response?.data?.errors?.email?.[0]
                || err.response?.data?.message
                || 'Identifiants incorrects.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const isBusy = loading || !!socialLoading;

    return (
        <View style={styles.container}>
            <ImageBackground
                source={require('../../assets/hero-bg.jpg')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['rgba(255,197,51,0.85)', 'rgba(0,149,67,0.85)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
            </ImageBackground>

            <SafeAreaView style={styles.safeArea}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('HomeTab')}
                    style={styles.homeBtn}
                >
                    <Home size={20} color="rgba(255,255,255,0.9)" />
                </TouchableOpacity>

                <KeyboardAvoidingView
                    style={styles.keyboardView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.card}>
                            {/* Header */}
                            <View style={styles.cardHeader}>
                                <View style={styles.logoIcon}>
                                    <LogIn size={24} color={Colors.axioVert} strokeWidth={2.5} />
                                </View>
                                <Text style={styles.cardTitle}>Connexion</Text>
                                <Text style={styles.cardSubtitle}>Bienvenue sur votre plateforme</Text>
                            </View>

                            {/* Message d'erreur */}
                            {error ? (
                                <View style={styles.errorBox}>
                                    <Text style={styles.errorIcon}>⚠</Text>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            {/* ── Boutons sociaux ─────────────────────────────── */}
                            <View style={styles.socialRow}>
                                {/* Google */}
                                <TouchableOpacity
                                    style={styles.socialBtn}
                                    onPress={handleGooglePress}
                                    disabled={isBusy || !request}
                                    activeOpacity={0.8}
                                >
                                    {socialLoading === 'google' ? (
                                        <ActivityIndicator size="small" color={Colors.gray500} />
                                    ) : (
                                        <View style={styles.socialBtnInner}>
                                            {/* SVG Google via Text trick */}
                                            <Text style={styles.googleIcon}>G</Text>
                                            <Text style={styles.socialBtnText}>Google</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>

                                {/* Facebook */}
                                <TouchableOpacity
                                    style={[styles.socialBtn, styles.facebookBtn]}
                                    onPress={() => setError('Facebook sera disponible prochainement.')}
                                    disabled={isBusy}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.socialBtnInner}>
                                        <Text style={styles.facebookIcon}>f</Text>
                                        <Text style={[styles.socialBtnText, { color: '#1877F2' }]}>Facebook</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {/* Séparateur */}
                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>ou continuer avec email</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            {/* Champ Email */}
                            <View style={styles.fieldGroup}>
                                <Text style={styles.label}>Adresse email</Text>
                                <View style={styles.inputWrapper}>
                                    <Mail size={16} color={Colors.gray400} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="votre@email.com"
                                        placeholderTextColor={Colors.gray400}
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        editable={!isBusy}
                                    />
                                </View>
                            </View>

                            {/* Champ Mot de passe */}
                            <View style={styles.fieldGroup}>
                                <Text style={styles.label}>Mot de passe</Text>
                                <View style={styles.inputWrapper}>
                                    <Lock size={16} color={Colors.gray400} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        placeholderTextColor={Colors.gray400}
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPwd}
                                        editable={!isBusy}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPwd(v => !v)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        {showPwd
                                            ? <EyeOff size={16} color={Colors.gray400} />
                                            : <Eye size={16} color={Colors.gray400} />
                                        }
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Bouton Se connecter */}
                            <TouchableOpacity
                                style={[styles.btn, isBusy && styles.btnDisabled]}
                                onPress={handleLogin}
                                disabled={isBusy}
                                activeOpacity={0.85}
                            >
                                <LinearGradient
                                    colors={[Colors.axioJaune, '#f5b800']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.btnGradient}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#1f2937" />
                                    ) : (
                                        <View style={styles.btnContent}>
                                            <Text style={styles.btnText}>Se connecter</Text>
                                            <ArrowRight size={16} color="#1f2937" strokeWidth={2.5} />
                                        </View>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Mot de passe oublié */}
                            <TouchableOpacity
                                onPress={() => navigation.navigate('ForgotPassword')}
                                style={styles.forgotBtn}
                            >
                                <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
                            </TouchableOpacity>

                            {/* Lien vers inscription */}
                            <View style={styles.footer}>
                                <View style={styles.footerDivider} />
                                <Text style={styles.footerText}>Pas encore de compte ?{' '}</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                    <Text style={styles.footerLink}>Créer un compte</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    safeArea: { flex: 1 },
    homeBtn: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 55 : 40,
        left: 20,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    keyboardView: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 40,
    },

    card: {
        backgroundColor: '#ffffff',
        borderRadius: 28,
        padding: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    cardHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logoIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: Colors.axioVertLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.gray900,
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: Colors.gray500,
        fontWeight: '500',
    },

    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fef2f2',
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    errorIcon: { fontSize: 14, color: Colors.red },
    errorText: { color: '#b91c1c', fontSize: 13, fontWeight: '600', flex: 1 },

    // ── Social buttons ──────────────────────────────────────────────────────
    socialRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    socialBtn: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: Colors.gray200,
        borderRadius: 14,
        paddingVertical: 13,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    facebookBtn: {
        borderColor: 'rgba(24,119,242,0.25)',
        backgroundColor: '#EEF4FF',
    },
    socialBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    googleIcon: {
        fontSize: 17,
        fontWeight: '800',
        color: '#4285F4',
    },
    facebookIcon: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1877F2',
    },
    socialBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.gray700,
    },

    // ── Divider ─────────────────────────────────────────────────────────────
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 18,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.gray200,
    },
    dividerText: {
        fontSize: 11,
        color: Colors.gray400,
        fontWeight: '500',
    },

    // ── Form fields ──────────────────────────────────────────────────────────
    fieldGroup: { marginBottom: 18 },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.gray700,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: Colors.gray50,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 13,
        borderWidth: 1.5,
        borderColor: Colors.gray100,
    },
    input: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' },

    // ── Primary button ────────────────────────────────────────────────────────
    btn: {
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: 8,
        shadowColor: Colors.axioJaune,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    btnDisabled: { opacity: 0.7 },
    btnGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    btnText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1f2937',
    },

    footer: {
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: Colors.gray100,
        alignItems: 'center',
    },
    footerText: { fontSize: 14, color: Colors.gray500, fontWeight: '500' },
    footerLink: {
        fontSize: 15,
        color: Colors.axioVert,
        fontWeight: '800',
        marginTop: 4,
    },
    forgotBtn: {
        alignItems: 'center',
        marginTop: 16,
        paddingVertical: 6,
    },
    forgotText: {
        fontSize: 13,
        color: Colors.axioVert,
        fontWeight: '700',
    },
});
