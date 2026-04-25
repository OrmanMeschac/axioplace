import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Info, AlertTriangle, Zap, RefreshCw, CheckCheck } from 'lucide-react-native';
import api from '../lib/api';
import { Colors } from '../constants/Colors';

const TYPE_CFG = {
    info:    { icon: Info,          color: '#60a5fa', bg: '#1e3a5f', label: 'Info' },
    update:  { icon: RefreshCw,     color: '#4ade80', bg: '#14532d', label: 'Mise à jour' },
    warning: { icon: AlertTriangle, color: '#fb923c', bg: '#4d2600', label: 'Avertissement' },
    alert:   { icon: Zap,           color: '#f87171', bg: '#4c0519', label: 'Alerte' },
};

export default function NotificationsAdminScreen() {
    const [notifications, setNotifications] = useState([]);
    const [unread, setUnread]       = useState(0);
    const [loading, setLoading]     = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [marking, setMarking]     = useState(false);

    const fetchNotifications = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await api.get('/user/notifications');
            setNotifications(res.data.notifications?.data ?? []);
            setUnread(res.data.unread ?? 0);
        } catch (e) {
            console.error('Notifs:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markRead = async (id) => {
        try {
            await api.patch(`/user/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, lu: true } : n)
            );
            setUnread(prev => Math.max(0, prev - 1));
        } catch (e) { console.error(e); }
    };

    const markAllRead = async () => {
        if (unread === 0) return;
        setMarking(true);
        try {
            await api.post('/user/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
            setUnread(0);
        } catch (e) { console.error(e); }
        finally { setMarking(false); }
    };

    const renderItem = ({ item }) => {
        const cfg = TYPE_CFG[item.type] ?? TYPE_CFG.info;
        const IconComp = cfg.icon;
        const isUnread = !item.lu;

        return (
            <TouchableOpacity
                onPress={() => !item.lu && markRead(item.id)}
                activeOpacity={0.75}
                style={[styles.card, isUnread && styles.cardUnread]}
            >
                <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
                    <IconComp size={18} color={cfg.color} />
                </View>
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
                            <Text style={[styles.typeBadgeText, { color: cfg.color }]}>
                                {cfg.label}
                            </Text>
                        </View>
                        {isUnread && <View style={styles.unreadDot} />}
                        <Text style={styles.cardDate}>
                            {new Date(item.created_at).toLocaleDateString('fr-FR', {
                                day: '2-digit', month: 'short'
                            })}
                        </Text>
                    </View>
                    <Text style={[styles.cardTitle, isUnread && styles.cardTitleUnread]}>
                        {item.titre}
                    </Text>
                    <Text style={styles.cardBody} numberOfLines={3}>
                        {item.corps}
                    </Text>
                    {isUnread && (
                        <Text style={[styles.tapToRead, { color: cfg.color }]}>
                            Appuyer pour marquer comme lu
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Bell size={22} color={Colors.axioVert} />
                    <Text style={styles.headerTitle}>Notifications</Text>
                    {unread > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>
                                {unread > 99 ? '99+' : unread}
                            </Text>
                        </View>
                    )}
                </View>
                {unread > 0 && (
                    <TouchableOpacity
                        onPress={markAllRead}
                        disabled={marking}
                        style={styles.markAllBtn}
                    >
                        {marking
                            ? <ActivityIndicator size="small" color={Colors.axioVert} />
                            : <CheckCheck size={18} color={Colors.axioVert} />
                        }
                    </TouchableOpacity>
                )}
            </View>

            {/* Liste */}
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.axioJaune} />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={item => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchNotifications(true); }}
                            colors={[Colors.axioJaune]}
                            tintColor={Colors.axioJaune}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Bell size={52} color={Colors.gray200} />
                            <Text style={styles.emptyTitle}>Aucune notification</Text>
                            <Text style={styles.emptySubtitle}>
                                Les messages de l'équipe Axioplace apparaîtront ici.
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 16,
        backgroundColor: Colors.white,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 4, elevation: 3,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.gray900 },
    unreadBadge: {
        backgroundColor: Colors.axioJaune, borderRadius: 10,
        paddingHorizontal: 7, paddingVertical: 2, minWidth: 20, alignItems: 'center',
    },
    unreadBadgeText: { fontSize: 11, fontWeight: '800', color: '#1f2937' },
    markAllBtn: { padding: 8 },

    list: { padding: 16, gap: 10 },
    emptyContainer: { flex: 1 },

    card: {
        flexDirection: 'row', gap: 12, padding: 14,
        backgroundColor: Colors.white, borderRadius: 16,
        borderWidth: 1, borderColor: Colors.border,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
        marginBottom: 10,
    },
    cardUnread: {
        borderColor: Colors.axioJaune + '60',
        backgroundColor: Colors.axioJaune + '08',
    },
    iconBox: {
        width: 40, height: 40, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    cardContent: { flex: 1, gap: 4 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    typeBadge: {
        paddingHorizontal: 7, paddingVertical: 2,
        borderRadius: 6,
    },
    typeBadgeText: { fontSize: 10, fontWeight: '700' },
    unreadDot: {
        width: 7, height: 7, borderRadius: 4,
        backgroundColor: Colors.axioJaune,
    },
    cardDate: { fontSize: 10, color: Colors.gray400, marginLeft: 'auto' },
    cardTitle: { fontSize: 14, fontWeight: '600', color: Colors.gray700 },
    cardTitleUnread: { fontWeight: '800', color: Colors.gray900 },
    cardBody: { fontSize: 13, color: Colors.gray500, lineHeight: 18 },
    tapToRead: { fontSize: 11, fontWeight: '600', marginTop: 4 },

    emptyBox: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingVertical: 80, gap: 12,
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.gray700 },
    emptySubtitle: { fontSize: 13, color: Colors.gray400, textAlign: 'center', paddingHorizontal: 32 },
});
