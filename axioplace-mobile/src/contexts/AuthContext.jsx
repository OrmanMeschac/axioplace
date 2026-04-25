import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import api from '../lib/api';
import { setLogoutCallback } from '../utils/authManager';

const AuthContext = createContext(null);

/** Intervalle de vérification en arrière-plan (8 secondes) */
const BG_POLL_INTERVAL = 8000;

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [adminNotifCount, setAdminNotifCount] = useState(0);
    const [isRinging, setIsRinging] = useState(false);

    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    /**
     * Affiche une notification toast globale.
     * Masque d'abord toute notification existante pour forcer l'animation d'apparition.
     */
    const showToast = useCallback((message, type = 'info') => {
        setToast({ visible: false, message: '', type });
        setTimeout(() => setToast({ visible: true, message, type }), 80);
    }, []);

    const hideToast = useCallback(() => {
        setToast(prev => ({ ...prev, visible: false }));
    }, []);

    const pollIntervalRef = useRef(null);
    const userRef = useRef(null);
    const prevUnreadRef = useRef(0);
    const prevAdminRef = useRef(0);

    useEffect(() => { userRef.current = user; }, [user]);

    /**
     * Effectue une requête en arrière-plan pour récupérer le nombre de messages
     * et de notifications non lus. 
     * Met à jour l'état uniquement en cas de changement pour éviter les rendus inutiles.
     */
    const backgroundPoll = useCallback(async () => {
        if (!userRef.current) return;
        try {
            const [convRes, notifRes] = await Promise.all([
                api.get('/conversations').catch(() => ({ data: [] })),
                api.get('/user/notifications').catch(() => ({ data: { unread: 0 } })),
            ]);

            const newUnread = (convRes.data || []).filter(
                c => !c.lu && String(c.destinataire_id) === String(userRef.current?.id)
            ).length;

            const newAdmin = notifRes.data?.unread ?? 0;

            if (newUnread !== prevUnreadRef.current) {
                setUnreadCount(newUnread);
                if (newUnread > prevUnreadRef.current) {
                    const diff = newUnread - prevUnreadRef.current;
                    showToast(
                        diff === 1
                            ? 'Vous avez reçu un nouveau message'
                            : `Vous avez ${diff} nouveaux messages`,
                        'info'
                    );
                    setIsRinging(true);
                    setTimeout(() => setIsRinging(false), 3000);
                }
                prevUnreadRef.current = newUnread;
            }

            if (newAdmin !== prevAdminRef.current) {
                setAdminNotifCount(newAdmin);
                if (newAdmin > prevAdminRef.current) {
                    showToast('Vous avez une nouvelle notification officielle', 'admin');
                }
                prevAdminRef.current = newAdmin;
            }
        } catch (_) {
        }
    }, [showToast]);

    /**
     * Initialise le cycle de vérification d'arrière-plan pour l'utilisateur connecté.
     */
    const startPolling = useCallback(() => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        backgroundPoll(); // première exécution immédiate
        pollIntervalRef.current = setInterval(backgroundPoll, BG_POLL_INTERVAL);
    }, [backgroundPoll]);

    const stopPolling = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    }, []);

    /**
     * Met en pause les requêtes d'arrière-plan lorsque l'application
     * passe en second plan pour économiser les ressources réseau et la batterie.
     */
    useEffect(() => {
        if (!user) { stopPolling(); return; }
        startPolling();

        const sub = AppState.addEventListener('change', state => {
            if (state === 'active') {
                startPolling();
            } else {
                stopPolling();
            }
        });

        return () => {
            sub.remove();
            stopPolling();
        };
    }, [user, startPolling, stopPolling]);

    /**
     * Vérifie la présence d'un jeton de session valide lors du 
     * premier montage du composant pour restaurer la session de l'utilisateur.
     */
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await AsyncStorage.getItem('auth_token');
                if (token) {
                    const res = await api.get('/user');
                    setUser(res.data);

                    const [convRes, notifRes] = await Promise.all([
                        api.get('/conversations').catch(() => ({ data: [] })),
                        api.get('/user/notifications').catch(() => ({ data: { unread: 0 } })),
                    ]);
                    const initUnread = (convRes.data || []).filter(
                        c => !c.lu && String(c.destinataire_id) === String(res.data.id)
                    ).length;
                    const initAdmin = notifRes.data?.unread ?? 0;

                    prevUnreadRef.current = initUnread;
                    prevAdminRef.current = initAdmin;
                    setUnreadCount(initUnread);
                    setAdminNotifCount(initAdmin);
                }
            } catch (err) {
                await AsyncStorage.removeItem('auth_token');
                setUser(null);
                setUnreadCount(0);
                setAdminNotifCount(0);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/login', { email, password });
        await AsyncStorage.setItem('auth_token', res.data.token);
        setUser(res.data.user);

        const [convRes, notifRes] = await Promise.all([
            api.get('/conversations').catch(() => ({ data: [] })),
            api.get('/user/notifications').catch(() => ({ data: { unread: 0 } })),
        ]);
        const uc = (convRes.data || []).filter(c => !c.lu && String(c.destinataire_id) === String(res.data.user.id)).length;
        const ac = notifRes.data?.unread ?? 0;
        prevUnreadRef.current = uc;
        prevAdminRef.current = ac;
        setUnreadCount(uc);
        setAdminNotifCount(ac);

        return res.data;
    };

    /**
     * Connexion via un provider OAuth (Google ou Facebook).
     * Le client envoie l'access_token reçu du provider au backend
     * qui le vérifie et retourne un token Sanctum.
     */
    const socialLogin = async (provider, token) => {
        const res = await api.post('/auth/social', { provider, token });
        await AsyncStorage.setItem('auth_token', res.data.token);
        setUser(res.data.user);
        return res.data;
    };

    const register = async (userData) => {
        const res = await api.post('/register', userData);
        await AsyncStorage.setItem('auth_token', res.data.token);
        setUser(res.data.user);
        return res.data;
    };

    const logout = async () => {
        try { await api.post('/logout'); } catch (_) {}
        await AsyncStorage.removeItem('auth_token');
        stopPolling();
        setUser(null);
        setUnreadCount(0);
        setAdminNotifCount(0);
        prevUnreadRef.current = 0;
        prevAdminRef.current = 0;
    };

    useEffect(() => {
        setLogoutCallback(logout);
    }, []);

    return (
        <AuthContext.Provider value={{
            user, setUser,
            login, register, logout, socialLogin,
            isLoading,
            isAuthenticated: !!user,
            unreadCount, setUnreadCount,
            adminNotifCount, setAdminNotifCount,
            isRinging, setIsRinging,
            toast, showToast, hideToast,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
