/**
 * Hook usePushNotifications
 * Gère l'inscription aux Web Push Notifications pour le navigateur.
 * Enregistre le service worker, demande la permission et s'abonne automatiquement.
 */
import { useEffect, useCallback } from 'react';
import api from '../lib/axios';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw     = window.atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function usePushNotifications(isAuthenticated) {
    const subscribe = useCallback(async () => {
        if (!isAuthenticated) return;
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        if (!VAPID_PUBLIC_KEY) return;

        try {
            // Enregistrer le service worker
            const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            await navigator.serviceWorker.ready;

            // Demander la permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return;

            // Vérifier si déjà souscrit
            let sub = await reg.pushManager.getSubscription();

            if (!sub) {
                sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                });
            }

            const key  = sub.getKey('p256dh');
            const auth = sub.getKey('auth');

            // Envoyer la souscription au backend
            await api.post('/user/web-push/subscribe', {
                endpoint:   sub.endpoint,
                public_key: key  ? btoa(String.fromCharCode(...new Uint8Array(key)))  : null,
                auth_token: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : null,
            });
        } catch (err) {
            // Silencieux — les pushes sont optionnels
            console.debug('Web Push non disponible:', err.message);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        subscribe();
    }, [subscribe]);
}
