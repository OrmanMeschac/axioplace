import React, { useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageSquare, ShieldCheck } from 'lucide-react-native';
import api from '../lib/api';
import { Colors } from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { getImageUri } from '../utils/images';
import FastImage from '../components/FastImage';

export default function MessagesScreen({ navigation }) {
    const { isAuthenticated, user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchConversations = useCallback(async () => {
        if (!isAuthenticated) { setLoading(false); return; }
        try {
            const res = await api.get('/conversations');
            setConversations(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useFocusEffect(useCallback(() => {
        setLoading(true);
        fetchConversations();
    }, [fetchConversations]));

    const unreadCount = conversations.filter(c => !c.lu && String(c.destinataire_id) === String(user?.id)).length;

    if (!isAuthenticated) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <View style={styles.headerIconBg}>
                        <MessageSquare size={16} color="#fff" />
                    </View>
                    <Text style={styles.headerTitle}>Messages</Text>
                </View>
                <View style={styles.center}>
                    <View style={styles.emptyIconBg}>
                        <MessageSquare size={32} color={Colors.axioJaune} />
                    </View>
                    <Text style={styles.emptyTitle}>Connectez-vous</Text>
                    <Text style={styles.emptyText}>pour accéder à vos messages</Text>
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

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
                <View style={styles.headerIconBg}>
                    <MessageSquare size={16} color="#fff" />
                </View>
                <Text style={styles.headerTitle}>Messages</Text>
                {unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{unreadCount}</Text>
                    </View>
                )}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.axioJaune} />
                </View>
            ) : conversations.length === 0 ? (
                <View style={styles.center}>
                    <View style={styles.emptyIconBg}>
                        <MessageSquare size={32} color={Colors.gray300} />
                    </View>
                    <Text style={styles.emptyTitle}>Aucune conversation</Text>
                    <Text style={styles.emptyText}>
                        Contactez un vendeur depuis une annonce pour démarrer une discussion
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item: conv }) => {
                        const interlocuteur = conv.expediteur_id === user?.id
                            ? conv.destinataire
                            : conv.expediteur;
                        const isUnread = !conv.lu && String(conv.destinataire_id) === String(user?.id);
                        // Détection d'un message admin : pas d'annonce associée
                        const isAdmin = !conv.annonce_id && !conv.annonce;

                        return (
                            <TouchableOpacity
                                style={[
                                    styles.convCard,
                                    isUnread && styles.convCardUnread,
                                    isAdmin && styles.convCardAdmin,
                                ]}
                                onPress={() => navigation.navigate('Chat', { conv })}
                                activeOpacity={0.8}
                            >
                                {/* Avatar : photo de profil ou lettre initiale */}
                        {/* Avatar simplifié */}
                        {isAdmin ? (
                            // Avatar spécial admin doré
                            <LinearGradient
                                colors={['#fbbf24', '#f59e0b']}
                                style={[styles.convAvatar, styles.adminAvatar]}
                            >
                                <ShieldCheck size={20} color="#1e1b4b" strokeWidth={2.5} />
                            </LinearGradient>
                        ) : interlocuteur?.photo_profil ? (
                            <FastImage
                                source={getImageUri(interlocuteur.photo_profil)}
                                style={[styles.convAvatar, styles.convAvatarImg]}
                                contentFit="cover"
                            />
                        ) : (
                            <LinearGradient
                                colors={isUnread ? [Colors.axioJaune, '#f5b800'] : ['#e2e8f0', '#cbd5e1']}
                                style={styles.convAvatar}
                            >
                                <Text style={[styles.convAvatarLetter, !isUnread && { color: Colors.gray600 }]}>
                                    {interlocuteur?.nom?.charAt(0)?.toUpperCase() || 'A'}
                                </Text>
                            </LinearGradient>
                        )}
                        {/* Contenu */}
                        <View style={styles.convContent}>
                            <View style={styles.convTop}>
                                {isAdmin ? (
                                    <View style={styles.adminNameRow}>
                                        <Text style={styles.adminConvName}>Administration Axioplace</Text>
                                        <ShieldCheck size={11} color="#fbbf24" strokeWidth={2.5} />
                                    </View>
                                ) : (
                                    <Text style={[styles.convName, isUnread && styles.convNameUnread]}>
                                        {interlocuteur?.nom || 'Utilisateur'}
                                    </Text>
                                )}
                                {isUnread && <View style={[styles.unreadDot, isAdmin && { backgroundColor: '#fbbf24' }]} />}
                            </View>
                            {conv.annonce ? (
                                <Text style={styles.convAnnonce} numberOfLines={1}>{conv.annonce.titre}</Text>
                            ) : (
                                <Text style={styles.adminTypeBadge}>📢 Message officiel</Text>
                            )}
                            <Text
                                style={[styles.convLastMsg, isUnread && styles.convLastMsgUnread]}
                                numberOfLines={1}
                            >
                                {String(conv.expediteur_id) === String(user?.id) ? 'Vous : ' : ''}
                                {conv.contenu}
                            </Text>
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
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 20, paddingVertical: 14,
        backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    headerIconBg: {
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: Colors.axioJaune,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.gray900, flex: 1 },
    unreadBadge: {
        backgroundColor: Colors.red, minWidth: 22, height: 22,
        borderRadius: 11, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 6,
    },
    unreadText: { color: '#fff', fontSize: 12, fontWeight: '700' },

    emptyIconBg: {
        width: 72, height: 72, borderRadius: 24,
        backgroundColor: Colors.axioJauneLight,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.gray700, marginBottom: 8, textAlign: 'center' },
    emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 },

    loginBtnWrapper: { borderRadius: 14, overflow: 'hidden' },
    loginBtnGradient: {
        paddingVertical: 14, paddingHorizontal: 28,
    },
    loginBtnText: { fontSize: 15, fontWeight: '700', color: '#1f2937' },

    list: { padding: 16, gap: 10 },

    convCard: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: Colors.white, borderRadius: 18,
        padding: 14, borderWidth: 1, borderColor: Colors.border,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
    },
    convCardUnread: { borderColor: Colors.axioJaune, backgroundColor: Colors.axioJauneLight },

    convAvatar: {
        width: 48, height: 48, borderRadius: 16,
        backgroundColor: Colors.gray100,
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    convAvatarImg: {
        overflow: 'hidden',
    },
    convAvatarLetter: { fontSize: 20, fontWeight: '800', color: Colors.gray700 },

    convContent: { flex: 1 },
    convTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
    convName: { fontSize: 15, fontWeight: '600', color: Colors.gray700 },
    convNameUnread: { fontWeight: '800', color: Colors.gray900 },
    unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.red },
    convAnnonce: { fontSize: 11, color: Colors.axioVert, fontWeight: '600', marginBottom: 2 },
    convLastMsg: { fontSize: 13, color: Colors.textSecondary },
    convLastMsgUnread: { fontWeight: '600', color: Colors.gray900 },

    // Carte admin
    convCardAdmin: {
        borderColor: 'rgba(251,191,36,0.6)',
        backgroundColor: '#1e1b4b',
        shadowColor: '#6366f1',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    adminAvatar: {
        shadowColor: '#fbbf24',
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 4,
    },
    adminNameRow: {
        flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1,
    },
    adminConvName: {
        fontSize: 14, fontWeight: '800', color: '#fbbf24',
    },
    adminTypeBadge: {
        fontSize: 11, color: '#fbbf24', fontWeight: '700', marginBottom: 2,
    },
});
