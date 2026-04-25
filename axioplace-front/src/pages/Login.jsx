import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

export default function Login() {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd]   = useState(false);
    const [error, setError]       = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isOAuthError, setIsOAuthError] = useState(false); // true quand le compte est OAuth-only
    const [loading, setLoading]   = useState(false);
    const [socialLoading, setSocialLoading] = useState(''); // 'google' | 'facebook' | ''

    const { login, socialLogin } = useAuth();
    const navigate  = useNavigate();
    const location  = useLocation();
    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsOAuthError(false);
        setLoading(true);
        try {
            await login(email, password);
            setSuccessMsg('Connexion réussie ! Redirection en cours...');
            setTimeout(() => {
                navigate(from, { replace: true });
            }, 1000);
        } catch (err) {
            const msg = err.response?.data?.errors
                ? Object.values(err.response.data.errors)[0][0]
                : (err.response?.data?.message || 'Identifiants incorrects. Réessayez.');

            // Détecter si c'est un compte OAuth
            if (msg.includes('créé via') || msg.includes('Google') || msg.includes('Facebook')) {
                setIsOAuthError(true);
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // ── Connexion Google ───────────────────────────────────────────────────────
    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setSocialLoading('google');
            setError('');
            try {
                await socialLogin('google', tokenResponse.access_token);
                setSuccessMsg('Connexion réussie avec Google !');
                setTimeout(() => {
                    navigate(from, { replace: true });
                }, 1000);
            } catch (err) {
                setError(err.response?.data?.message || 'Connexion Google échouée. Réessayez.');
            } finally {
                setSocialLoading('');
            }
        },
        onError: () => {
            setError('La connexion avec Google a été annulée ou a échoué.');
            setSocialLoading('');
        },
    });

    // ── Connexion Facebook ─────────────────────────────────────────────────────
    const handleFacebookLogin = () => {
        if (!window.FB) {
            setError('Le SDK Facebook n\'est pas encore chargé. Réessayez dans quelques secondes.');
            return;
        }
        setSocialLoading('facebook');
        setError('');
        window.FB.login(
            async (response) => {
                if (response.authResponse) {
                    try {
                        await socialLogin('facebook', response.authResponse.accessToken);
                        setSuccessMsg('Connexion réussie avec Facebook !');
                        setTimeout(() => {
                            navigate(from, { replace: true });
                        }, 1000);
                    } catch (err) {
                        setError(err.response?.data?.message || 'Connexion Facebook échouée. Réessayez.');
                    } finally {
                        setSocialLoading('');
                    }
                } else {
                    setError('La connexion avec Facebook a été annulée.');
                    setSocialLoading('');
                }
            },
            { scope: 'email,public_profile' }
        );
    };

    const isBusy = loading || !!socialLoading;

    return (
        <div className="min-h-screen relative flex items-center justify-center px-4 py-16 overflow-hidden">
            {/* Background Image & Overlay */}
            <div className="absolute inset-0 z-0">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('https://i.pinimg.com/originals/3c/05/71/3c05716d80249529424e1a05b9f414c1.jpg')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFC533]/85 to-[#009543]/85 backdrop-blur-[1px]" />
            </div>

            <div className="relative z-10 w-full max-w-md animate-fade-in-up">
                <div className="bg-white rounded-[2rem] shadow-2xl border border-white/20 p-8 md:p-10 space-y-6">

                    {/* Header */}
                    <div className="text-center mb-2">
                        <h1 className="text-3xl font-extrabold text-gray-900">Connexion</h1>
                        <p className="text-gray-500 text-sm mt-1">Bienvenue sur votre plateforme</p>
                    </div>

                    {error && !isOAuthError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-sm flex items-center gap-2">
                            <span className="text-red-500">⚠</span> {error}
                        </div>
                    )}

                    {successMsg && (
                        <div className="bg-green-50 border border-green-200 text-green-700 p-3.5 rounded-xl text-sm flex items-center gap-2">
                            <span className="text-green-500">✅</span> {successMsg}
                        </div>
                    )}

                    {error && isOAuthError && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
                            <p className="text-blue-800 font-semibold mb-1">🔗 Compte connecté via Google</p>
                            <p className="text-blue-700 mb-3">{error}</p>
                            <button
                                type="button"
                                onClick={() => { setError(''); setIsOAuthError(false); handleGoogleLogin(); }}
                                className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Se connecter avec Google
                            </button>
                        </div>
                    )}

                    {/* Boutons Social */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Bouton Google */}
                        <button
                            type="button"
                            onClick={() => handleGoogleLogin()}
                            disabled={isBusy}
                            id="login-google-btn"
                            className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 px-4 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {socialLoading === 'google' ? (
                                <span className="w-4 h-4 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
                            ) : (
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            )}
                            Google
                        </button>

                        {/* Bouton Facebook */}
                        <button
                            type="button"
                            onClick={handleFacebookLogin}
                            disabled={isBusy}
                            id="login-facebook-btn"
                            className="flex items-center justify-center gap-2 border border-[#1877F2]/30 rounded-xl py-3 px-4 text-sm font-semibold text-[#1877F2] bg-[#EEF4FF] hover:bg-[#E0EBFF] transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {socialLoading === 'facebook' ? (
                                <span className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                            ) : (
                                <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                                    <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073c0 6.027 4.388 11.021 10.125 11.927v-8.437H7.077v-3.49h3.048V9.43c0-3.026 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796v8.437C19.612 23.094 24 18.1 24 12.073z"/>
                                </svg>
                            )}
                            Facebook
                        </button>
                    </div>

                    {/* Séparateur */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400 font-medium">ou continuer avec email</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* Formulaire email/mot de passe */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="input-label">Adresse email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="input-field pl-11"
                                    placeholder="votre@email.com"
                                    id="login-email"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-semibold text-gray-700">Mot de passe</label>
                                <Link to="/mot-de-passe-oublie" className="text-xs font-medium text-axio-vert hover:text-green-700 transition">
                                    Mot de passe oublié ?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type={showPwd ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="input-field pl-11 pr-11"
                                    placeholder="••••••••"
                                    id="login-password"
                                />
                                <button type="button" onClick={() => setShowPwd(v => !v)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isBusy}
                            className="btn-primary w-full py-3.5 rounded-xl text-base disabled:opacity-70"
                            id="login-submit-btn"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                                    Connexion...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Se connecter <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-5 border-t border-gray-100 text-center text-sm text-gray-600">
                        Pas encore de compte ?{' '}
                        <Link to="/register" className="font-bold text-axio-vert hover:text-green-700 transition">
                            Créer un compte
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
