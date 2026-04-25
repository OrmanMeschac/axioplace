import React, { useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, Image,
    StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, MapPin, Calendar, User, Eye } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../lib/api';
import { Colors } from '../constants/Colors';
import { getImageUri } from '../utils/images';

const PLACEHOLDER = require('../../assets/favicon.png');

function AnnonceCard({ ad, onPress }) {
    const source = getImageUri(ad.photos?.[0]?.chemin);
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
            <Image source={source} style={styles.cardImg} resizeMode="cover" />
            {ad.type_offre && (
                <View style={styles.cardBadge}>
                    <Text style={styles.cardBadgeText}>{ad.type_offre}</Text>
                </View>
            )}
            <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>{ad.titre}</Text>
                <Text style={styles.cardPrice}>
                    {ad.prix ? `${Number(ad.prix).toLocaleString('fr-FR')} FCFA` : 'Sur demande'}
                </Text>
                <View style={styles.cardMeta}>
                    <MapPin size={11} color={Colors.gray400} />
                    <Text style={styles.cardMetaText}>{ad.ville?.nom || 'Congo'}</Text>
                    <Eye size={11} color={Colors.gray300} style={{ marginLeft: 8 }} />
                    <Text style={styles.cardMetaText}>{ad.nb_vues ?? 0} vues</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function SellerProfileScreen({ route, navigation }) {
    const { sellerId, sellerName } = route.params;

    const [seller, setSeller] = useState(null);
    const [annonces, setAnnonces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchVendeur = useCallback(async () => {
        if (!sellerId) return;
        try {
            setLoading(true);
            const res = await api.get(`/users/${sellerId}/annonces`);
            setSeller(res.data.user);
            const ads = res.data.annonces?.data || res.data.annonces || [];
            setAnnonces(Array.isArray(ads) ? ads : []);
        } catch (err) {
            console.error('Erreur profil vendeur:', err);
            setError('Impossible de charger le profil de ce vendeur.');
        } finally {
            setLoading(false);
        }
    }, [sellerId]);

    useFocusEffect(useCallback(() => {
        fetchVendeur();
    }, [fetchVendeur]));

    const memberSince = seller?.created_at
        ? new Date(seller.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        : '';

    const renderHeader = () => (
        <>
            {/* Header gradient */}
            <LinearGradient
                colors={[Colors.axioJaune, Colors.axioJauneDark || '#f5b800']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bannerGradient}
            />

            {/* Card profil vendeur */}
            <View style={styles.profileCard}>
                {/* Avatar */}
                {seller?.photo_profil ? (
                    <Image
                        source={getImageUri(seller.photo_profil)}
                        style={styles.avatarImg}
                        defaultSource={PLACEHOLDER}
                    />
                ) : (
                    <LinearGradient
                        colors={[Colors.axioJaune, '#f5b800']}
                        style={styles.avatarGradient}
                    >
                        <Text style={styles.avatarLetter}>
                            {seller?.nom?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                    </LinearGradient>
                )}

                <Text style={styles.sellerName}>{seller?.nom || sellerName || 'Vendeur'}</Text>

                <View style={styles.badgeRow}>
                    {memberSince ? (
                        <View style={styles.badge}>
                            <Calendar size={12} color={Colors.gray500} />
                            <Text style={styles.badgeText}>Membre depuis {memberSince}</Text>
                        </View>
                    ) : null}
                    <View style={[styles.badge, { backgroundColor: Colors.axioVertLight }]}>
                        <User size={12} color={Colors.axioVert} />
                        <Text style={[styles.badgeText, { color: Colors.axioVert }]}>
                            {annonces.length} annonce{annonces.length !== 1 ? 's' : ''}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Section titre */}
            <View style={styles.sectionHeader}>
                <View style={styles.sectionDot} />
                <Text style={styles.sectionTitle}>
                    Ses annonces en ligne
                </Text>
            </View>
        </>
    );

    const renderEmpty = () => (
        <View style={styles.empty}>
            <View style={styles.emptyIcon}>
                <User size={32} color={Colors.gray300} />
            </View>
            <Text style={styles.emptyTitle}>Aucune annonce</Text>
            <Text style={styles.emptyText}>Ce vendeur n'a aucune annonce en ligne pour le moment.</Text>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.headerBar}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft size={22} color={Colors.gray700} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profil vendeur</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.axioJaune} />
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.headerBar}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft size={22} color={Colors.gray700} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profil vendeur</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.center}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* Header nav */}
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={22} color={Colors.gray700} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {seller?.nom || 'Profil vendeur'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={annonces}
                numColumns={2}
                keyExtractor={(item) => String(item.id)}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <AnnonceCard
                        ad={item}
                        onPress={() => navigation.navigate('AnnonceDetail', { id: item.id })}
                    />
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },

    headerBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: Colors.white, paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    backBtn: { padding: 4, width: 40 },
    headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.gray900, flex: 1, textAlign: 'center' },

    bannerGradient: { height: 80 },

    profileCard: {
        backgroundColor: Colors.white,
        marginHorizontal: 16,
        marginTop: -40,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 20,
    },
    avatarImg: {
        width: 80, height: 80, borderRadius: 40,
        borderWidth: 3, borderColor: Colors.axioJaune,
        marginBottom: 12,
    },
    avatarGradient: {
        width: 80, height: 80, borderRadius: 40,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 12,
        borderWidth: 3, borderColor: 'rgba(255,203,48,0.3)',
    },
    avatarLetter: { fontSize: 32, fontWeight: '900', color: '#1f2937' },
    sellerName: { fontSize: 22, fontWeight: '800', color: Colors.gray900, marginBottom: 10 },
    badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
    badge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: Colors.gray100, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    },
    badgeText: { fontSize: 12, fontWeight: '600', color: Colors.gray500 },

    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 20, marginBottom: 12,
    },
    sectionDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.axioJaune },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.gray900 },

    listContent: { paddingBottom: 32 },
    row: { paddingHorizontal: 16, gap: 12, marginBottom: 12 },

    card: {
        flex: 1,
        backgroundColor: Colors.white,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 3,
    },
    cardImg: { width: '100%', height: 120 },
    cardBadge: {
        position: 'absolute', top: 8, left: 8,
        backgroundColor: Colors.axioVert,
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    },
    cardBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700', textTransform: 'capitalize' },
    cardBody: { padding: 10 },
    cardTitle: { fontSize: 12, fontWeight: '700', color: Colors.gray900, marginBottom: 4, lineHeight: 16 },
    cardPrice: { fontSize: 13, fontWeight: '900', color: Colors.axioVert, marginBottom: 6 },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    cardMetaText: { fontSize: 10, color: Colors.gray400 },

    empty: { padding: 40, alignItems: 'center' },
    emptyIcon: {
        width: 72, height: 72, borderRadius: 24,
        backgroundColor: Colors.gray100,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.gray700, marginBottom: 8 },
    emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },

    errorText: { fontSize: 14, color: Colors.red, textAlign: 'center', fontWeight: '600' },
});
