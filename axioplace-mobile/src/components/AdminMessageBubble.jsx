/**
 * Composant affichant une bulle de message spécifique aux administrateurs.
 *
 * Utilise des animations fluides (pulsation et bordure lumineuse) pour 
 * distinguer visuellement les messages officiels du support client.
 *
 * @param {Object} props
 * @param {Object} props.message - L'objet message contenant le texte et la date de création
 * @param {string} props.message.contenu - Le texte du message
 * @param {string} props.message.created_at - La date de création au format ISO
 */
import React, { useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck } from 'lucide-react-native';

export default function AdminMessageBubble({ message }) {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.12, duration: 1200, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, { toValue: 1, duration: 1800, useNativeDriver: false }),
                Animated.timing(glowAnim, { toValue: 0, duration: 1800, useNativeDriver: false }),
            ])
        ).start();
    }, []);

    const formattedTime = message.created_at
        ? new Date(message.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : '⏳';

    const borderColorAnim = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(251,191,36,0.3)', 'rgba(251,191,36,0.9)'],
    });

    return (
        <View style={styles.wrapper}>
            <View style={styles.officialBadge}>
                <ShieldCheck size={11} color="#fbbf24" fill="none" strokeWidth={2.5} />
                <Text style={styles.officialText}>MESSAGE OFFICIEL</Text>
            </View>

            <Animated.View style={[styles.bubbleOuter, { borderColor: borderColorAnim }]}>
                <LinearGradient
                    colors={['#1e1b4b', '#312e81', '#1e3a8a']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.bubble}
                >
                    <View style={styles.bubbleHeader}>
                        <Animated.View style={[styles.iconWrapper, { transform: [{ scale: pulseAnim }] }]}>
                            <LinearGradient
                                colors={['#fbbf24', '#f59e0b']}
                                style={styles.iconGradient}
                            >
                                <ShieldCheck size={14} color="#1e1b4b" fill="none" strokeWidth={2.5} />
                            </LinearGradient>
                        </Animated.View>
                        <View>
                            <Text style={styles.adminName} maxFontSizeMultiplier={1.2}>
                                Administration Axioplace
                            </Text>
                            <Text style={styles.adminRole} maxFontSizeMultiplier={1.2}>
                                ✓ Compte officiel vérifié
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.content} maxFontSizeMultiplier={1.3}>
                        {message.contenu}
                    </Text>

                    <Text style={styles.time} maxFontSizeMultiplier={1.1}>
                        {formattedTime}
                    </Text>
                </LinearGradient>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        alignSelf: 'flex-start',
        maxWidth: '90%',
        marginVertical: 6,
    },
    officialBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(251,191,36,0.12)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(251,191,36,0.3)',
        alignSelf: 'flex-start',
        marginBottom: 6,
        marginLeft: 2,
    },
    officialText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#fbbf24',
        letterSpacing: 1,
    },
    bubbleOuter: {
        borderRadius: 20,
        borderWidth: 1.5,
        overflow: 'hidden',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
    },
    bubble: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 18,
    },
    bubbleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    iconWrapper: {
        flexShrink: 0,
    },
    iconGradient: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    adminName: {
        fontSize: 13,
        fontWeight: '800',
        color: '#fbbf24',
    },
    adminRole: {
        fontSize: 10,
        color: 'rgba(251,191,36,0.7)',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(251,191,36,0.18)',
        marginBottom: 10,
    },
    content: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.92)',
        lineHeight: 20,
        fontWeight: '500',
    },
    time: {
        fontSize: 10,
        color: 'rgba(251,191,36,0.5)',
        marginTop: 8,
        textAlign: 'right',
        fontWeight: '600',
    },
});

