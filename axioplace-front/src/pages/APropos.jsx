import { Link } from 'react-router-dom';
import {
    Target, Eye, Heart, Users, ShoppingBag, MessageCircle,
    Shield, Smartphone, ArrowRight, CheckCircle, TrendingUp,
    Globe, Award, Zap,
} from 'lucide-react';

const VALUES = [
    { Icon: Shield,      title: 'Confiance',       desc: 'Chaque transaction mérite un environnement sûr. Nous modérons activement la plateforme pour protéger vendeurs et acheteurs.' },
    { Icon: Globe,       title: 'Accessibilité',   desc: 'Axioplace est conçu pour être utilisé par tous, quel que soit le niveau de maîtrise technologique, depuis le web ou mobile.' },
    { Icon: Zap,         title: 'Simplicité',      desc: 'Publier une annonce ne doit pas être compliqué. Nous réduisons les frictions pour que l\'essentiel reste l\'échange humain.' },
    { Icon: Award,       title: 'Transparence',    desc: 'Pas de frais cachés, pas de surprises. Nous sommes clairs sur nos règles, nos politiques et notre fonctionnement.' },
];

const STATS = [
    { value: '500+',  label: 'Annonces publiées' },
    { value: '200+',  label: 'Utilisateurs actifs' },
    { value: '5+',    label: 'Catégories' },
    { value: '100%',  label: 'Made in Congo' },
];

const FEATURES = [
    { Icon: ShoppingBag,   title: 'Marketplace complète',  desc: 'Vente, location, services — toutes les catégories en un seul endroit.' },
    { Icon: MessageCircle, title: 'Messagerie intégrée',   desc: 'Communiquez directement avec les vendeurs sans quitter la plateforme.' },
    { Icon: Shield,        title: 'Modération active',     desc: 'Notre équipe surveille les annonces pour garantir un environnement sain.' },
    { Icon: Smartphone,    title: 'Application mobile',    desc: 'Disponible sur iOS et Android pour gérer vos annonces où que vous soyez.' },
];

