import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity,
    Image, StyleSheet, ActivityIndicator,
    Dimensions, RefreshControl, ImageBackground, Platform, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Search, Bell, MapPin, Home as HomeIcon, Car, Briefcase,
    Wrench, Monitor, LayoutGrid, ChevronRight, ChevronDown,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { Colors } from '../constants/Colors';
import { getImageUri } from '../utils/images';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Icônes par défaut par catégorie (fallback si l'API renvoie des catégories sans icône connue)
const CATEGORY_ICONS = {
    'Immobilier': HomeIcon,
    'Véhicules': Car,
    'Emploi': Briefcase,
    'Services': Wrench,
    'Multimédia': Monitor,
    'Divers': LayoutGrid,
};

// Image du pont — identique à celle de la section Hero du web
const HERO_BG = require('../../assets/hero-bg.jpg');

function AnnonceCard({ ad, onPress }) {
    const source = getImageUri(ad.photos?.[0]?.chemin);
    return (
        <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.85}>
            <View style={styles.cardImgWrapper}>
                <Image source={source} style={styles.cardImg} resizeMode="cover" />
                {ad.type_offre && (
                    <View style={styles.cardTypeBadge}>
                        <Text style={styles.cardTypeBadgeText}>{ad.type_offre.replace('_', ' ')}</Text>
                    </View>
                )}
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>{ad.titre}</Text>
                <Text style={styles.cardPrice}>
                    {ad.prix ? `${Number(ad.prix).toLocaleString('fr-FR')} FCFA` : 'Sur demande'}
                </Text>
                <View style={styles.cardMeta}>
                    <MapPin size={11} color={Colors.gray400} />
                    <Text style={styles.cardMetaText} numberOfLines={1}>{ad.ville?.nom || 'Congo'}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function HomeScreen({ navigation }) {
    const { user, unreadCount, isRinging, setUnreadCount } = useAuth();
    const [searchQ, setSearchQ] = useState('');
    const [selectedCat, setSelectedCat] = useState(null);
    const [recentes, setRecentes] = useState([]);
    const [populaires, setPopulaires] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [avatarError, setAvatarError] = useState(false);

    // Animation pour le scintillement (rebonds)
    const scaleAnim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        if (isRinging) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleAnim, { toValue: 1.25, duration: 150, useNativeDriver: true }),
                    Animated.timing(scaleAnim, { toValue: 0.9, duration: 150, useNativeDriver: true }),
                    Animated.timing(scaleAnim, { toValue: 1.1, duration: 150, useNativeDriver: true }),
                    Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true })
                ])
            ).start();
        } else {
            scaleAnim.stopAnimation();
            scaleAnim.setValue(1);
        }
    }, [isRinging, scaleAnim]);

    // Reset l'erreur d'image quand la photo du profil change
    useEffect(() => {
        if (user) {
            setAvatarError(false);
        }
    }, [user?.photo_profil]);

    const fetchData = useCallback(async () => {
        try {
            const [rec, pop, cats] = await Promise.all([
                api.get('/annonces', { params: { per_page: 6 } }),
                api.get('/annonces', { params: { per_page: 6, tri: 'nb_vues_desc' } }),
                api.get('/categories'),
            ]);
            // Parsing défensif : garantit toujours un tableau
            const toArray = (res) => {
                const d = res?.data;
                if (Array.isArray(d?.data)) return d.data;
                if (Array.isArray(d)) return d;
                return [];
            };
            setRecentes(toArray(rec));
            setPopulaires(toArray(pop));
            setCategories(toArray(cats));
        } catch (err) {
            console.error('Erreur fetch home:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Recharger à chaque fois que l'écran redevient actif
    useFocusEffect(useCallback(() => {
        fetchData();
        // Optionnel : on pourrait refetch unreadCount ici
    }, [fetchData]));

    const handleSearch = () => {
        if (searchQ.trim() || selectedCat) {
            navigation.navigate('Annonces', { q: searchQ, categorie_id: selectedCat });
        }
    };

    const goToDetail = (id) => navigation.navigate('AnnonceDetail', { id });
    const goToAnnonces = (catId = null) => navigation.navigate('Annonces', { categorie_id: catId });

    // Résolution de l'icône pour une catégorie — utilise le mapping local ou LayoutGrid par défaut
    const getCatIcon = (cat) => CATEGORY_ICONS[cat.nom] || LayoutGrid;

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchData(); }}
                        colors={[Colors.axioJaune]}
                        tintColor={Colors.axioJaune}
                    />
                }
            >
                {/* ─── HERO SECTION ─── */}
                <ImageBackground
                    source={HERO_BG}
                    style={styles.hero}
                    resizeMode="cover"
                >
                    {/* Overlay sombre léger */}
                    <View style={styles.heroOverlay} />

                    {/* Header : Logo + Cloche + Avatar */}
                    <SafeAreaView edges={['top']} style={styles.headerSafe}>
                        <View style={styles.header}>
                            {/* Logo */}
                            <View style={styles.logoRow}>
                                <LinearGradient
                                    colors={[Colors.axioJaune, '#f5b800']}
                                    style={styles.logoIcon}
                                >
                                    <Text style={styles.logoLetter}>A</Text>
                                </LinearGradient>
                                <Text style={styles.logoText}>
                                    Axio<Text style={styles.logoAccent}>place</Text>
                                </Text>
                            </View>

                            {/* Actions droite */}
                            <View style={styles.headerActions}>
                                <TouchableOpacity
                                    style={[styles.iconBtn, isRinging && { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: Colors.red, borderWidth: 1 }]}
                                    onPress={() => {
                                        if (setUnreadCount) setUnreadCount(0);
                                        navigation.navigate('MessagesTab');
                                    }}
                                >
                                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                                        <Bell size={20} color={isRinging ? Colors.red : Colors.white} strokeWidth={1.8} />
                                    </Animated.View>
                                    {unreadCount > 0 && <View style={styles.notifDot} />}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.avatarBtn}
                                    onPress={() => navigation.navigate('ProfilTab')}
                                >
                                    {user?.photo_profil && !avatarError ? (
                                        <Image
                                            key={user.photo_profil}
                                            source={getImageUri(user.photo_profil, true)}
                                            style={styles.avatar}
                                            onError={() => setAvatarError(true)}
                                        />
                                    ) : (
                                        <LinearGradient
                                            colors={[Colors.axioJaune, '#f5b800']}
                                            style={styles.avatarPlaceholder}
                                        >
                                            <Text style={styles.avatarLetter}>
                                                {user?.nom?.charAt(0)?.toUpperCase() || 'U'}
                                            </Text>
                                        </LinearGradient>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </SafeAreaView>

                    {/* Hero Content */}
                    <View style={styles.heroContent}>
                        <Text style={styles.heroTitle}>Que recherchez-vous ?</Text>
                        <Text style={styles.heroSub}>
                            Explorez et trouvez des milliers d'annonces{'\n'}près de chez vous
                        </Text>

                        {/* Barre de recherche glassmorphism */}
                        <View style={styles.searchBar}>
                            <View style={styles.searchCatBtn}>
                                <Text style={styles.searchCatText} numberOfLines={1}>
                                    {selectedCat
                                        ? (categories.find(c => c.id === selectedCat)?.nom || 'Catégorie')
                                        : 'Toutes catégories'}
                                </Text>
                                <ChevronDown size={14} color={Colors.gray700} />
                            </View>

                            <View style={styles.searchDivider} />

                            <TextInput
                                style={styles.searchInput}
                                placeholder="Que recherchez-vous ?"
                                placeholderTextColor="rgba(15,23,42,0.45)"
                                value={searchQ}
                                onChangeText={setSearchQ}
                                onSubmitEditing={handleSearch}
                                returnKeyType="search"
                            />

                            <TouchableOpacity onPress={handleSearch} style={styles.searchBtn}>
                                <LinearGradient
                                    colors={[Colors.axioJaune, '#f5b800']}
                                    style={styles.searchBtnGradient}
                                >
                                    <Search size={18} color="#1f2937" strokeWidth={2.5} />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ImageBackground>

                {/* ─── CATÉGORIES dynamiques depuis l'API ─── */}
                {categories.length > 0 && (
                    <View style={styles.catCard}>
                        {categories.slice(0, 6).map((cat) => {
                            const Icon = getCatIcon(cat);
                            const isActive = selectedCat === cat.id;
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[styles.catItem, isActive && styles.catItemActive]}
                                    onPress={() => {
                                        const newCat = isActive ? null : cat.id;
                                        setSelectedCat(newCat);
                                        goToAnnonces(newCat);
                                    }}
                                    activeOpacity={0.75}
                                >
                                    <Icon
                                        size={22}
                                        color={isActive ? Colors.axioJaune : Colors.gray500}
                                        strokeWidth={isActive ? 2.5 : 1.8}
                                    />
                                    <Text style={[styles.catLabel, isActive && styles.catLabelActive]}>
                                        {cat.nom}
                                    </Text>
                                    {isActive && <View style={styles.catUnderline} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Content */}
                <View style={styles.content}>

                    {/* ─── Section Annonces Récentes ─── */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <View style={[styles.sectionDot, { backgroundColor: Colors.red }]} />
                                <Text style={styles.sectionTitle}>Annonces Récentes</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => goToAnnonces()}
                                style={styles.seeAllBtn}
                            >
                                <Text style={styles.seeAllText}>Voir toutes</Text>
                                <ChevronRight size={14} color={Colors.axioVert} />
                            </TouchableOpacity>
                        </View>

                        {loading ? (
                            <ActivityIndicator size="large" color={Colors.axioJaune} style={{ marginVertical: 32 }} />
                        ) : recentes.length === 0 ? (
                            <View style={styles.emptySection}>
                                <Text style={styles.emptySectionText}>Aucune annonce disponible</Text>
                            </View>
                        ) : (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.horList}
                            >
                                {recentes.map(ad => (
                                    <AnnonceCard
                                        key={ad.id}
                                        ad={ad}
                                        onPress={() => goToDetail(ad.id)}
                                    />
                                ))}
                            </ScrollView>
                        )}
                    </View>

                    {/* ─── Section Annonces Populaires ─── */}
                    <View style={[styles.section, { marginBottom: 24 }]}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <View style={[styles.sectionDot, { backgroundColor: Colors.axioJaune }]} />
                                <Text style={styles.sectionTitle}>Annonces Populaires</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => goToAnnonces()}
                                style={styles.seeAllBtn}
                            >
                                <Text style={styles.seeAllText}>Voir toutes</Text>
                                <ChevronRight size={14} color={Colors.axioVert} />
                            </TouchableOpacity>
                        </View>

                        {loading ? (
                            <ActivityIndicator size="large" color={Colors.axioJaune} style={{ marginVertical: 32 }} />
                        ) : populaires.length === 0 ? (
                            <View style={styles.emptySection}>
                                <Text style={styles.emptySectionText}>Aucune annonce disponible</Text>
                            </View>
                        ) : (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.horList}
                            >
                                {populaires.map(ad => (
                                    <AnnonceCard
                                        key={ad.id}
                                        ad={ad}
                                        onPress={() => goToDetail(ad.id)}
                                    />
                                ))}
                            </ScrollView>
                        )}
                    </View>

                    {/* ─── Bannière CTA ─── */}
                    <View style={styles.ctaBanner}>
                        <LinearGradient
                            colors={[Colors.axioVert, Colors.axioVertDark]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.ctaBannerGradient}
                        >
                            <Text style={styles.ctaTitle}>Publiez votre annonce gratuitement</Text>
                            <Text style={styles.ctaSub}>
                                Rejoignez notre communauté et touchez des acheteurs rapidement.
                            </Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('PublierTab')}
                                style={styles.ctaBtn}
                            >
                                <LinearGradient
                                    colors={[Colors.axioJaune, '#f5b800']}
                                    style={styles.ctaBtnGradient}
                                >
                                    <Text style={styles.ctaBtnText}>Publier maintenant — C'est gratuit</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>

                </View>
            </ScrollView>
        </View>
    );
}

