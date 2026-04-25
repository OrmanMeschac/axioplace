import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, TextInput,
    StyleSheet, ActivityIndicator, Alert, ImageBackground, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Mail, Phone, Lock, Eye, EyeOff, Camera, LayoutList, Heart, LogOut, ChevronRight, Shield, CheckCircle2, Settings, Edit3, Bell } from 'lucide-react-native';
import api from '../lib/api';
import { Colors } from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { getImageUri } from '../utils/images';
import FastImage from '../components/FastImage';

export default function ProfilScreen({ navigation }) {
    const { user, setUser, logout, adminNotifCount } = useAuth();
    const [stats, setStats] = useState({ annonces: 0, favoris: 0 });
    const [activeTab, setActiveTab] = useState('info');

    // ── Animation cloche pulsante quand il y a des notifs ──────────────────
    const bellPulse = useRef(new Animated.Value(1)).current;
    const bellGlow = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (adminNotifCount > 0) {
            // Pulse répétitif
            Animated.loop(
                Animated.sequence([
                    Animated.timing(bellPulse, { toValue: 1.25, duration: 400, useNativeDriver: true }),
                    Animated.timing(bellPulse, { toValue: 1, duration: 400, useNativeDriver: true }),
                ])
            ).start();
            // Glow répétitif
            Animated.loop(
                Animated.sequence([
                    Animated.timing(bellGlow, { toValue: 1, duration: 700, useNativeDriver: false }),
                    Animated.timing(bellGlow, { toValue: 0, duration: 700, useNativeDriver: false }),
                ])
            ).start();
        } else {
            bellPulse.stopAnimation();
            bellGlow.stopAnimation();
            bellPulse.setValue(1);
            bellGlow.setValue(0);
        }
    }, [adminNotifCount]);

    // Tab: Infos
    const [nom, setNom] = useState(user?.nom || '');
    const [email, setEmail] = useState(user?.email || '');
    const [telephone, setTel] = useState(user?.telephone || '');
    const [infoLoading, setInfoLoading] = useState(false);
    const [infoSuccess, setInfoSuccess] = useState(false);

    // Tab: Sécurité
    const [currentPwd, setCurrentPwd] = useState('');
    
    // Bug fix: Synchronize local states when global user changes (e.g. updated on web)
    const [imageError, setImageError] = useState(false);
    // focusCount forces Image remount on each screen focus → bypasses Android image cache
    const [focusCount, setFocusCount] = useState(0);
    useEffect(() => {
        if (user) {
            setNom(user.nom || '');
            setEmail(user.email || '');
            setTel(user.telephone || '');
            setImageError(false); // Reset image error when user updates
        }
    }, [user]);

    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [pwdLoading, setPwdLoading] = useState(false);
    const [pwdSuccess, setPwdSuccess] = useState(false);

    useFocusEffect(useCallback(() => {
        setFocusCount(c => c + 1);
        setImageError(false);
        Promise.all([
            api.get('/user'),
            api.get('/mes-annonces').catch(() => ({ data: { total: 0, data: [] } })),
            api.get('/favoris').catch(() => ({ data: [] })),
        ]).then(([userRes, ann, fav]) => {
            setUser(userRes.data);
            setStats({
                annonces: ann.data?.total ?? (ann.data?.data?.length ?? 0),
                favoris: Array.isArray(fav.data) ? fav.data.length : 0,
            });
        });
        // adminNotifCount est géré globalement par le polling AuthContext
    }, [setUser]));

    const handleUpdateInfo = async () => {
        setInfoLoading(true); setInfoSuccess(false);
        try {
            const res = await api.put('/user/profil', { nom, email, telephone });
            setUser(res.data);
            setInfoSuccess(true);
            setTimeout(() => setInfoSuccess(false), 3000);
        } catch (err) {
            const msg = err.response?.data?.errors
                ? Object.values(err.response.data.errors)[0][0]
                : err.response?.data?.message || 'Erreur lors de la mise à jour.';
            Alert.alert('Erreur', msg);
        } finally {
            setInfoLoading(false);
        }
    };

    const handleUpdatePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission requise', 'Autorisez l\'accès à votre galerie pour modifier votre photo.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1.0,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const photo = result.assets[0];
                
                const formData = new FormData();
                formData.append('photo', {
                    uri: photo.uri,
                    type: 'image/jpeg',
                    name: 'profile.jpg',
                });

                const res = await api.post('/user/photo', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                setUser(res.data);
                Alert.alert('Succès', 'Photo de profil mise à jour avec succès.');
            }
        } catch (err) {
            console.error('Erreur photo:', err);
            const msg = err.response?.data?.errors?.photo?.[0] || 'Erreur lors du téléchargement de la photo.';
            Alert.alert('Erreur', msg);
        }
    };

    const handleUpdatePwd = async () => {
        if (newPwd !== confirmPwd) { Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.'); return; }
        setPwdLoading(true); setPwdSuccess(false);
        try {
            await api.put('/user/password', {
                current_password: currentPwd,
                password: newPwd,
                password_confirmation: confirmPwd,
            });
            setPwdSuccess(true);
            setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
            setTimeout(() => setPwdSuccess(false), 3000);
        } catch (err) {
            const msg = err.response?.data?.errors?.current_password?.[0]
                || err.response?.data?.message || 'Erreur.';
            Alert.alert('Erreur', msg);
        } finally {
            setPwdLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Se déconnecter', style: 'destructive',
                onPress: () => logout(),
            },
        ]);
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header Profil avec dégradé jaune→vert */}
                <ImageBackground
                    source={require('../../assets/profile-pattern.png')}
                    style={styles.profileHeader}
                >
                    <LinearGradient
                        colors={['rgba(255,197,51,0.88)', 'rgba(5,150,105,0.92)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <SafeAreaView edges={['top']}>
                        <View style={styles.headerContent}>
                            <View style={styles.avatarWrapper}>
                                {user?.photo_profil && !imageError ? (
                                <FastImage
                                    key={`${user.photo_profil}_${focusCount}`}
                                    source={getImageUri(user.photo_profil)}
                                    style={styles.avatar}
                                    contentFit="cover"
                                    priority="high"
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Text style={styles.avatarLetter}>{user?.nom?.charAt(0)?.toUpperCase() || 'U'}</Text>
                                    </View>
                                )}
                                <TouchableOpacity style={styles.cameraBtn} onPress={handleUpdatePhoto}>
                                    <LinearGradient
                                        colors={[Colors.axioJaune, '#f5b800']}
                                        style={styles.cameraBtnGradient}
                                    >
                                        <Camera size={14} color="#1f2937" />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.profileName}>{user?.nom}</Text>
                            <Text style={styles.profileEmail}>{user?.email}</Text>

                            {/* Stats Glass */}
                            <View style={styles.statsRow}>
                                <View style={styles.statBadge}>
                                    <Text style={styles.statValue}>{stats.annonces}</Text>
                                    <Text style={styles.statLabel}>Annonces</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statBadge}>
                                    <Text style={styles.statValue}>{stats.favoris}</Text>
                                    <Text style={styles.statLabel}>Favoris</Text>
                                </View>
                            </View>
                        </View>
                    </SafeAreaView>
                </ImageBackground>

                {/* Tabs */}
                <View style={styles.tabs}>
                    {[
                        { key: 'info', label: 'Mes infos', Icon: User },
                        { key: 'securite', label: 'Sécurité', Icon: Shield },
                    ].map(tab => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            {activeTab === tab.key ? (
                                <LinearGradient
                                    colors={[Colors.axioJaune, '#f5b800']}
                                    style={styles.tabGradient}
                                >
                                    <tab.Icon size={15} color="#1f2937" />
                                    <Text style={[styles.tabLabel, styles.tabLabelActive]}>{tab.label}</Text>
                                </LinearGradient>
                            ) : (
                                <View style={styles.tabInner}>
                                    <tab.Icon size={15} color={Colors.gray400} />
                                    <Text style={styles.tabLabel}>{tab.label}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Tab: Informations */}
                {activeTab === 'info' && (
                    <View style={styles.tabContent}>
                        {infoSuccess && (
                            <View style={styles.successBanner}>
                                <CheckCircle2 size={16} color={Colors.axioVert} />
                                <Text style={styles.successText}>Profil mis à jour !</Text>
                            </View>
                        )}

                        {[
                            { label: 'Nom complet', icon: User, value: nom, setter: setNom, type: 'default', placeholder: 'Jean Dupont' },
                            { label: 'Adresse e-mail', icon: Mail, value: email, setter: setEmail, type: 'email-address', placeholder: 'jean@exemple.com' },
                            { label: 'Téléphone', icon: Phone, value: telephone, setter: setTel, type: 'phone-pad', placeholder: '06XXX XXXX' },
                        ].map(({ label, icon: Icon, value, setter, type, placeholder }) => (
                            <View style={styles.fieldGroup} key={label}>
                                <Text style={styles.fieldLabel}>{label}</Text>
                                <View style={styles.inputRow}>
                                    <Icon size={18} color={Colors.gray400} />
                                    <TextInput
                                        style={styles.textInput}
                                        value={value}
                                        onChangeText={setter}
                                        keyboardType={type}
                                        autoCapitalize={type === 'email-address' ? 'none' : 'words'}
                                        placeholder={placeholder}
                                        placeholderTextColor={Colors.gray400}
                                    />
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity
                            style={[styles.saveBtn, infoLoading && styles.saveBtnDisabled]}
                            onPress={handleUpdateInfo}
                            disabled={infoLoading}
                        >
                            <LinearGradient
                                colors={[Colors.axioJaune, '#f5b800']}
                                style={styles.saveBtnGradient}
                            >
                                {infoLoading ? <ActivityIndicator color="#1f2937" /> : (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Edit3 size={16} color="#1f2937" />
                                        <Text style={styles.saveBtnText}>Mettre à jour mon profil</Text>
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Tab: Sécurité */}
                {activeTab === 'securite' && (
                    <View style={styles.tabContent}>
                        {pwdSuccess && (
                            <View style={styles.successBanner}>
                                <CheckCircle2 size={16} color={Colors.axioVert} />
                                <Text style={styles.successText}>Mot de passe modifié !</Text>
                            </View>
                        )}

                        {[
                            { label: 'Mot de passe actuel', value: currentPwd, setter: setCurrentPwd },
                            { label: 'Nouveau mot de passe', value: newPwd, setter: setNewPwd },
                            { label: 'Confirmer le nouveau', value: confirmPwd, setter: setConfirmPwd },
                        ].map(({ label, value, setter }) => (
                            <View style={styles.fieldGroup} key={label}>
                                <Text style={styles.fieldLabel}>{label}</Text>
                                <View style={styles.inputRow}>
                                    <Lock size={18} color={Colors.gray400} />
                                    <TextInput
                                        style={styles.textInput}
                                        value={value}
                                        onChangeText={setter}
                                        secureTextEntry={!showPwd}
                                        placeholder="••••••••"
                                        placeholderTextColor={Colors.gray400}
                                    />
                                </View>
                            </View>
                        ))}
                        <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={styles.showPwdBtn}>
                            {showPwd ? <EyeOff size={14} color={Colors.gray400} /> : <Eye size={14} color={Colors.gray400} />}
                            <Text style={styles.showPwdText}>{showPwd ? 'Masquer' : 'Afficher'} les mots de passe</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.saveBtn, pwdLoading && styles.saveBtnDisabled]}
                            onPress={handleUpdatePwd}
                            disabled={pwdLoading}
                        >
                            <LinearGradient
                                colors={[Colors.axioVert, Colors.axioVertDark]}
                                style={styles.saveBtnGradient}
                            >
                                {pwdLoading ? <ActivityIndicator color="#fff" /> : (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Shield size={16} color="#fff" />
                                        <Text style={[styles.saveBtnText, { color: '#fff' }]}>Changer le mot de passe</Text>
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Liens rapides */}
                <View style={styles.quickLinks}>
                    <TouchableOpacity style={styles.quickLink}
                        onPress={() => navigation.navigate('MesAnnonces', { mes_annonces: true })}>
                        <View style={[styles.quickLinkIcon, { backgroundColor: Colors.axioVertLight }]}>
                            <LayoutList size={18} color={Colors.axioVert} />
                        </View>
                        <Text style={styles.quickLinkText}>Mes annonces</Text>
                        <ChevronRight size={16} color={Colors.gray300} style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>
                    {/* Notifications — badge depuis le contexte global */}
                    <TouchableOpacity
                        style={styles.quickLink}
                        onPress={() => navigation.navigate('NotificationsAdmin')}
                        activeOpacity={0.75}
                    >
                        {/* Icône cloche avec animation si non-lus */}
                        <Animated.View style={[
                            styles.quickLinkIcon,
                            { backgroundColor: adminNotifCount > 0 ? '#1e1b4b' : '#fffbeb' },
                            { transform: [{ scale: bellPulse }] },
                        ]}>
                            <Bell
                                size={18}
                                color={adminNotifCount > 0 ? '#fbbf24' : Colors.axioJaune}
                                fill={adminNotifCount > 0 ? '#fbbf24' : 'none'}
                            />
                        </Animated.View>

                        <Text style={[
                            styles.quickLinkText,
                            adminNotifCount > 0 && { color: Colors.gray900, fontWeight: '800' },
                        ]}>Notifications</Text>

                        {adminNotifCount > 0 ? (
                            <Animated.View style={[
                                styles.notifBadge,
                                {
                                    backgroundColor: bellGlow.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [Colors.red, '#ef4444'],
                                    }),
                                    shadowColor: Colors.red,
                                    shadowOpacity: 0.6,
                                    shadowRadius: 6,
                                    elevation: 4,
                                },
                            ]}>
                                <Text style={styles.notifBadgeText}>
                                    {adminNotifCount > 99 ? '99+' : adminNotifCount}
                                </Text>
                            </Animated.View>
                        ) : (
                            <ChevronRight size={16} color={Colors.gray300} style={{ marginLeft: 'auto' }} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.quickLink, { borderBottomWidth: 0 }]}
                        onPress={() => navigation.navigate('Parametres')}>
                        <View style={[styles.quickLinkIcon, { backgroundColor: Colors.gray100 }]}>
                            <Settings size={18} color={Colors.gray700} />
                        </View>
                        <Text style={styles.quickLinkText}>Paramètres</Text>
                        <ChevronRight size={16} color={Colors.gray300} style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>
                </View>

                {/* Déconnexion */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <LogOut size={18} color={Colors.red} />
                    <Text style={styles.logoutText}>Se déconnecter d'Axioplace</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    profileHeader: {
        width: '100%', paddingBottom: 32,
        overflow: 'hidden',
    },
    headerContent: { alignItems: 'center', paddingTop: 20 },
    avatarWrapper: { marginBottom: 16, position: 'relative' },
    avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: 'rgba(255,255,255,0.4)' },
    avatarPlaceholder: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 4, borderColor: 'rgba(255,255,255,0.4)',
    },
    avatarLetter: { fontSize: 40, fontWeight: '900', color: Colors.white },
    cameraBtn: {
        position: 'absolute', bottom: 0, right: 0,
        width: 34, height: 34, borderRadius: 17,
        overflow: 'hidden',
        borderWidth: 3, borderColor: '#fff',
    },
    cameraBtnGradient: {
        width: '100%', height: '100%',
        alignItems: 'center', justifyContent: 'center',
    },
    profileName: { fontSize: 24, fontWeight: '900', color: Colors.white, marginBottom: 4 },
    profileEmail: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 20 },

    statsRow: {
        flexDirection: 'row', alignItems: 'center', gap: 24,
        backgroundColor: 'rgba(255,255,255,0.18)',
        paddingHorizontal: 28, paddingVertical: 14, borderRadius: 20,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    },
    statBadge: { alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: '900', color: Colors.white },
    statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '700', textTransform: 'uppercase' },
    statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },

    tabs: {
        flexDirection: 'row', backgroundColor: Colors.white,
        paddingHorizontal: 16, paddingVertical: 12, gap: 10,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    tab: {
        flex: 1, borderRadius: 14, overflow: 'hidden',
    },
    tabGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 12,
    },
    tabInner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 12, backgroundColor: Colors.gray50, borderRadius: 14,
    },
    tabLabel: { fontSize: 13, fontWeight: '700', color: Colors.gray400 },
    tabLabelActive: { color: '#1f2937' },

    tabContent: { padding: 20 },

    successBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: Colors.axioVertLight, borderRadius: 14, padding: 14, marginBottom: 20,
        borderWidth: 1, borderColor: '#a7f3d0',
    },
    successText: { fontSize: 14, fontWeight: '700', color: Colors.axioVert },

    fieldGroup: { marginBottom: 20 },
    fieldLabel: { fontSize: 13, fontWeight: '800', color: Colors.gray700, marginBottom: 8, textTransform: 'uppercase' },
    inputRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: Colors.white, borderRadius: 16,
        paddingHorizontal: 16, paddingVertical: 14,
        borderWidth: 1.5, borderColor: Colors.gray100,
    },
    textInput: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' },

    saveBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 10,
        shadowColor: Colors.axioJaune, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
    },
    saveBtnDisabled: { opacity: 0.7 },
    saveBtnGradient: {
        paddingVertical: 16,
        alignItems: 'center', justifyContent: 'center',
    },
    saveBtnText: { fontSize: 15, fontWeight: '800', color: '#1f2937' },

    showPwdBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, alignSelf: 'flex-end' },
    showPwdText: { fontSize: 13, color: Colors.gray400, fontWeight: '700' },

    quickLinks: {
        marginHorizontal: 16, marginTop: 16,
        backgroundColor: Colors.white, borderRadius: 22,
        overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
    },
    quickLink: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingHorizontal: 18, paddingVertical: 16,
        borderBottomWidth: 1, borderBottomColor: Colors.gray50,
    },
    quickLinkIcon: {
        width: 38, height: 38, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    quickLinkText: { fontSize: 15, fontWeight: '700', color: Colors.gray700 },
    notifBadge: {
        borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3,
        marginLeft: 'auto', marginRight: 4,
        minWidth: 24, alignItems: 'center',
    },
    notifBadgeText: { fontSize: 11, fontWeight: '900', color: '#fff' },

    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        marginHorizontal: 16, marginTop: 24, padding: 16,
        borderRadius: 22, borderWidth: 2, borderColor: '#fee2e2',
        backgroundColor: Colors.white,
    },
    logoutText: { fontSize: 15, fontWeight: '800', color: Colors.red },
});
