import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL + '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    // withCredentials uniquement nécessaire pour l'auth par cookie (Sanctum SPA)
    // On utilise Bearer Token ici, donc on n'en a pas besoin.
    withCredentials: false,
});

// ── Request interceptor : injecte le token Bearer si présent ─────────────────
api.interceptors.request.use(config => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Response interceptor : gestion globale des erreurs ───────────────────────
api.interceptors.response.use(
    response => response,
    error => {
        if (!error.response) {
            // Erreur réseau pure (serveur éteint, mauvais port, CORS bloquant)
            return Promise.reject({
                ...error,
                userMessage: 'Impossible de contacter le serveur. Vérifiez votre connexion ou que le serveur est démarré.',
            });
        }

        if (error.response.status === 401) {
            // Token expiré ou invalide, on purge la session et on redirige
            localStorage.removeItem('auth_token');
            // Redirection hors de React Router (sûre partout)
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;