const CARD_W = width * 0.58;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    // ── HERO ──
    hero: {
        width: '100%',
        minHeight: 320,
        justifyContent: 'flex-end',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.42)',
    },
    headerSafe: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        zIndex: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    logoIcon: {
        width: 36, height: 36, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
    },
    logoLetter: { color: '#1f2937', fontWeight: '900', fontSize: 18 },
    logoText: { fontSize: 20, fontWeight: '800', color: Colors.white },
    logoAccent: { color: Colors.axioJaune },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconBtn: {
        width: 40, height: 40, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative',
    },
    notifDot: {
        position: 'absolute', top: 8, right: 9,
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: Colors.red,
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
    },
    avatarBtn: {
        width: 40, height: 40, borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
    },
    avatar: { width: 40, height: 40 },
    avatarPlaceholder: {
        width: 40, height: 40,
        alignItems: 'center', justifyContent: 'center',
    },
    avatarLetter: { color: '#1f2937', fontWeight: '700', fontSize: 16 },

    // Hero Content
    heroContent: {
        paddingHorizontal: 20,
        paddingBottom: 36,
        paddingTop: Platform.OS === 'ios' ? 110 : 90,
    },
    heroTitle: {
        fontSize: 30,
        fontWeight: '900',
        color: Colors.white,
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    },
    heroSub: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.88)',
        lineHeight: 22,
        marginBottom: 20,
        fontWeight: '500',
    },
    // Search bar glassmorphism
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.93)',
        borderRadius: 18,
        height: 54,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    searchCatBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        minWidth: 100,
    },
    searchCatText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.gray700,
        maxWidth: 80,
    },
    searchDivider: {
        width: 1,
        height: 24,
        backgroundColor: Colors.gray200,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: Colors.text,
        fontWeight: '500',
        paddingHorizontal: 12,
    },
    searchBtn: {
        width: 50, height: 54,
        overflow: 'hidden',
    },
    searchBtnGradient: {
        width: '100%', height: '100%',
        alignItems: 'center', justifyContent: 'center',
    },

    // ── CATÉGORIES en card blanche ──
    catCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.92)',
        marginHorizontal: 16,
        marginTop: -28,
        borderRadius: 24,
        paddingVertical: 12,
        paddingHorizontal: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
        zIndex: 5,
    },
    catItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 4,
        position: 'relative',
    },
    catItemActive: {},
    catLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.gray500,
        textAlign: 'center',
    },
    catLabelActive: {
        color: Colors.axioJaune,
        fontWeight: '800',
    },
    catUnderline: {
        position: 'absolute',
        bottom: 0,
        width: '60%',
        height: 2,
        backgroundColor: Colors.axioJaune,
        borderRadius: 2,
    },

    // ── CONTENT ──
    content: {
        paddingTop: 24,
    },
    section: {
        marginBottom: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 14,
    },
    sectionTitleRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
    },
    sectionDot: {
        width: 10, height: 10, borderRadius: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.gray900,
    },
    seeAllBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 2,
    },
    seeAllText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.axioVert,
    },
    horList: {
        paddingHorizontal: 20,
        gap: 14,
        paddingBottom: 8,
    },
    emptySection: {
        paddingVertical: 32,
        alignItems: 'center',
    },
    emptySectionText: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '500',
    },

    // ── CARD annonce ──
    card: {
        width: CARD_W,
        backgroundColor: Colors.white,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 4,
    },
    cardImgWrapper: { position: 'relative' },
    cardImg: { width: '100%', height: 140 },
    cardTypeBadge: {
        position: 'absolute', top: 8, left: 8,
        backgroundColor: Colors.axioVert,
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    },
    cardTypeBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700', textTransform: 'capitalize' },
    cardBody: { padding: 12 },
    cardTitle: { fontSize: 13, fontWeight: '700', color: Colors.gray900, marginBottom: 4 },
    cardPrice: { fontSize: 15, fontWeight: '900', color: Colors.axioVert, marginBottom: 6 },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    cardMetaText: { fontSize: 11, color: Colors.gray400, fontWeight: '500', flex: 1 },

    // ── CTA Banner ──
    ctaBanner: {
        marginHorizontal: 16,
        marginBottom: 24,
        borderRadius: 24,
        overflow: 'hidden',
    },
    ctaBannerGradient: {
        padding: 24,
        alignItems: 'center',
    },
    ctaTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.white,
        textAlign: 'center',
        marginBottom: 8,
    },
    ctaSub: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    ctaBtn: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    ctaBtnGradient: {
        paddingVertical: 14,
        paddingHorizontal: 24,
    },
    ctaBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1f2937',
    },
});
