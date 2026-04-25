import { useState } from 'react';
import { Mail, User, MessageSquare, Send, CheckCircle, MapPin, Clock, AlertCircle } from 'lucide-react';
import api from '../lib/axios';

const INFO_CARDS = [
    {
        Icon: Mail,
        title: 'Email',
        value: 'support@axioplace.com',
        sub: 'Réponse sous 24h',
        color: 'bg-axio-jaune/10',
        iconColor: 'text-axio-jaune',
    },
    {
        Icon: MapPin,
        title: 'Adresse',
        value: 'Brazzaville, République du Congo',
        sub: 'Siège social',
        color: 'bg-axio-vert/10',
        iconColor: 'text-axio-vert',
    },
    {
        Icon: Clock,
        title: 'Disponibilité',
        value: 'Lun – Sam : 8h – 18h',
        sub: 'Heure locale (WAT)',
        color: 'bg-gray-100',
        iconColor: 'text-gray-500',
    },
];

const TOPICS = [
    { Icon: AlertCircle,  title: 'Signalement',  desc: 'Annonce frauduleuse ou comportement suspect' },
    { Icon: User,         title: 'Partenariat',  desc: 'Collaboration commerciale ou institutionnelle' },
    { Icon: MessageSquare,title: 'Bug / Erreur', desc: 'Un problème technique sur la plateforme' },
    { Icon: Send,         title: 'Suggestion',   desc: 'Proposer une fonctionnalité ou amélioration' },
];

export default function Contact() {
    const [form, setForm]       = useState({ nom: '', email: '', sujet: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError]     = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/contact', form);
            setSuccess(true);
            setForm({ nom: '', email: '', sujet: '', message: '' });
        } catch (err) {
            if (err.response?.data?.errors) {
                setError(Object.values(err.response.data.errors).flat()[0]);
            } else {
                setError(err.response?.data?.message || 'Une erreur est survenue. Veuillez réessayer.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f6f7f9]">

            {/* ── Hero — style Login (image + gradient jaune→vert + blur) ── */}
            <section className="relative overflow-hidden py-20">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: "url('https://i.pinimg.com/originals/3c/05/71/3c05716d80249529424e1a05b9f414c1.jpg')" }} />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FFC533]/85 to-[#009543]/85 backdrop-blur-[1px]" />
                </div>
                <div className="relative z-10 container mx-auto max-w-4xl px-4 text-center">
                    <span className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5 border border-white/20">
                        <Mail className="w-3.5 h-3.5" /> Nous contacter
                    </span>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4">
                        Contactez <span className="text-axio-jaune">Axioplace</span>
                    </h1>
                    <p className="text-white/80 text-lg max-w-xl mx-auto leading-relaxed">
                        Une question, un problème ou une suggestion ? Notre équipe vous répond rapidement.
                    </p>
                </div>
            </section>

            <div className="container mx-auto max-w-6xl px-4 py-14">

                {/* ── Info cards ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14 -mt-8">
                    {INFO_CARDS.map(({ Icon, title, value, sub, color, iconColor }) => (
                        <div key={title} className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex items-start gap-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                                <Icon className={`w-5 h-5 ${iconColor}`} />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{title}</p>
                                <p className="font-bold text-gray-900 text-sm leading-snug">{value}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Grille principale ── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

                    {/* Colonne gauche */}
                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            <h2 className="section-title">On est là pour vous aider</h2>
                            <p className="text-gray-500 leading-relaxed text-sm mt-2">
                                Que ce soit pour signaler un problème, poser une question sur une annonce ou proposer un partenariat, l'équipe Axioplace est disponible et attentive.
                            </p>
                        </div>
                        <div className="space-y-3">
                            {TOPICS.map(({ Icon, title, desc }) => (
                                <div key={title} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-axio-jaune/40 transition-colors shadow-sm group">
                                    <div className="w-9 h-9 rounded-lg bg-axio-jaune/10 flex items-center justify-center flex-shrink-0 group-hover:bg-axio-jaune/20 transition-colors">
                                        <Icon className="w-4 h-4 text-axio-jaune" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{title}</p>
                                        <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Colonne droite — formulaire */}
                    <div className="lg:col-span-3">
                        {success ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex flex-col items-center justify-center text-center space-y-5 min-h-[480px]">
                                <div className="w-20 h-20 rounded-full bg-axio-vert/10 flex items-center justify-center animate-scale-in">
                                    <CheckCircle className="w-10 h-10 text-axio-vert" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Message envoyé !</h3>
                                    <p className="text-gray-500 leading-relaxed max-w-sm mx-auto text-sm">
                                        Merci de nous avoir contactés. Notre équipe vous répondra dans les plus brefs délais.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSuccess(false)}
                                    className="btn-vert py-2.5 px-6 rounded-xl text-sm"
                                >
                                    Envoyer un autre message
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                                <h2 className="text-xl font-extrabold text-gray-900 mb-6">Envoyer un message</h2>

                                {error && (
                                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-5 text-sm">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5" noValidate>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="input-label" htmlFor="contact-nom">Nom complet *</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                <input
                                                    id="contact-nom"
                                                    type="text"
                                                    name="nom"
                                                    required
                                                    value={form.nom}
                                                    onChange={handleChange}
                                                    className="input-field pl-11"
                                                    placeholder="Jean Dupont"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="input-label" htmlFor="contact-email">Adresse email *</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                <input
                                                    id="contact-email"
                                                    type="email"
                                                    name="email"
                                                    required
                                                    value={form.email}
                                                    onChange={handleChange}
                                                    className="input-field pl-11"
                                                    placeholder="votre@email.com"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="input-label" htmlFor="contact-sujet">Sujet *</label>
                                        <div className="relative">
                                            <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            <input
                                                id="contact-sujet"
                                                type="text"
                                                name="sujet"
                                                required
                                                value={form.sujet}
                                                onChange={handleChange}
                                                className="input-field pl-11"
                                                placeholder="Ex : Problème avec mon annonce"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="input-label" htmlFor="contact-message">
                                            Message *
                                            <span className="text-gray-400 font-normal ml-2 text-xs">({form.message.length}/2000)</span>
                                        </label>
                                        <textarea
                                            id="contact-message"
                                            name="message"
                                            required
                                            rows={6}
                                            value={form.message}
                                            onChange={handleChange}
                                            maxLength={2000}
                                            className="input-field resize-none leading-relaxed"
                                            placeholder="Décrivez votre demande en détail..."
                                        />
                                    </div>

                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        En soumettant ce formulaire, vous acceptez que vos données soient utilisées conformément à notre{' '}
                                        <a href="/politique-confidentialite" target="_blank" rel="noreferrer" className="text-axio-vert font-medium hover:underline">
                                            Politique de confidentialité
                                        </a>.
                                    </p>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-vert w-full py-3.5 rounded-xl text-base disabled:opacity-70"
                                        id="contact-submit-btn"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Envoi en cours...
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                <Send className="w-4 h-4" /> Envoyer le message
                                            </span>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
