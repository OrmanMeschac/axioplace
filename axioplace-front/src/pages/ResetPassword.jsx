import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
import api from '../lib/axios';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [password, setPassword]         = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [showPwd, setShowPwd]           = useState(false);
    const [loading, setLoading]           = useState(false);
    const [success, setSuccess]           = useState('');
    const [error, setError]               = useState('');

    const token = searchParams.get('token');
    const email = searchParams.get('email');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmation) { setError('Les mots de passe ne correspondent pas.'); return; }
        if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }

        setLoading(true); setError(''); setSuccess('');
        try {
            const res = await api.post('/reset-password', {
                token,
                email,
                password,
                password_confirmation: confirmation,
            });
            setSuccess(res.data.message);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Lien invalide ou expiré. Veuillez faire une nouvelle demande.');
        } finally {
            setLoading(false);
        }
    };

    const strength = (() => {
        if (!password) return 0;
        let s = 0;
        if (password.length >= 8)  s++;
        if (/[A-Z]/.test(password)) s++;
        if (/[0-9]/.test(password)) s++;
        if (/[^A-Za-z0-9]/.test(password)) s++;
        return s;
    })();

    const strengthLabel = ['', 'Faible', 'Moyen', 'Fort', 'Très fort'][strength];
    const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'][strength];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f8f9fa] to-[#e8f5e9] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-[#25903b] to-[#1a6e2d] px-8 py-10 text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-extrabold text-white">Nouveau mot de passe</h1>
                        <p className="text-white/80 text-sm mt-2">Choisissez un mot de passe sécurisé d'au moins 8 caractères.</p>
                    </div>

                    <div className="px-8 py-8">
                        {success ? (
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle className="w-9 h-9 text-green-500" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-900 text-lg">Mot de passe réinitialisé !</h2>
                                    <p className="text-gray-500 text-sm mt-1">{success}</p>
                                    <p className="text-gray-400 text-xs mt-2">Redirection dans 3 secondes...</p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">

                                {/* Nouveau mot de passe */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nouveau mot de passe</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type={showPwd ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="Minimum 8 caractères"
                                            required
                                            className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#25903b] focus:ring-2 focus:ring-[#25903b]/10 transition"
                                        />
                                        <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {/* Force du mot de passe */}
                                    {password && (
                                        <div className="mt-2 space-y-1">
                                            <div className="flex gap-1">
                                                {[1,2,3,4].map(i => (
                                                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-gray-100'}`} />
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-400">{strengthLabel}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Confirmation */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmer le mot de passe</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type={showPwd ? 'text' : 'password'}
                                            value={confirmation}
                                            onChange={e => setConfirmation(e.target.value)}
                                            placeholder="Répétez le mot de passe"
                                            required
                                            className={`w-full pl-12 pr-4 py-3.5 border rounded-xl text-sm focus:outline-none transition ${
                                                confirmation && confirmation !== password
                                                    ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                                                    : 'border-gray-200 focus:border-[#25903b] focus:ring-2 focus:ring-[#25903b]/10'
                                            }`}
                                        />
                                    </div>
                                    {confirmation && confirmation !== password && (
                                        <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas.</p>
                                    )}
                                </div>

                                {error && (
                                    <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !password || !confirmation}
                                    className="w-full py-3.5 bg-[#25903b] hover:bg-[#1e7a32] text-white font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading
                                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Réinitialisation...</>
                                        : 'Réinitialiser le mot de passe'
                                    }
                                </button>

                                <div className="text-center">
                                    <Link to="/mot-de-passe-oublie" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#25903b] transition">
                                        <ArrowLeft className="w-4 h-4" /> Demander un nouveau lien
                                    </Link>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
                <p className="text-center text-gray-400 text-xs mt-6">Axioplace &copy; {new Date().getFullYear()}</p>
            </div>
        </div>
    );
}
