import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, Dimensions,
    Linking, Modal, TextInput, Share, AppState, TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ChevronLeft, Heart, Share2, Phone,
    MapPin, Calendar, Eye, AlertTriangle, CheckCircle2, Send, User,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../lib/api';
import { Colors } from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { getImageUri } from '../utils/images';
import FastImage from '../components/FastImage';

const { width } = Dimensions.get('window');

export default function AnnonceDetailScreen({ route, navigation }) {
    const { id } = route.params;
    const { isAuthenticated, user } = useAuth();
    const insets = useSafeAreaInsets();

    const [annonce, setAnnonce] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFavori, setIsFavori] = useState(false);
    const [currentPhoto, setCurrentPhoto] = useState(0);
    const galleryScrollRef = useRef(null);

    // Modal message
    const [showMessModal, setShowMessModal] = useState(false);
    const [messageContent, setMessageContent] = useState('');
    const [messLoading, setMessLoading] = useState(false);
    const [messSuccess, setMessSuccess] = useState(false);

    // Modal signalement
    const [showSignalModal, setShowSignalModal] = useState(false);
    const [signalMotif, setSignalMotif] = useState('');
    const [signalLoading, setSignalLoading] = useState(false);

    // ─── Chargement initial + polling temps réel (toutes les 10s) ─────────────
    const intervalRef = useRef(null);
    const isMountedRef = useRef(true);
    const appStateRef = useRef(AppState.currentState);

    const fetchAnnonce = useCallback(async () => {
        if (!isMountedRef.current) return;
        try {
            const res = await api.get(`/annonces/${id}`);
            if (isMountedRef.current) {
                setAnnonce(res.data);
                setIsFavori(res.data.is_favori || false);
            }
        } catch {
            if (isMountedRef.current && !annonce) {
                Alert.alert('Erreur', 'Impossible de charger cette annonce.');
            }
        } finally {
            if (isMountedRef.current) setLoading(false);
        }
    }, [id]);

    const stopPolling = () => {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
    // Réduction du polling pour économiser la bande passante en production
    const startPolling = useCallback(() => {
        stopPolling();
        intervalRef.current = setInterval(fetchAnnonce, 30000); // 30s en prod
    }, [fetchAnnonce]);

    // Démarre/coupe le polling selon le focus de l'écran
    useFocusEffect(useCallback(() => {
        isMountedRef.current = true;
        fetchAnnonce();
        startPolling();
        return () => stopPolling();
    }, [fetchAnnonce, startPolling]));

    // Coupe le polling quand l'app passe en arrière-plan
    useEffect(() => {
        const sub = AppState.addEventListener('change', (nextState) => {
            if (appStateRef.current === 'active' && nextState !== 'active') stopPolling();
            else if (appStateRef.current !== 'active' && nextState === 'active') { fetchAnnonce(); startPolling(); }
            appStateRef.current = nextState;
        });
        return () => { sub.remove(); isMountedRef.current = false; stopPolling(); };
    }, [fetchAnnonce, startPolling]);

    const toggleFavori = async () => {
        if (!isAuthenticated) {
            navigation.navigate('ProfilTab');
            return;
        }
        try {
            const res = await api.post(`/favoris/${id}`);
            setIsFavori(res.data.action === 'added');
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendMessage = async () => {
        if (!messageContent.trim()) return;
        setMessLoading(true);
        try {
            await api.post('/messages', {
                destinataire_id: annonce.user.id,
                annonce_id: annonce.id,
                contenu: messageContent,
            });
            setMessSuccess(true);
            setMessageContent('');
        } catch (err) {
            Alert.alert('Erreur', "Impossible d'envoyer le message.");
        } finally {
            setMessLoading(false);
        }
    };

    const handleSignalement = async () => {
        if (!signalMotif.trim()) return;
        setSignalLoading(true);
        try {
            await api.post('/signalements', { annonce_id: annonce.id, motif: signalMotif });
            Alert.alert('Signalement envoyé', 'Merci, notre équipe va examiner cette annonce.');
            setShowSignalModal(false);
            setSignalMotif('');
        } catch (_) {
            Alert.alert('Erreur', 'Impossible d\'envoyer le signalement.');
        } finally {
            setSignalLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.axioJaune} />
            </View>
        );
    }

    if (!annonce) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Annonce introuvable</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLinkBtn}>
                    <Text style={styles.backLinkText}>Retour</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const photos = annonce.photos || [];

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* Header flottant — top adaptatif selon la safe area */}
            <View style={[styles.header, { top: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <ChevronLeft size={22} color={Colors.gray700} />
                </TouchableOpacity>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.headerBtn} onPress={toggleFavori}>
                        <Heart
                            size={20}
                            color={isFavori ? Colors.red : Colors.gray700}
                            fill={isFavori ? Colors.red : 'none'}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerBtn}
                        onPress={() => Share.share({
                            title: annonce.titre,
                            message: `${annonce.titre} — ${annonce.prix ? Number(annonce.prix).toLocaleString('fr-FR') + ' FCFA' : 'Sur demande'} à ${annonce.ville?.nom || 'Congo'}`,
                        })}
                    >
                        <Share2 size={20} color={Colors.gray700} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Galerie photos — swipe natif + boutons gauche/droite */}
                <View style={styles.gallery}>
                    <ScrollView
                        ref={galleryScrollRef}
                        horizontal pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => {
                            setCurrentPhoto(Math.round(e.nativeEvent.contentOffset.x / width));
                        }}
                    >
                        {photos.length > 0 ? photos.map((p, i) => (
                        <FastImage
                            key={i}
                            source={getImageUri(p.chemin)}
                            style={styles.galleryImg}
                            contentFit="cover"
                            priority={i === 0 ? 'high' : 'normal'}
                        />
                    )) : (
                            <View style={[styles.galleryImg, styles.galleryPlaceholder]}>
                                <Text style={{ fontSize: 50 }}>📷</Text>
                                <Text style={styles.noPhotoText}>Aucune photo</Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Bouton précédent */}
                    {photos.length > 1 && currentPhoto > 0 && (
                        <TouchableOpacity
                            style={styles.galleryNavLeft}
                            onPress={() => {
                                const next = currentPhoto - 1;
                                galleryScrollRef.current?.scrollTo({ x: next * width, animated: true });
                                setCurrentPhoto(next);
                            }}
                        >
                            <ChevronLeft size={22} color="#fff" strokeWidth={2.5} />
                        </TouchableOpacity>
                    )}

                    {/* Bouton suivant */}
                    {photos.length > 1 && currentPhoto < photos.length - 1 && (
                        <TouchableOpacity
                            style={styles.galleryNavRight}
                            onPress={() => {
                                const next = currentPhoto + 1;
                                galleryScrollRef.current?.scrollTo({ x: next * width, animated: true });
                                setCurrentPhoto(next);
                            }}
                        >
                            <ChevronLeft size={22} color="#fff" strokeWidth={2.5} style={{ transform: [{ rotate: '180deg' }] }} />
                        </TouchableOpacity>
                    )}

                    {/* Dots indicateur */}
                    {photos.length > 1 && (
                        <View style={styles.photoDots}>
                            {photos.map((_, i) => (
                                <View key={i} style={[styles.dot, i === currentPhoto && styles.dotActive]} />
                            ))}
                        </View>
                    )}
                    {photos.length > 0 && (
                        <View style={styles.photoCounter}>
                            <Text style={styles.photoCounterText}>{currentPhoto + 1}/{photos.length}</Text>
                        </View>
                    )}
                </View>

                {/* Infos principales */}
                <View style={styles.section}>
                    <View style={styles.titleRow}>
                        <Text style={styles.titleText}>{annonce.titre}</Text>
                        {annonce.type_offre && (
                            <LinearGradient
                                colors={[Colors.axioVert, Colors.axioVertDark]}
                                style={styles.typeBadge}
                            >
                                <Text style={styles.typeBadgeText}>{annonce.type_offre.replace('_', ' ')}</Text>
                            </LinearGradient>
                        )}
                    </View>

                    <Text style={styles.priceText}>
                        {annonce.prix ? `${Number(annonce.prix).toLocaleString('fr-FR')} FCFA` : 'Sur demande'}
                    </Text>

                    <View style={styles.metaRow}>
                        <View style={styles.metaChip}>
                            <MapPin size={13} color={Colors.axioVert} />
                            <Text style={styles.metaChipText}>{annonce.ville?.nom || 'N/A'}</Text>
                        </View>
                        <View style={styles.metaChip}>
                            <Calendar size={13} color={Colors.gray400} />
                            <Text style={styles.metaChipText}>
                                {new Date(annonce.created_at).toLocaleDateString('fr-FR')}
                            </Text>
                        </View>
                        <View style={styles.metaChip}>
                            <Eye size={13} color={Colors.gray400} />
                            <Text style={styles.metaChipText}>{annonce.nb_vues} vues</Text>
                        </View>
                    </View>

                    {(annonce.surface || annonce.nb_pieces) && (
                        <View style={styles.specsRow}>
                            {annonce.surface && (
                                <View style={styles.specChip}>
                                    <Text style={styles.specText}>{annonce.surface} m²</Text>
                                </View>
                            )}
                            {annonce.nb_pieces && (
                                <View style={styles.specChip}>
                                    <Text style={styles.specText}>{annonce.nb_pieces} pièce{annonce.nb_pieces > 1 ? 's' : ''}</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.descText}>{annonce.description}</Text>
                </View>

                {/* Vendeur — cliquable pour voir son profil */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>À propos du vendeur</Text>
                    <TouchableOpacity
                        style={styles.sellerCard}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('SellerProfile', {
                            sellerId: annonce.user?.id,
                            sellerName: annonce.user?.nom,
                        })}
                    >
                        {/* Avatar : photo de profil ou initiale */}
                        {annonce.user?.photo_profil ? (
                            <FastImage
                                source={getImageUri(annonce.user.photo_profil)}
                                style={styles.sellerAvatarImg}
                                contentFit="cover"
                            />
                        ) : (
                            <LinearGradient
                                colors={[Colors.axioJaune, '#f5b800']}
                                style={styles.sellerAvatar}
                            >
                                <Text style={styles.sellerAvatarLetter}>
                                    {annonce.user?.nom?.charAt(0)?.toUpperCase() || 'U'}
                                </Text>
                            </LinearGradient>
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.sellerName}>{annonce.user?.nom || 'Vendeur'}</Text>
                            <Text style={styles.sellerSub}>Membre Axioplace</Text>
                        </View>
                        {/* Bouton "Voir le profil" */}
                        <View style={styles.sellerProfileBtn}>
                            <User size={14} color={Colors.axioVert} />
                            <Text style={styles.sellerProfileBtnText}>Voir le profil</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Signaler */}
                <View style={styles.reportRow}>
                    <TouchableOpacity
                        style={styles.reportBtn}
                        onPress={() => isAuthenticated ? setShowSignalModal(true) : navigation.navigate('ProfilTab')}
                    >
                        <AlertTriangle size={14} color={Colors.red} />
                        <Text style={styles.reportText}>Signaler cette annonce</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* CTA flottant en bas — paddingBottom adapté à la safe area */}
            <View style={[styles.cta, { paddingBottom: Math.max(insets.bottom, 14) }]}>
                {annonce.user?.telephone && annonce.telephone_visible && (
                    <TouchableOpacity
                        style={styles.ctaPhone}
                        onPress={() => Linking.openURL(`tel:${annonce.user.telephone}`)}
                    >
                        <LinearGradient
                            colors={[Colors.axioJaune, '#f5b800']}
                            style={styles.ctaPhoneGradient}
                        >
                            <Phone size={18} color="#1f2937" strokeWidth={2.5} />
                            <Text style={styles.ctaPhoneText}>Appeler</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={styles.ctaMsg}
                    onPress={() => isAuthenticated ? setShowMessModal(true) : navigation.navigate('ProfilTab')}
                >
                    <LinearGradient
                        colors={[Colors.axioVert, Colors.axioVertDark]}
                        style={styles.ctaMsgGradient}
                    >
                        <Send size={16} color="#fff" strokeWidth={2.5} />
                        <Text style={styles.ctaMsgText}>Envoyer un message</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Modal Message */}
            <Modal visible={showMessModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        {messSuccess ? (
                            <View style={styles.successContainer}>
                                <CheckCircle2 size={56} color={Colors.axioVert} />
                                <Text style={styles.successTitle}>Message envoyé !</Text>
                                <Text style={styles.successSub}>Retrouvez la discussion dans votre messagerie.</Text>
                                <TouchableOpacity
                                    style={styles.successBtn}
                                    onPress={() => { setShowMessModal(false); setMessSuccess(false); }}
                                >
                                    <LinearGradient
                                        colors={[Colors.axioJaune, '#f5b800']}
                                        style={styles.successBtnGradient}
                                    >
                                        <Text style={styles.successBtnText}>Fermer</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <Text style={styles.modalTitle}>Envoyer un message</Text>
                                <Text style={styles.modalSub}>Contactez le vendeur concernant son annonce.</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Bonjour, je suis intéressé(e)..."
                                    placeholderTextColor={Colors.gray400}
                                    multiline numberOfLines={4}
                                    value={messageContent}
                                    onChangeText={setMessageContent}
                                    textAlignVertical="top"
                                />
                                <View style={styles.modalBtns}>
                                    <TouchableOpacity
                                        style={styles.modalCancel}
                                        onPress={() => setShowMessModal(false)}
                                    >
                                        <Text style={styles.modalCancelText}>Annuler</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalSend, (!messageContent.trim() || messLoading) && styles.modalSendDisabled]}
                                        onPress={handleSendMessage}
                                        disabled={!messageContent.trim() || messLoading}
                                    >
                                        <LinearGradient
                                            colors={[Colors.axioJaune, '#f5b800']}
                                            style={styles.modalSendGradient}
                                        >
                                            {messLoading ? (
                                                <ActivityIndicator size="small" color="#1f2937" />
                                            ) : (
                                                <Text style={styles.modalSendText}>Envoyer</Text>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Modal Signalement */}
            <Modal visible={showSignalModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Signaler cette annonce</Text>
                        <Text style={styles.modalSub}>Décrivez le problème rencontré.</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="ex: Annonce frauduleuse, photos volées..."
                            placeholderTextColor={Colors.gray400}
                            multiline numberOfLines={4}
                            value={signalMotif}
                            onChangeText={setSignalMotif}
                            textAlignVertical="top"
                        />
                        <View style={styles.modalBtns}>
                            <TouchableOpacity
                                style={styles.modalCancel}
                                onPress={() => setShowSignalModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalSend, (!signalMotif.trim() || signalLoading) && { opacity: 0.6 }]}
                                onPress={handleSignalement}
                                disabled={!signalMotif.trim() || signalLoading}
                            >
                                <LinearGradient
                                    colors={[Colors.red, '#dc2626']}
                                    style={styles.modalSendGradient}
                                >
                                    <Text style={[styles.modalSendText, { color: '#fff' }]}>Signaler</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
    scroll: { flex: 1 },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        position: 'absolute', left: 0, right: 0, zIndex: 10,
        paddingHorizontal: 16,
    },
    headerBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.95)',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12, shadowRadius: 6, elevation: 6,
    },
    headerRight: { flexDirection: 'row', gap: 8 },

    gallery: { width, height: 300, position: 'relative' },
    galleryImg: { width, height: 300 },
    galleryPlaceholder: { backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center' },
    noPhotoText: { fontSize: 14, color: Colors.gray400, marginTop: 8 },

    galleryNavLeft: {
        position: 'absolute', left: 10, top: '50%', marginTop: -22,
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.38)',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 10,
    },
    galleryNavRight: {
        position: 'absolute', right: 10, top: '50%', marginTop: -22,
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.38)',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 10,
    },
    photoDots: {
        position: 'absolute', bottom: 14, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'center', gap: 6,
    },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
    dotActive: { backgroundColor: Colors.white, width: 22, borderRadius: 6 },
    photoCounter: {
        position: 'absolute', bottom: 14, right: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
    },
    photoCounterText: { color: '#fff', fontSize: 11, fontWeight: '700' },

    section: {
        backgroundColor: Colors.white, marginHorizontal: 16, marginTop: 12,
        borderRadius: 20, padding: 18,
        borderWidth: 1, borderColor: Colors.border,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
    },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.gray900, marginBottom: 12 },

    titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
    titleText: { fontSize: 20, fontWeight: '800', color: Colors.gray900, flex: 1 },
    typeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    typeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },

    priceText: { fontSize: 24, fontWeight: '900', color: Colors.axioVert, marginBottom: 12 },

    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    metaChip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: Colors.gray50, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    },
    metaChipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },

    specsRow: { flexDirection: 'row', gap: 8 },
    specChip: { backgroundColor: Colors.axioJauneLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    specText: { fontSize: 12, fontWeight: '700', color: Colors.gray700 },

    descText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

    sellerCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    sellerAvatar: {
        width: 50, height: 50, borderRadius: 25,
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    sellerAvatarImg: {
        width: 50, height: 50, borderRadius: 25,
        flexShrink: 0, overflow: 'hidden',
        backgroundColor: Colors.gray100,
    },
    sellerAvatarLetter: { fontSize: 22, fontWeight: '800', color: '#1f2937' },
    sellerName: { fontSize: 16, fontWeight: '700', color: Colors.gray900 },
    sellerSub: { fontSize: 12, color: Colors.textSecondary },
    sellerProfileBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: Colors.axioVertLight,
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    },
    sellerProfileBtnText: { fontSize: 11, fontWeight: '700', color: Colors.axioVert },

    reportRow: { alignItems: 'center', marginTop: 14 },
    reportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10 },
    reportText: { fontSize: 13, color: Colors.red, fontWeight: '600' },

    // CTA — paddingBottom dynamique géré inline via insets.bottom
    cta: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: Colors.white, flexDirection: 'row', gap: 10,
        paddingHorizontal: 16, paddingVertical: 14,
        borderTopWidth: 1, borderTopColor: Colors.border,
        shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08, shadowRadius: 10, elevation: 12,
    },
    ctaPhone: {
        borderRadius: 14, overflow: 'hidden',
    },
    ctaPhoneGradient: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingVertical: 14, paddingHorizontal: 18,
    },
    ctaPhoneText: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
    ctaMsg: {
        flex: 1, borderRadius: 14, overflow: 'hidden',
    },
    ctaMsgGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 14,
    },
    ctaMsgText: { fontSize: 14, fontWeight: '700', color: '#fff' },

    // Modals
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 24, paddingBottom: 40,
    },
    modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.gray900, marginBottom: 6 },
    modalSub: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16 },
    modalInput: {
        backgroundColor: Colors.gray50, borderRadius: 14, paddingHorizontal: 14,
        paddingVertical: 12, fontSize: 14, color: Colors.text,
        minHeight: 120, marginBottom: 16,
        borderWidth: 1, borderColor: Colors.gray100,
    },
    modalBtns: { flexDirection: 'row', gap: 10 },
    modalCancel: {
        flex: 1, borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
        paddingVertical: 14, alignItems: 'center',
    },
    modalCancelText: { fontSize: 14, fontWeight: '600', color: Colors.gray700 },
    modalSend: {
        flex: 1, borderRadius: 14, overflow: 'hidden',
    },
    modalSendDisabled: { opacity: 0.5 },
    modalSendGradient: {
        paddingVertical: 14, alignItems: 'center',
    },
    modalSendText: { fontSize: 14, fontWeight: '700', color: '#1f2937' },

    // Success
    successContainer: { alignItems: 'center', paddingVertical: 20 },
    successTitle: { fontSize: 22, fontWeight: '800', color: Colors.gray900, marginTop: 16, marginBottom: 8 },
    successSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24 },
    successBtn: { borderRadius: 14, overflow: 'hidden' },
    successBtnGradient: { paddingVertical: 14, paddingHorizontal: 40 },
    successBtnText: { fontSize: 15, fontWeight: '700', color: '#1f2937' },

    errorText: { fontSize: 18, fontWeight: '700', color: Colors.gray700, marginBottom: 16 },
    backLinkBtn: { padding: 12 },
    backLinkText: { color: Colors.axioVert, fontWeight: '600' },
});
