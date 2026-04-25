import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, TextInput,
    StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
    AppState,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Send, Calendar, MessageSquare, ShieldCheck } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../lib/api';
import { Colors } from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { getImageUri } from '../utils/images';
import FastImage from '../components/FastImage';
import AdminMessageBubble from '../components/AdminMessageBubble';

// Intervalle de rafraîchissement (ms) — uniquement quand l'écran et l'app sont actifs
const POLL_INTERVAL = 2000;

export default function ChatScreen({ route, navigation }) {
    const { conv } = route.params;
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const flatListRef = useRef(null);
    const intervalRef = useRef(null);
    const isMountedRef = useRef(true);
    const appStateRef = useRef(AppState.currentState);

    // Garde contre user null (ne devrait pas arriver mais sécurise le crash)
    if (!user) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.axioJaune} />
                </View>
            </SafeAreaView>
        );
    }

    const interlocuteur = String(conv.expediteur_id) === String(user.id)
        ? conv.destinataire
        : conv.expediteur;

    const fetchMessages = useCallback(async () => {
        if (!isMountedRef.current) return;
        try {
            const annonceParam = conv.annonce_id != null ? conv.annonce_id : 'null';
            const res = await api.get(`/messages/${annonceParam}/${interlocuteur.id}`);
            if (isMountedRef.current) {
                setMessages(prev => {
                    const newData = res.data || [];
                    // Comparer uniquement les IDs réels (ignorer les messages optimistes)
                    const prevRealIds = prev.filter(m => !m.isOptimistic).map(m => m.id);
                    const newRealIds  = newData.map(m => m.id);
                    if (JSON.stringify(prevRealIds) === JSON.stringify(newRealIds)) return prev;
                    // Fusionner : conserver les optimistes encore en attente
                    const optimistics = prev.filter(m => m.isOptimistic);
                    return [...newData, ...optimistics];
                });
            }
        } catch (err) {
            // Silencieux pour ne pas perturber l'UX
        } finally {
            if (isMountedRef.current) setLoading(false);
        }
    }, [conv.annonce_id, interlocuteur.id]);

    const startPolling = useCallback(() => {
        stopPolling();
        intervalRef.current = setInterval(fetchMessages, POLL_INTERVAL);
    }, [fetchMessages]);

    const stopPolling = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    // Démarrer/couper le polling selon le focus de l'écran
    useFocusEffect(
        useCallback(() => {
            isMountedRef.current = true;
            fetchMessages();
            startPolling();

            return () => {
                stopPolling();
            };
        }, [fetchMessages, startPolling])
    );

    // Couper le polling quand l'app passe en arrière-plan
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState) => {
            if (appStateRef.current === 'active' && nextState !== 'active') {
                stopPolling();
            } else if (appStateRef.current !== 'active' && nextState === 'active') {
                fetchMessages();
                startPolling();
            }
            appStateRef.current = nextState;
        });

        return () => {
            subscription.remove();
            isMountedRef.current = false;
        };
    }, [fetchMessages, startPolling]);

    const sendMessage = async () => {
        const content = newMessage.trim();
        if (!content) return;

        // Optimistic UI : affichage immédiat
        const tempId = `temp_${Date.now()}`;
        const optimistic = {
            id: tempId,
            expediteur_id: user.id,
            destinataire_id: interlocuteur.id,
            annonce_id: conv.annonce_id,
            contenu: content,
            created_at: new Date().toISOString(),
            isOptimistic: true,
        };
        setMessages(prev => [...prev, optimistic]);
        setNewMessage('');
        setSending(true);

        try {
            const res = await api.post('/messages', {
                destinataire_id: interlocuteur.id,
                annonce_id: conv.annonce_id ?? null,
                contenu: content,
            });
            // Remplacer le message optimiste par le message confirmé
            setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
        } catch (err) {
            // Retirer le message optimiste en cas d'échec
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } finally {
            setSending(false);
        }
    };

    const renderMessage = ({ item: msg }) => {
        const isMe = String(msg.expediteur_id) === String(user?.id);
        const isAdmin = !isMe && (msg.is_admin || msg.from_admin);

        // Message officiel de l'administration
        if (isAdmin) {
            return <AdminMessageBubble message={msg} />;
        }

        return (
            <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
                {isMe ? (
                    <LinearGradient
                        colors={[Colors.axioJaune, '#f5b800']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={[styles.bubble, styles.bubbleMe, msg.isOptimistic && { opacity: 0.7 }]}
                    >
                        <Text style={styles.bubbleText} maxFontSizeMultiplier={1.3}>{msg.contenu}</Text>
                        <Text style={styles.bubbleTime}>
                            {msg.isOptimistic ? '⏳' : new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </LinearGradient>
                ) : (
                    <View style={[styles.bubble, styles.bubbleThem, msg.isOptimistic && { opacity: 0.7 }]}>
                        <Text style={[styles.bubbleText, styles.bubbleTextThem]} maxFontSizeMultiplier={1.3}>{msg.contenu}</Text>
                        <Text style={[styles.bubbleTime, styles.bubbleTimeThem]}>
                            {msg.isOptimistic ? '⏳' : new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft size={22} color={Colors.gray700} />
                    </TouchableOpacity>

                    {/* Avatar : photo réelle ou lettre initiale */}
                    {interlocuteur?.photo_profil ? (
                        <FastImage
                            source={getImageUri(interlocuteur.photo_profil)}
                            style={styles.avatarMsgImg}
                            contentFit="cover"
                            priority="high"
                        />
                    ) : (
                        <LinearGradient
                            colors={[Colors.axioJaune, '#f5b800']}
                            style={styles.avatarMsg}
                        >
                            <Text style={styles.avatarLetter}>
                                {interlocuteur?.nom?.charAt(0)?.toUpperCase() || 'U'}
                            </Text>
                        </LinearGradient>
                    )}

                    {/* En-tête admin spécial ou nom normal */}
                    <View style={{ flex: 1 }}>
                        {conv.annonce?.titre === undefined && !conv.annonce ? (
                            // Conversation admin : header officiel
                            <View style={styles.adminChatHeader}>
                                <ShieldCheck size={13} color="#fbbf24" strokeWidth={2.5} />
                                <Text style={styles.adminChatName} maxFontSizeMultiplier={1.2}>
                                    Administration Axioplace
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.headerName} maxFontSizeMultiplier={1.2}>
                                {interlocuteur?.nom || 'Utilisateur'}
                            </Text>
                        )}
                        {conv.annonce?.titre ? (
                            <Text style={styles.headerAnnonce} numberOfLines={1} maxFontSizeMultiplier={1.1}>
                                {conv.annonce.titre}
                            </Text>
                        ) : (
                            <Text style={[styles.headerAnnonce, { color: '#fbbf24' }]} maxFontSizeMultiplier={1.1}>
                                Communication Système
                            </Text>
                        )}
                    </View>
                </View>

                {/* Messages */}
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={Colors.axioJaune} />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => String(item.id)}
                        renderItem={renderMessage}
                        contentContainerStyle={styles.msgList}
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() =>
                            flatListRef.current?.scrollToEnd({ animated: true })
                        }
                        onLayout={() =>
                            flatListRef.current?.scrollToEnd({ animated: false })
                        }
                        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
                        ListHeaderComponent={
                            <View style={styles.dateLabel}>
                                <Calendar size={12} color={Colors.gray400} />
                                <Text style={styles.dateLabelText}>Début de la discussion</Text>
                            </View>
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyChat}>
                                <MessageSquare size={48} color={Colors.gray300} />
                                <Text style={styles.emptyChatText}>
                                    Envoyez le premier message !
                                </Text>
                            </View>
                        }
                    />
                )}

                {/* Input — paddingBottom adapté à la safe area */}
                <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                    <TextInput
                        style={styles.input}
                        placeholder="Écrivez votre message..."
                        placeholderTextColor={Colors.gray400}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                        maxLength={1000}
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, (!newMessage.trim() || sending) && styles.sendBtnDisabled]}
                        onPress={sendMessage}
                        disabled={!newMessage.trim() || sending}
                    >
                        <LinearGradient
                            colors={[Colors.axioJaune, '#f5b800']}
                            style={styles.sendBtnGradient}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#1f2937" />
                            ) : (
                                <Send size={18} color="#1f2937" strokeWidth={2.5} />
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    header: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: Colors.white,
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 4, elevation: 4,
    },
    backBtn: { padding: 4 },
    avatarMsg: {
        width: 42, height: 42, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
    },
    avatarMsgImg: {
        width: 42, height: 42, borderRadius: 14,
        overflow: 'hidden', backgroundColor: Colors.gray100,
    },
    avatarLetter: { fontSize: 18, fontWeight: '800', color: '#1f2937' },

    headerName: { fontSize: 15, fontWeight: '700', color: Colors.gray900 },
    headerAnnonce: { fontSize: 11, color: Colors.axioVert, fontWeight: '600' },
    adminChatHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    adminChatName: { fontSize: 14, fontWeight: '800', color: '#fbbf24' },

    msgList: { paddingHorizontal: 16, paddingVertical: 12, gap: 6 },
    dateLabel: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 4, marginBottom: 16,
        backgroundColor: Colors.gray100, alignSelf: 'center',
        paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12,
    },
    dateLabelText: { fontSize: 10, color: Colors.gray400, fontWeight: '600', textTransform: 'uppercase' },

    msgRow: { marginVertical: 2 },
    msgRowRight: { alignItems: 'flex-end' },
    msgRowLeft: { alignItems: 'flex-start' },

    bubble: {
        maxWidth: '78%', paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: 20, shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
    },
    bubbleMe: { borderTopRightRadius: 4 },
    bubbleThem: { backgroundColor: Colors.white, borderTopLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
    bubbleText: { fontSize: 14, color: '#1f2937', lineHeight: 20 },
    bubbleTextThem: { color: Colors.text },
    bubbleTime: { fontSize: 10, color: 'rgba(31,39,55,0.5)', marginTop: 4, textAlign: 'right' },
    bubbleTimeThem: { color: Colors.gray400 },

    emptyChat: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
    emptyChatText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },

    inputBar: {
        flexDirection: 'row', alignItems: 'flex-end', gap: 10,
        backgroundColor: Colors.white,
        paddingHorizontal: 16, paddingVertical: 12,
        borderTopWidth: 1, borderTopColor: Colors.border,
    },
    input: {
        flex: 1, backgroundColor: Colors.gray50,
        borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
        fontSize: 14, color: Colors.text,
        maxHeight: 120, borderWidth: 1, borderColor: Colors.gray100,
    },
    sendBtn: {
        width: 44, height: 44, borderRadius: 14,
        overflow: 'hidden',
    },
    sendBtnDisabled: { opacity: 0.5 },
    sendBtnGradient: {
        width: '100%', height: '100%',
        alignItems: 'center', justifyContent: 'center',
    },
});
