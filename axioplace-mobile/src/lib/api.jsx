import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import { triggerLogout } from '../utils/authManager';

export { API_BASE_URL };
export const API_STORAGE_URL = `${API_BASE_URL}/storage/`;

/**
 * Instance Axios configurée pour l'API Axioplace.
 * Définit les headers standards et le timeout par défaut.
 */
const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 15000,
});

/**
 * Intercepteur de requêtes :
 * Injecte automatiquement le jeton d'authentification (Bearer Token) 
 * à partir du stockage local si l'utilisateur est authentifié.
 */
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

/**
 * Intercepteur de réponses :
 * Gère les erreurs globales retournées par l'API.
 * En cas de statut 401 (Non Autorisé), l'utilisateur est déconnecté 
 * et son jeton est invalidé localement.
 */
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await AsyncStorage.removeItem('auth_token');
            triggerLogout();
        }
        return Promise.reject(error);
    }
);

export default api;

