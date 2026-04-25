import React, { useState, useEffect, useCallback, memo } from 'react';
import {
    View, Text, FlatList, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal, MapPin, Clock, X, ChevronLeft, Trash2, Eye, Edit3 } from 'lucide-react-native';
import api from '../lib/api';
import { Colors } from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { getImageUri } from '../utils/images';
import { useFocusEffect } from '@react-navigation/native';
import FastImage from '../components/FastImage';

// memo() évite de re-rendre les cards qui n'ont pas changé
const AnnonceCard = memo(function AnnonceCard({ ad, onPress, isOwner, onDelete, onEdit }) {
    const source = getImageUri(ad.photos?.[0]?.chemin);

    return (
        <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.85}>
            <View style={styles.imgWrapper}>
                <FastImage
                    source={source}
                    style={styles.img}
                    contentFit="cover"
                    priority="normal"
                />
                {ad.type_offre && (
                    <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{ad.type_offre.replace('_', ' ')}</Text>
                    </View>
                )}
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1} maxFontSizeMultiplier={1.2}>{ad.titre}</Text>
                <View style={styles.cardMeta}>
                    <MapPin size={12} color={Colors.gray400} />
                    <Text style={styles.cardMetaText} maxFontSizeMultiplier={1.2}>{ad.ville?.nom || 'Non spécifié'}</Text>
                    {ad.categorie && (
                        <View style={styles.catBadge}>
                            <Text style={styles.catBadgeText} maxFontSizeMultiplier={1.1}>{ad.categorie.nom}</Text>
                        </View>
                    )}
                </View>
                {ad.description && (
                    <Text style={styles.cardDesc} numberOfLines={2} maxFontSizeMultiplier={1.2}>{ad.description}</Text>
                )}
                <View style={styles.cardFooter}>
                    <Text style={styles.cardPrice} maxFontSizeMultiplier={1.2}>
                        {ad.prix ? `${Number(ad.prix).toLocaleString('fr-FR')} FCFA` : 'Sur demande'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} color={Colors.gray400} />
                        <Text style={styles.cardDate} maxFontSizeMultiplier={1.1}>
                            {new Date(ad.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        </Text>
                    </View>
                </View>
                {isOwner && (
                    <View style={styles.ownerActions}>
                        <TouchableOpacity style={styles.ownerBtn} onPress={onPress}>
                            <Eye size={16} color={Colors.gray500} />
                            <Text style={styles.ownerBtnText}>Voir</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.ownerBtn} onPress={onEdit}>
                            <Edit3 size={16} color={Colors.axioJaune} />
                            <Text style={[styles.ownerBtnText, { color: Colors.axioJaune }]}>Modifier</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.ownerBtn, styles.ownerBtnDelete]} onPress={onDelete}>
                            <Trash2 size={16} color={Colors.red} />
                            <Text style={[styles.ownerBtnText, { color: Colors.red }]}>Supprimer</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
});

