import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, Image,
    StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, MapPin, Clock, Search, Trash2 } from 'lucide-react-native';
import api from '../lib/api';
import { Colors } from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { getImageUri } from '../utils/images';

export default function FavorisScreen({ navigation }) {
    const { isAuthenticated } = useAuth();
    const [favoris, setFavoris] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchFavoris = useCallback(async () => {
        if (!isAuthenticated) { setLoading(false); return; }
        try {
            const res = await api.get('/favoris');
            setFavoris(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Erreur favoris:', err);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Recharge à chaque fois que l'onglet devient actif
    useFocusEffect(useCallback(() => {
        setLoading(true);
        fetchFavoris();
    }, [fetchFavoris]));

    const removeFavori = async (annonceId) => {
        try {
            await api.post(`/favoris/${annonceId}`);
            setFavoris(prev => prev.filter(ad => ad.id !== annonceId));
        } catch (err) {
            Alert.alert('Erreur', "Impossible de retirer ce favori.");
        }
    };

    if (!isAuthenticated) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.center}>
                    <View style={styles.emptyIconBg}>
                        <Heart size={32} color={Colors.red} fill={Colors.red} />
                    </View>
                    <Text style={styles.emptyTitle}>Connectez-vous</Text>
                    <Text style={styles.emptyText}>pour sauvegarder vos annonces préférées</Text>
                    <TouchableOpacity
                        style={styles.loginBtnWrapper}
                        onPress={() => navigation.navigate('ProfilTab')}
                    >
                        <LinearGradient
                            colors={[Colors.axioJaune, '#f5b800']}
                            style={styles.loginBtnGradient}
                        >
                            <Text style={styles.loginBtnText}>Se connecter</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.axioJaune} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.headerIconBg}>
                        <Heart size={18} color="#fff" fill="#fff" />
                    </View>
                    <Text style={styles.headerTitle}>Mes Favoris</Text>
                </View>
                {favoris.length > 0 && (
                    <View style={styles.headerCount}>
                        <Text style={styles.headerCountText}>{favoris.length}</Text>
                    </View>
                )}
            </View>

            {favoris.length === 0 ? (
                <View style={styles.center}>
                    <View style={styles.emptyIconBg}>
                        <Heart size={32} color={Colors.gray300} />
                    </View>
                    <Text style={styles.emptyTitle}>Aucun favori</Text>
                    <Text style={styles.emptyText}>Parcourez les annonces et ajoutez vos coups de cœur</Text>
                    <TouchableOpacity
                        style={styles.loginBtnWrapper}
                        onPress={() => navigation.navigate('HomeTab')}
                    >
                        <LinearGradient
                            colors={[Colors.axioJaune, '#f5b800']}
                            style={styles.loginBtnGradient}
                        >
                            <Search size={16} color="#1f2937" />
                            <Text style={styles.loginBtnText}>Explorer les annonces</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={favoris}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item: ad }) => {
                        const source = getImageUri(ad.photos?.[0]?.chemin);
                        return (
                            <TouchableOpacity
                                style={styles.card}
                                onPress={() => navigation.navigate('AnnonceDetail', { id: ad.id })}
                                activeOpacity={0.85}
                            >
                                <View style={styles.imgWrapper}>
                                    <Image
                                        source={source}
                                        style={styles.img}
                                        resizeMode="cover"
                                    />
                                    <View style={styles.heartBadge}>
                                        <Heart size={12} color="#fff" fill="#fff" />
                                    </View>
                                </View>
                                <View style={styles.cardBody}>
                                    <Text style={styles.cardTitle} numberOfLines={1}>{ad.titre}</Text>
                                    <View style={styles.cardMeta}>
                                        <MapPin size={11} color={Colors.axioVert} />
                                        <Text style={styles.cardMetaText}>{ad.ville?.nom || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.cardFooter}>
                                        <Text style={styles.cardPrice}>
                                            {ad.prix ? `${Number(ad.prix).toLocaleString('fr-FR')} FCFA` : 'Sur demande'}
                                        </Text>
                                        <TouchableOpacity
                                            style={styles.removeBtn}
                                            onPress={() => removeFavori(ad.id)}
                                        >
                                            <Trash2 size={14} color={Colors.red} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 14,
        backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerIconBg: {
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: Colors.red,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.gray900 },
    headerCount: {
        backgroundColor: Colors.red,
        minWidth: 24, height: 24,
        borderRadius: 12, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 8,
    },
    headerCountText: { color: '#fff', fontSize: 12, fontWeight: '700' },

    emptyIconBg: {
        width: 72, height: 72, borderRadius: 24,
        backgroundColor: '#fef2f2',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.gray700, marginBottom: 8, textAlign: 'center' },
    emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24 },

    loginBtnWrapper: { borderRadius: 14, overflow: 'hidden' },
    loginBtnGradient: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingVertical: 14, paddingHorizontal: 24,
    },
    loginBtnText: { fontSize: 15, fontWeight: '700', color: '#1f2937' },

    list: { padding: 16, gap: 12 },

    card: {
        backgroundColor: Colors.white, borderRadius: 18, flexDirection: 'row',
        overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    imgWrapper: { position: 'relative' },
    img: { width: 110, height: 110 },
    heartBadge: {
        position: 'absolute', top: 8, left: 8,
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: Colors.red,
        alignItems: 'center', justifyContent: 'center',
    },
    cardBody: { flex: 1, padding: 12, justifyContent: 'space-between' },
    cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.gray900 },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    cardMetaText: { fontSize: 12, color: Colors.textSecondary },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardPrice: { fontSize: 15, fontWeight: '800', color: Colors.axioVert },
    removeBtn: {
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: '#fef2f2',
        alignItems: 'center', justifyContent: 'center',
    },
});