export default function APropos() {
    return (
        <div className="min-h-screen bg-[#f6f7f9]">

            {/* ── Hero — style Login (image + gradient jaune→vert + blur) ── */}
            <section className="relative overflow-hidden py-24">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: "url('https://i.pinimg.com/originals/3c/05/71/3c05716d80249529424e1a05b9f414c1.jpg')" }} />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FFC533]/85 to-[#009543]/85 backdrop-blur-[1px]" />
                </div>
                <div className="relative z-10 container mx-auto max-w-4xl px-4 text-center">
                    <span className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5 border border-white/20">
                        <Heart className="w-3.5 h-3.5" /> Notre histoire
                    </span>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-5">
                        À propos d'<span className="text-axio-jaune">Axioplace</span>
                    </h1>
                    <p className="text-white/80 text-lg max-w-2xl mx-auto leading-relaxed">
                        La première marketplace moderne et de confiance dédiée au marché congolais et africain.
                    </p>
                </div>
            </section>

            {/* ── Stats ── */}
            <div className="container mx-auto max-w-5xl px-4 -mt-8 mb-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {STATS.map(({ value, label }) => (
                        <div key={label} className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <p className="text-3xl font-extrabold text-axio-jaune mb-1">{value}</p>
                            <p className="text-gray-500 text-sm font-medium">{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="container mx-auto max-w-5xl px-4 pb-20 space-y-16">

                {/* ── Mission & Vision ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-all duration-300 group">
                        <div className="w-12 h-12 rounded-xl bg-axio-jaune/10 flex items-center justify-center mb-5 group-hover:bg-axio-jaune/20 transition-colors">
                            <Target className="w-6 h-6 text-axio-jaune" />
                        </div>
                        <h2 className="text-xl font-extrabold text-gray-900 mb-3">Notre mission</h2>
                        <p className="text-gray-500 leading-relaxed text-sm">
                            Axioplace a pour mission de démocratiser le commerce en ligne en République du Congo et sur le continent africain. Nous créons un espace numérique où chaque personne peut vendre, acheter, louer ou proposer un service en toute sécurité et simplicité — depuis un ordinateur ou un smartphone.
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-all duration-300 group">
                        <div className="w-12 h-12 rounded-xl bg-axio-vert/10 flex items-center justify-center mb-5 group-hover:bg-axio-vert/20 transition-colors">
                            <Eye className="w-6 h-6 text-axio-vert" />
                        </div>
                        <h2 className="text-xl font-extrabold text-gray-900 mb-3">Notre vision</h2>
                        <p className="text-gray-500 leading-relaxed text-sm">
                            Devenir la référence incontournable du commerce de particulier à particulier en Afrique centrale. Nous imaginons une plateforme où la confiance est le pilier de chaque échange et où l'entrepreneuriat local est valorisé et stimulé.
                        </p>
                    </div>
                </div>

                {/* ── Histoire ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="border-l-4 border-axio-jaune p-8">
                        <div className="flex items-center gap-3 mb-5">
                            <TrendingUp className="w-6 h-6 text-axio-vert" />
                            <h2 className="text-2xl font-extrabold text-gray-900">Notre histoire</h2>
                        </div>
                        <div className="space-y-4 text-gray-600 leading-relaxed text-sm max-w-3xl">
                            <p>
                                Axioplace est né d'un constat simple : en République du Congo, acheter et vendre entre particuliers se fait encore principalement via des groupes WhatsApp et des réseaux informels, sans aucune garantie de sécurité ni de structuration.
                            </p>
                            <p>
                                Face à ce manque, notre équipe a décidé de créer une solution locale, pensée pour les réalités du marché congolais : une connexion mobile-first, une interface simple et accessible, et des mécanismes de modération pour protéger les utilisateurs.
                            </p>
                            <p>
                                Axioplace est aujourd'hui une plateforme complète accessible via le web et les applications mobiles iOS et Android, avec une messagerie intégrée, un système de signalement et un espace administrateur dédié.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Valeurs ── */}
                <div>
                    <div className="text-center mb-8">
                        <h2 className="section-title justify-center">Nos valeurs</h2>
                        <p className="section-sub">Les principes qui guident chaque décision que nous prenons</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {VALUES.map(({ Icon, title, desc }) => (
                            <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300 hover:border-axio-jaune/30 group">
                                <div className="w-10 h-10 rounded-xl bg-axio-jaune/10 flex items-center justify-center mb-4 group-hover:bg-axio-jaune/20 transition-colors">
                                    <Icon className="w-5 h-5 text-axio-jaune" />
                                </div>
                                <h3 className="font-extrabold text-gray-900 mb-2">{title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Fonctionnalités ── */}
                <div>
                    <div className="text-center mb-8">
                        <h2 className="section-title justify-center">Ce qu'offre Axioplace</h2>
                        <p className="section-sub">Une plateforme complète, pensée pour vous</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {FEATURES.map(({ Icon, title, desc }) => (
                            <div key={title} className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all duration-300 hover:border-axio-vert/20 group">
                                <div className="w-10 h-10 rounded-xl bg-axio-vert/10 flex items-center justify-center flex-shrink-0 group-hover:bg-axio-vert/20 transition-colors">
                                    <Icon className="w-5 h-5 text-axio-vert" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
                                    <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── CTA ── */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-axio-vert to-green-600 p-10 text-white text-center shadow-xl">
                    <div className="relative z-10">
                        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-axio-jaune" />
                        <h2 className="text-2xl md:text-3xl font-extrabold mb-3">Prêt à rejoindre Axioplace ?</h2>
                        <p className="text-white/80 mb-8 max-w-md mx-auto text-sm leading-relaxed">
                            Créez votre compte gratuitement et commencez à publier vos annonces dès aujourd'hui.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/register" className="inline-flex items-center gap-2 bg-axio-jaune text-gray-900 font-bold py-3 px-8 rounded-xl hover:bg-yellow-400 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95">
                                Créer un compte <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link to="/annonces" className="inline-flex items-center gap-2 bg-white/15 text-white font-bold py-3 px-8 rounded-xl hover:bg-white/25 transition-all duration-200 border border-white/30 active:scale-95">
                                Voir les annonces
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
