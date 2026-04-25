import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, CheckSquare, Square } from 'lucide-react';

export default function Register() {
    const [formData, setFormData] = useState({
        nom: '', email: '', password: '', password_confirmation: '', telephone: ''
    });
    const [showPwd,   setShowPwd]   = useState(false);
    const [error,     setError]     = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading,   setLoading]   = useState(false);
    const [acceptCGU, setAcceptCGU] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.password_confirmation) {
            return setError('Les mots de passe ne correspondent pas.');
        }
        setLoading(true);
        try {
            await register(formData);
            setSuccessMsg('Inscription réussie ! Redirection en cours...');
            setTimeout(() => {
                navigate('/');
            }, 1000);
        } catch (err) {
            if (!err.response) {
                setError(err.userMessage || 'Impossible de contacter le serveur.');
            } else if (err.response?.data?.errors) {
                setError(Object.values(err.response.data.errors)[0][0]);
            } else {
                setError(err.response?.data?.message || 'Erreur lors de l\'inscription.');
            }
        } finally {
            setLoading(false);
        }
    };

    const fields = [
        { name: 'nom',         type: 'text',     Icon: User,  label: 'Nom complet',       placeholder: 'Jean Dupont',     required: true },
        { name: 'email',       type: 'email',    Icon: Mail,  label: 'Adresse email',     placeholder: 'votre@email.com', required: true },
        { name: 'telephone',   type: 'tel',      Icon: Phone, label: 'Téléphone (optionnel)', placeholder: '+242 06 XXX XX XX', required: false },
    ];

    return (
        <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden">
            {/* Background Image & Overlay */}
            <div className="absolute inset-0 z-0">
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('https://i.pinimg.com/originals/3c/05/71/3c05716d80249529424e1a05b9f414c1.jpg')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFC533]/85 to-[#009543]/85 backdrop-blur-[1px]" />
            </div>

            <div className="relative z-10 w-full max-w-md animate-fade-in-up">
                <div className="bg-white rounded-[2rem] shadow-2xl border border-white/20 p-8 md:p-10 space-y-6 text-gray-900">
                    <div className="text-center mb-2">
                        <h1 className="text-3xl font-extrabold text-gray-900">Créer un compte</h1>
                        <p className="text-gray-500 text-sm mt-1">Rejoignez Axioplace dès aujourd'hui</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl mb-5 text-sm flex items-center gap-2">
                            <span className="text-red-500">⚠</span> {error}
                        </div>
                    )}

                    {successMsg && (
                        <div className="bg-green-50 border border-green-200 text-green-700 p-3.5 rounded-xl mb-5 text-sm flex items-center gap-2">
                            <span className="text-green-500">✅</span> {successMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {fields.map(({ name, type, Icon, label, placeholder, required }) => (
                            <div key={name}>
                                <label className="input-label">{label}</label>
                                <div className="relative">
                                    <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type={type}
                                        name={name}
                                        required={required}
                                        value={formData[name]}
                                        onChange={handleChange}
                                        className="input-field pl-11"
                                        placeholder={placeholder}
                                        id={`register-${name}`}
                                    />
                                </div>
                            </div>
                        ))}

                        <div>
                            <label className="input-label">Mot de passe</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type={showPwd ? 'text' : 'password'}
                                    name="password"
                                    required minLength={8}
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="input-field pl-11 pr-11"
                                    placeholder="Min. 8 caractères"
                                    id="register-password"
                                />
                                <button type="button" onClick={() => setShowPwd(v => !v)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="input-label">Confirmer le mot de passe</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type={showPwd ? 'text' : 'password'}
                                    name="password_confirmation"
                                    required minLength={8}
                                    value={formData.password_confirmation}
                                    onChange={handleChange}
                                    className="input-field pl-11"
                                    placeholder="••••••••"
                                    id="register-password-confirm"
                                />
                            </div>
                        </div>

                        {/* Indicateur force mot de passe */}
                        {formData.password && (
                            <div className="space-y-1">
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-300 ${
                                        formData.password.length >= 12 ? 'w-full bg-green-500' :
                                        formData.password.length >= 8  ? 'w-2/3 bg-axio-jaune' :
                                        'w-1/3 bg-red-400'
                                    }`} />
                                </div>
                                <p className="text-xs text-gray-400">
                                    {formData.password.length >= 12 ? '✅ Mot de passe fort' :
                                     formData.password.length >= 8  ? '⚠️ Mot de passe acceptable' :
                                     '❌ Mot de passe trop court'}
                                </p>
                            </div>
                        )}

                        {/* Checkbox CGU obligatoire */}
                        <div className="mt-2">
                            <button
                                type="button"
                                onClick={() => setAcceptCGU(v => !v)}
                                className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                                    acceptCGU
                                        ? 'border-axio-vert bg-green-50'
                                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                }`}
                                id="register-accept-cgu"
                            >
                                {acceptCGU
                                    ? <CheckSquare className="w-5 h-5 text-axio-vert flex-shrink-0 mt-0.5" />
                                    : <Square className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                }
                                <span className="text-sm text-gray-600 leading-snug">
                                    J'ai lu et j'accepte les{' '}
                                    <Link to="/cgu" target="_blank" className="font-bold text-axio-jaune hover:underline" onClick={e => e.stopPropagation()}>
                                        Conditions Générales d'Utilisation
                                    </Link>
                                    {' '}et la{' '}
                                    <Link to="/politique-confidentialite" target="_blank" className="font-bold text-axio-jaune hover:underline" onClick={e => e.stopPropagation()}>
                                        Politique de Confidentialité
                                    </Link>
                                    {' '}d'Axioplace. *
                                </span>
                            </button>
                            {!acceptCGU && (
                                <p className="text-xs text-gray-400 mt-1.5 pl-1">Obligatoire pour créer un compte.</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !acceptCGU}
                            className="btn-vert w-full py-3.5 rounded-xl text-base disabled:opacity-70 mt-2"
                            id="register-submit-btn"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Inscription...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Créer mon compte <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-5 border-t border-gray-100 text-center text-sm text-gray-600">
                        Déjà un compte ?{' '}
                        <Link to="/login" className="font-bold text-axio-jaune hover:text-yellow-600 transition">
                            Se connecter
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
