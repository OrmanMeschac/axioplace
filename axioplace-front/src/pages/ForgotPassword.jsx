import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../lib/axios';

export default function ForgotPassword() {
    const [email, setEmail]     = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError]     = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError(''); setSuccess('');
        try {
            const res = await api.post('/forgot-password', { email });
            setSuccess(res.data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Une erreur est survenue.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f8f9fa] to-[#e8f5e9] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">

                {/* Card */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                    {/* Header vert */}
                    <div className="bg-gradient-to-br from-[#25903b] to-[#1a6e2d] px-8 py-10 text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-extrabold text-white">Mot de passe oublié</h1>
                        <p className="text-white/80 text-sm mt-2">Entrez votre adresse email et nous vous enverrons un lien de réinitialisation.</p>
                    </div>

                    <div className="px-8 py-8">
                        {success ? (
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle className="w-9 h-9 text-green-500" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-900 text-lg">Email envoyé !</h2>
                                    <p className="text-gray-500 text-sm mt-1">{success}</p>
                                    <p className="text-gray-400 text-xs mt-3">Vérifiez vos spams si vous ne le trouvez pas dans votre boîte principale.</p>
                                </div>
                                <Link to="/login" className="inline-flex items-center gap-2 text-sm text-[#25903b] hover:underline font-semibold mt-2">
                                    <ArrowLeft className="w-4 h-4" /> Retour à la connexion
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Adresse email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder="votre@email.com"
                                            required
                                            className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#25903b] focus:ring-2 focus:ring-[#25903b]/10 transition"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !email}
                                    className="w-full py-3.5 bg-[#25903b] hover:bg-[#1e7a32] text-white font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading
                                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Envoi...</>
                                        : 'Envoyer le lien de réinitialisation'
                                    }
                                </button>

                                <div className="text-center">
                                    <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#25903b] transition">
                                        <ArrowLeft className="w-4 h-4" /> Retour à la connexion
                                    </Link>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Logo */}
                <p className="text-center text-gray-400 text-xs mt-6">Axioplace &copy; {new Date().getFullYear()}</p>
            </div>
        </div>
    );
}
