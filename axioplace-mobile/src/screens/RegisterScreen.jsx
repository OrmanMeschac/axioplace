import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
    ImageBackground, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Mail, Lock, User, Phone, ChevronLeft, ArrowRight, UserPlus } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
    const { register } = useAuth();
    const [nom, setNom] = useState('');
    const [email, setEmail] = useState('');
    const [telephone, setTelephone] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [acceptCgu, setAcceptCgu] = useState(false);

    const handleRegister = async () => {
        const newErrors = {};
        if (!nom.trim()) newErrors.nom = 'Veuillez saisir votre nom';
        if (!email.trim()) newErrors.email = 'Veuillez saisir votre e-mail';
        if (!password || password.length < 8) newErrors.password = 'Minimum 8 caractères requis';
        if (password !== passwordConfirm) newErrors.password_confirmation = 'Les mots de passe divergent';
        if (!acceptCgu) newErrors.cgu = 'Vous devez accepter les CGU pour continuer';

        if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

        setLoading(true); setErrors({});
        try {
            await register({ nom, email, telephone, password, password_confirmation: passwordConfirm });
        } catch (err) {
            const apiErrors = err.response?.data?.errors || {};
            const formatted = {};
            Object.keys(apiErrors).forEach(k => { formatted[k] = apiErrors[k][0]; });
            if (Object.keys(formatted).length) { setErrors(formatted); }
            else { setErrors({ general: err.response?.data?.message || "Erreur lors de l'inscription." }); }
        } finally { setLoading(false); }
    };

    const Field = ({ icon: Icon, placeholder, value, onChange, secure, type, error, label }) => (
        <View style={styles.fieldGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={[styles.inputWrapper, error && styles.inputError]}>
                <Icon size={16} color={Colors.gray400} />
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.gray400}
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry={secure && !showPwd}
                    keyboardType={type || 'default'}
                    autoCapitalize={type === 'email-address' ? 'none' : 'words'}
                />
                {secure && (
                    <TouchableOpacity onPress={() => setShowPwd(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        {showPwd ? <EyeOff size={16} color={Colors.gray400} /> : <Eye size={16} color={Colors.gray400} />}
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text style={styles.fieldError}>{error}</Text>}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Background identique au Login: pont + dégradé jaune→vert */}
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
                {/* Bouton retour */}
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                >
                    <ChevronLeft size={22} color="rgba(255,255,255,0.9)" />
                </TouchableOpacity>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Card blanche flottante */}
                        <View style={styles.card}>
                            {/* Header */}
                            <View style={styles.cardHeader}>
                                <View style={styles.logoIcon}>
                                    <UserPlus size={24} color={Colors.axioVert} strokeWidth={2.5} />
                                </View>
                                <Text style={styles.cardTitle}>Créer un compte</Text>
                                <Text style={styles.cardSubtitle}>Rejoignez la communauté Axioplace</Text>
                            </View>

                            {errors.general && (
                                <View style={styles.errorBox}>
                                    <Text style={styles.errorIcon}>⚠</Text>
                                    <Text style={styles.errorText}>{errors.general}</Text>
                                </View>
                            )}

                            <Field icon={User} label="Nom complet" placeholder="Ex: Jean Dupont" value={nom} onChange={setNom} error={errors.nom} />
                            <Field icon={Mail} label="Adresse e-mail" placeholder="votre@email.com" value={email} onChange={setEmail} type="email-address" error={errors.email} />
                            <Field icon={Phone} label="Téléphone" placeholder="06 XXX XXXX" value={telephone} onChange={setTelephone} type="phone-pad" error={errors.telephone} />
                            <Field icon={Lock} label="Mot de passe" placeholder="Minimum 8 caractères" value={password} onChange={setPassword} secure error={errors.password} />
                            <Field icon={Lock} label="Confirmation" placeholder="Confirmez votre mot de passe" value={passwordConfirm} onChange={setPasswordConfirm} secure error={errors.password_confirmation} />

                            {/* Checkbox CGU */}
                            <TouchableOpacity
                                onPress={() => setAcceptCgu(v => !v)}
                                activeOpacity={0.7}
                                style={styles.cguRow}
                            >
                                <View style={[styles.checkbox, acceptCgu && styles.checkboxChecked]}>
                                    {acceptCgu && <Text style={styles.checkmark}>✓</Text>}
                                </View>
                                <Text style={styles.cguText}>
                                    J'accepte les{' '}
                                    <Text style={styles.cguLink}>Conditions d'utilisation</Text>
                                    {' '}et la{' '}
                                    <Text style={styles.cguLink}>Politique de confidentialité</Text>
                                </Text>
                            </TouchableOpacity>
                            {errors.cgu && <Text style={styles.fieldError}>{errors.cgu}</Text>}

                            {/* Bouton S'inscrire */}
                            <TouchableOpacity
                                style={[styles.btn, (loading || !acceptCgu) && styles.btnDisabled]}
                                onPress={handleRegister}
                                disabled={loading || !acceptCgu}
                                activeOpacity={0.85}
                            >
                                <LinearGradient
                                    colors={[Colors.axioVert, Colors.axioVertDark]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.btnGradient}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <View style={styles.btnContent}>
                                            <Text style={styles.btnText}>S'inscrire gratuitement</Text>
                                            <ArrowRight size={16} color="#fff" strokeWidth={2.5} />
                                        </View>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Lien vers connexion */}
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.footerLink}>
                                <Text style={styles.footerText}>
                                    Déjà un compte ? <Text style={styles.footerAccent}>Se connecter</Text>
                                </Text>
                            </TouchableOpacity>
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
    backBtn: {
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
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 40,
    },

    card: {
        backgroundColor: '#ffffff',
        borderRadius: 28,
        padding: 24,
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
        marginBottom: 14,
    },
    cardTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: Colors.gray900,
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 13,
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

    fieldGroup: { marginBottom: 14 },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.gray700,
        marginBottom: 6,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: Colors.gray50,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1.5,
        borderColor: Colors.gray100,
    },
    inputError: { borderColor: '#fca5a5' },
    input: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: '500' },
    fieldError: { fontSize: 11, color: Colors.red, marginTop: 4, fontWeight: '700' },

    btn: {
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: 8,
        shadowColor: Colors.axioVert,
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
        fontSize: 14,
        fontWeight: '800',
        color: '#fff',
    },

    footerLink: { marginTop: 20, alignItems: 'center' },
    footerText: { fontSize: 14, color: Colors.gray500, fontWeight: '500' },
    footerAccent: { color: Colors.axioVert, fontWeight: '800' },

    cguRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginTop: 6,
        marginBottom: 4,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors.gray300,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: 1,
    },
    checkboxChecked: {
        backgroundColor: Colors.axioVert,
        borderColor: Colors.axioVert,
    },
    checkmark: { color: '#fff', fontSize: 11, fontWeight: '900' },
    cguText: { flex: 1, fontSize: 12, color: Colors.gray500, fontWeight: '500', lineHeight: 18 },
    cguLink: { color: Colors.axioVert, fontWeight: '700' },
});
