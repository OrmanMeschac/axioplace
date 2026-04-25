/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║              AXIOPLACE MOBILE — CONFIGURATION               ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  ⚡ POUR UN VRAI TÉLÉPHONE sur le même réseau WiFi :        ║
 * ║     1. Trouvez l'IP locale de votre PC :                    ║
 * ║        Windows : ipconfig → "Adresse IPv4" (ex: 192.168.1.5)║
 * ║     2. Remplacez API_HOST ci-dessous par cette IP           ║
 * ║     3. Assurez-vous que le pare-feu autorise le port 8000   ║
 * ║                                                              ║
 * ║  🤖 ÉMULATEUR ANDROID  → 10.0.2.2                           ║
 * ║  📱 iPhone simulateur  → localhost ou 127.0.0.1             ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ─── DÉTECTION DYNAMIQUE DE L'IP POUR LE DÉVELOPPEMENT ─────────────────────
let API_HOST = '172.16.2.193'; // Valeur par défaut pour Android Emulator

if (__DEV__) {
    // Si nous sommes en mode dev avec Expo, essayons de récupérer l'IP de la machine
    const hostUri = Constants?.expoConfig?.hostUri || Constants?.manifest?.hostUri;
    if (hostUri) {
        API_HOST = hostUri.split(':')[0];
    } else {
        API_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    }
} else {
    // IP fixée ou nom de domaine en production
    API_HOST = '10.188.70.28';
}

const API_PORT = '8000';
const API_SCHEME = 'http';   // 'https' en production

// ─── NE PAS MODIFIER EN DESSOUS ────────────────────────────────────────────
export const API_BASE_URL = `${API_SCHEME}://${API_HOST}:${API_PORT}`;
export const API_STORAGE_URL = `${API_BASE_URL}/storage/`;
