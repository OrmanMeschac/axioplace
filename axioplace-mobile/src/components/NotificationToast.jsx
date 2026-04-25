/**
 * Composant de notification (Toast) global.
 * 
 * Affiche une alerte animée descendant depuis le haut de l'écran avec une barre de progression.
 * Gère correctement les encoches système (safe areas).
 * 
 * @param {Object} props
 * @param {boolean} props.visible - État d'affichage de la notification
 * @param {string} props.message - Le contenu textuel de l'alerte
 * @param {'info'|'warning'|'alert'|'success'|'admin'} props.type - Le type de notification, détermine les couleurs et l'icône
 * @param {Function} props.onDismiss - Fonction appelée à la fin de l'animation de fermeture
 */
import React, { useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, Animated, TouchableOpacity,
    Platform, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldCheck, BellRing, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react-native';
import { Colors } from '../constants/Colors';

const { width: SCREEN_W } = Dimensions.get('window');

const TOAST_CONFIG = {
    info: {
        bg: '#1e3a5f',
        accent: '#60a5fa',
        border: '#3b82f6',
        Icon: Info,
        label: 'Information',
    },
    success: {
        bg: '#052e16',
        accent: '#4ade80',
        border: '#22c55e',
        Icon: CheckCircle2,
        label: 'Succès',
    },
    warning: {
        bg: '#431407',
        accent: '#fb923c',
        border: '#f97316',
        Icon: AlertTriangle,
        label: 'Attention',
    },
    alert: {
        bg: '#450a0a',
        accent: '#f87171',
        border: '#ef4444',
        Icon: BellRing,
        label: 'Alerte',
    },
    admin: {
        bg: 'linear',
        accent: '#fbbf24',
        border: '#fbbf24',
        Icon: ShieldCheck,
        label: '📢 Administration Axioplace',
    },
};

export default function NotificationToast({ visible, message, type = 'info', onDismiss }) {
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(-200)).current;
    const progressAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const DURATION = 4500;

    const dismiss = useCallback(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -200,
                duration: 320,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 280,
                useNativeDriver: true,
            }),
        ]).start(() => onDismiss?.());
    }, [translateY, opacityAnim, onDismiss]);

    useEffect(() => {
        if (!visible) return;

        progressAnim.setValue(1);

        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                damping: 18,
                stiffness: 200,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start();

        Animated.timing(progressAnim, {
            toValue: 0,
            duration: DURATION,
            useNativeDriver: false,
        }).start();

        const timer = setTimeout(() => dismiss(), DURATION);
        return () => clearTimeout(timer);
    }, [visible, message]);

    if (!visible) return null;

    const cfg = TOAST_CONFIG[type] || TOAST_CONFIG.info;
    const Icon = cfg.Icon;

    const isAdmin = type === 'admin';
    const containerBg = isAdmin ? '#1e1b4b' : cfg.bg;
    const borderColor = cfg.border;

    const topOffset = insets.top + (Platform.OS === 'android' ? 8 : 4);

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    top: topOffset,
                    transform: [{ translateY }],
                    opacity: opacityAnim,
                    backgroundColor: containerBg,
                    borderColor: borderColor,
                },
            ]}
            pointerEvents="box-none"
        >
            <View style={styles.row}>
                <View style={[styles.iconBox, { backgroundColor: cfg.border + '30' }]}>
                    <Icon size={isAdmin ? 22 : 18} color={cfg.accent} strokeWidth={2} />
                </View>

                <View style={styles.textBlock}>
                    <Text style={[styles.label, { color: cfg.accent }]} maxFontSizeMultiplier={1.2}>
                        {cfg.label}
                    </Text>
                    <Text style={styles.message} numberOfLines={3} maxFontSizeMultiplier={1.2}>
                        {message}
                    </Text>
                </View>

                <TouchableOpacity style={styles.closeBtn} onPress={dismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <X size={14} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
            </View>

            <View style={styles.progressTrack}>
                <Animated.View
                    style={[
                        styles.progressBar,
                        {
                            backgroundColor: cfg.accent,
                            width: progressAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%'],
                            }),
                        },
                    ]}
                />
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 14,
        right: 14,
        zIndex: 9999,
        borderRadius: 18,
        borderWidth: 1.5,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 24,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    textBlock: { flex: 1 },
    label: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    message: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
        lineHeight: 18,
    },
    closeBtn: {
        padding: 4,
        flexShrink: 0,
    },
    progressTrack: {
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    progressBar: {
        height: 3,
        borderRadius: 2,
    },
});

