import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Vérifie si un token existe déjà au démarrage et récupère le profil
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                try {
                    const response = await api.get('/user');
                    setUser(response.data);
                } catch (error) {
                    // Token invalide ou expiré — on purge
                    localStorage.removeItem('auth_token');
                    setUser(null);
                }
            }
            setIsLoading(false);
        };
        checkAuth();
    }, []);

    /**
     * Connexion via Bearer Token (Sanctum API Token)
     * Pas de csrf-cookie car withCredentials est désactivé.
     */
    const login = async (email, password) => {
        const response = await api.post('/login', { email, password });
        localStorage.setItem('auth_token', response.data.token);
        setUser(response.data.user);
        return response.data;
    };

    /**
     * Inscription + connexion automatique via Bearer Token
     */
    const register = async (userData) => {
        const response = await api.post('/register', userData);
        localStorage.setItem('auth_token', response.data.token);
        setUser(response.data.user);
        return response.data;
    };

    /**
     * Déconnexion propre : révoque le token côté serveur puis purge le stockage
     */
    const logout = async () => {
        try {
            await api.post('/logout');
        } catch (error) {
            // Silencieux si le serveur ne répond pas — on purge quand même
        } finally {
            localStorage.removeItem('auth_token');
            setUser(null);
        }
    };

    /**
     * Connexion via un provider OAuth (Google ou Facebook)
     * Le client envoie l'access_token reçu du provider au backend.
     */
    const socialLogin = async (provider, token) => {
        const response = await api.post('/auth/social', { provider, token });
        localStorage.setItem('auth_token', response.data.token);
        setUser(response.data.user);
        return response.data;
    };

    const value = {
        user,
        setUser, // Exposé pour permettre la mise à jour globale (ex: profil, photo)
        login,
        register,
        logout,
        socialLogin,
        isLoading,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    return useContext(AuthContext);
};