export default function AnnoncesScreen({ route, navigation }) {
    const { isAuthenticated } = useAuth();
    const [annonces, setAnnonces] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [searchQ, setSearchQ] = useState(route.params?.q || '');
    const [catId, setCatId] = useState(route.params?.categorie_id ? String(route.params.categorie_id) : '');
    const [showFilters, setShowFilters] = useState(false);
    const [prixMin, setPrixMin] = useState('');
    const [prixMax, setPrixMax] = useState('');
    const mesAnnonces = route.params?.mes_annonces === true;

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories([{ id: '', nom: 'Toutes' }, ...res.data]);
        } catch (_) {}
    };

    const fetchAnnonces = useCallback(async (pageNum = 1, reset = true) => {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const params = { page: pageNum, per_page: 15 };
            if (searchQ) params.q = searchQ;
            if (catId) params.categorie_id = catId;
            if (prixMin) params.prix_min = prixMin;
            if (prixMax) params.prix_max = prixMax;

            // Route /mes-annonces si on vient du profil
            const endpoint = route.params?.mes_annonces ? '/mes-annonces' : '/annonces';
            const res = await api.get(endpoint, { params });
            const data = res.data.data || res.data || [];
            const total = res.data.last_page || 1;

            setAnnonces(prev => reset ? data : [...prev, ...data]);
            setHasMore(pageNum < total);
            setPage(pageNum);
        } catch (err) {
            console.error('Erreur annonces:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [searchQ, catId, prixMin, prixMax]);

    useEffect(() => {
        fetchCategories();
        fetchAnnonces(1, true);
    }, [fetchAnnonces]);

    // Recharger à chaque fois que la liste des annonces reprend le focus
    useFocusEffect(useCallback(() => {
        fetchAnnonces(1, true);
    }, [fetchAnnonces]));

    const loadMore = () => {
        if (!loadingMore && hasMore) fetchAnnonces(page + 1, false);
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Supprimer l\'annonce',
            'Êtes-vous sûr de vouloir supprimer cette annonce ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer', style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/annonces/${id}`);
                            setAnnonces(prev => prev.filter(ad => ad.id !== id));
                        } catch (err) {
                            Alert.alert('Erreur', 'Impossible de supprimer cette annonce.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* Header sticky */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={22} color={Colors.gray700} />
                </TouchableOpacity>
                <View style={styles.searchBar}>
                    <Search size={16} color={Colors.gray400} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={route.params?.mes_annonces ? 'Rechercher dans mes annonces...' : 'Rechercher...'}
                        placeholderTextColor={Colors.gray400}
                        value={searchQ}
                        onChangeText={setSearchQ}
                        onSubmitEditing={() => fetchAnnonces(1, true)}
                        returnKeyType="search"
                    />
                    {searchQ ? (
                        <TouchableOpacity onPress={() => { setSearchQ(''); }}>
                            <X size={16} color={Colors.gray400} />
                        </TouchableOpacity>
                    ) : null}
                </View>
                <TouchableOpacity
                    style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
                    onPress={() => setShowFilters(v => !v)}
                >
                    <SlidersHorizontal size={18} color={showFilters ? '#1f2937' : Colors.gray700} />
                </TouchableOpacity>
            </View>

            {/* Pills catégories */}
            <FlatList
                horizontal
                data={categories}
                keyExtractor={(item) => String(item.id)}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.catContainer}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.catPill, catId === String(item.id) && styles.catPillActive]}
                        onPress={() => setCatId(catId === String(item.id) ? '' : String(item.id))}
                    >
                        <Text style={[styles.catLabel, catId === String(item.id) && styles.catLabelActive]}>
                            {item.nom}
                        </Text>
                    </TouchableOpacity>
                )}
                style={styles.catList}
            />

            {/* Filtres avancés */}
            {showFilters && (
                <View style={styles.filtersPanel}>
                    <View style={styles.filterRow}>
                        <TextInput
                            style={styles.filterInput}
                            placeholder="Prix min (FCFA)"
                            placeholderTextColor={Colors.gray400}
                            value={prixMin}
                            onChangeText={setPrixMin}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.filterInput}
                            placeholder="Prix max (FCFA)"
                            placeholderTextColor={Colors.gray400}
                            value={prixMax}
                            onChangeText={setPrixMax}
                            keyboardType="numeric"
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.applyBtn}
                        onPress={() => { fetchAnnonces(1, true); setShowFilters(false); }}
                    >
                        <Text style={styles.applyBtnText}>Appliquer les filtres</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Résultats */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.axioJaune} />
                </View>
            ) : (
                <FlatList
                    data={annonces}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => (
                        <AnnonceCard
                            ad={item}
                            isOwner={mesAnnonces}
                            onPress={() => navigation.navigate('AnnonceDetail', { id: item.id })}
                            onDelete={() => handleDelete(item.id)}
                            onEdit={() => navigation.navigate('EditerAnnonce', { id: item.id })}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    // ── Optimisations performance FlatList ──
                    initialNumToRender={8}
                    maxToRenderPerBatch={6}
                    windowSize={5}
                    removeClippedSubviews={Platform.OS === 'android'}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.4}
                    ListFooterComponent={
                        loadingMore ? (
                            <ActivityIndicator size="small" color={Colors.axioJaune} style={{ marginVertical: 16 }} />
                        ) : null
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={{ fontSize: 48, marginBottom: 12 }}>🔍</Text>
                            <Text style={styles.emptyTitle}>Aucune annonce trouvée</Text>
                            <Text style={styles.emptyText}>Essayez de modifier vos filtres</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    header: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: Colors.white,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    backBtn: { padding: 4 },
    searchBar: {
        flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: Colors.gray100, borderRadius: 12,
        paddingHorizontal: 12, paddingVertical: 10,
    },
    searchInput: { flex: 1, fontSize: 14, color: Colors.text },
    filterBtn: {
        width: 42, height: 42, borderRadius: 12,
        backgroundColor: Colors.gray100,
        alignItems: 'center', justifyContent: 'center',
    },
    filterBtnActive: { backgroundColor: Colors.axioJaune },

    catList: { backgroundColor: Colors.white, maxHeight: 52 },
    catContainer: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
    catPill: {
        paddingHorizontal: 14, paddingVertical: 6,
        backgroundColor: Colors.gray100, borderRadius: 20,
    },
    catPillActive: { backgroundColor: Colors.axioJaune },
    catLabel: { fontSize: 12, fontWeight: '600', color: Colors.gray500 },
    catLabelActive: { color: '#1f2937', fontWeight: '700' },

    filtersPanel: {
        backgroundColor: Colors.white, padding: 16,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    filterRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    filterInput: {
        flex: 1, backgroundColor: Colors.gray100,
        borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
        fontSize: 13, color: Colors.text,
    },
    applyBtn: {
        backgroundColor: Colors.axioJaune, borderRadius: 12,
        paddingVertical: 12, alignItems: 'center',
    },
    applyBtnText: { fontSize: 14, fontWeight: '700', color: '#1f2937' },

    listContent: { padding: 16, gap: 14 },

    card: {
        backgroundColor: Colors.white, borderRadius: 18,
        overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    imgWrapper: { position: 'relative' },
    img: { width: '100%', height: 180 },
    imgPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.gray100 },
    typeBadge: {
        position: 'absolute', bottom: 10, left: 10,
        backgroundColor: Colors.axioVert,
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    },
    typeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },

    cardBody: { padding: 14 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.gray900, marginBottom: 6 },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
    cardMetaText: { fontSize: 12, color: Colors.gray400, flex: 1 },
    catBadge: { backgroundColor: Colors.gray100, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    catBadgeText: { fontSize: 10, color: Colors.gray500, fontWeight: '600' },
    cardDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 10 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.gray100, paddingTop: 10 },
    cardPrice: { fontSize: 17, fontWeight: '800', color: Colors.gray900 },
    cardDate: { fontSize: 11, color: Colors.gray400 },

    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.gray700, marginBottom: 8 },
    emptyText: { fontSize: 14, color: Colors.textSecondary },

    ownerActions: {
        flexDirection: 'row', gap: 10, marginTop: 12, borderTopWidth: 1, borderTopColor: Colors.gray100, paddingTop: 10
    },
    ownerBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 8, backgroundColor: Colors.gray100, borderRadius: 10,
    },
    ownerBtnDelete: {
        backgroundColor: 'rgba(239,68,68,0.1)',
    },
    ownerBtnText: {
        fontSize: 13, fontWeight: '600', color: Colors.gray700
    },
});
