import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, Heart, Clock, MapPin, ChevronRight, TrendingUp, Shield, Users, AlertCircle, ChevronDown, Home as HomeIcon, Car, Briefcase, Wrench, Monitor, LayoutGrid } from 'lucide-react';
import api from '../lib/axios';
import AnnonceCard, { CardSkeleton } from '../components/AnnonceCard';

const CATEGORIES = [
    { id: 1, icon: HomeIcon,    nom: 'Immobilier' },
    { id: 2, icon: Car,         nom: 'Véhicules' },
    { id: 3, icon: Briefcase,   nom: 'Emploi' },
    { id: 4, icon: Wrench,      nom: 'Services' },
    { id: 5, icon: Monitor,     nom: 'Multimédia' },
    { id: 6, icon: LayoutGrid,  nom: 'Divers' },
];


function EmptyState({ message }) {
    return (
        <div className="col-span-full bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📭</div>
            <p className="text-gray-500 font-medium">{message}</p>
            <Link to="/publier" className="btn-primary inline-flex mt-4 text-sm">
                Publier la première annonce
            </Link>
        </div>
    );
}

export default function Home() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCat, setSelectedCat] = useState('');
    const [recentes, setRecentes]       = useState([]);
    const [populaires, setPopulaires]   = useState([]);
    const [stats, setStats]             = useState({ total: 0 });
    const [loadingPop, setLoadingPop]   = useState(true);
    const [loadingRec, setLoadingRec]   = useState(true);
    const [apiError, setApiError]       = useState(false);

    useEffect(() => {
        // Annonces récentes
        api.get('/annonces', { params: { per_page: 4 } })
            .then(r => {
                const data = r.data.data || r.data;
                setRecentes(Array.isArray(data) ? data.slice(0, 4) : []);
                setStats({ total: r.data.total || (Array.isArray(data) ? data.length : 0) });
            })
            .catch(() => setApiError(true))
            .finally(() => setLoadingRec(false));

        // Annonces "populaires" = les plus vues
        api.get('/annonces', { params: { per_page: 4, tri: 'prix_desc' } })
            .then(r => {
                const data = r.data.data || r.data;
                setPopulaires(Array.isArray(data) ? data.slice(0, 4) : []);
            })
            .catch(() => {})
            .finally(() => setLoadingPop(false));
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchQuery) params.set('recherche', searchQuery);
        if (selectedCat) params.set('categorie_id', selectedCat);
        window.location.href = `/annonces?${params.toString()}`;
    };

    return (
        <div className="w-full">

            {/* ─── HERO & CATÉGORIES ─── */}
            <section className="relative flex flex-col items-center justify-start overflow-visible pt-28 pb-32">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                         style={{ backgroundImage: "url('https://i.pinimg.com/originals/3c/05/71/3c05716d80249529424e1a05b9f414c1.jpg')" }}>
                    </div>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                </div>

                <div className="relative z-10 w-full max-w-5xl px-4 text-center mt-8 animate-fade-in-up">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-md">
                        Que recherchez-vous ?
                    </h1>
                    <p className="text-white/90 text-sm md:text-base font-medium mb-8 drop-shadow">
                        Explorez et trouvez des milliers d'annonces près de chez vous
                    </p>

                    <form onSubmit={handleSearch} className="bg-white/90 backdrop-blur-md rounded-2xl md:rounded-full shadow-2xl p-2 md:p-1.5 w-full max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-1 md:gap-2">
                        
                        {/* Dropdown HTML natif déguisé */}
                        <div className="relative w-full md:w-auto md:min-w-[160px] border-b md:border-b-0 md:border-r border-gray-100">
                            <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)}
                                className="appearance-none bg-transparent pl-6 pr-10 py-3 text-sm text-gray-900 font-semibold focus:outline-none w-full cursor-pointer">
                                <option value="">Toutes catégories</option>
                                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900 pointer-events-none" />
                        </div>

                        {/* Input recherche */}
                        <div className="flex-1 w-full px-4 py-2 md:py-3">
                            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Que recherchez-vous ?"
                                className="w-full bg-transparent focus:outline-none text-sm text-gray-900 placeholder-gray-500 font-medium" />
                        </div>

                        {/* Bouton filtres statique */}
                        <button type="button" className="hidden lg:flex items-center gap-2 px-4 py-3 text-sm font-bold text-gray-900 hover:text-axio-jaune transition">
                            <SlidersHorizontal className="w-4 h-4" /> Filtres
                        </button>

                        {/* Bouton valider */}
                        <button type="submit" className="bg-[#ffcb30] hover:bg-yellow-400 text-gray-900 flex items-center justify-center gap-2 rounded-xl md:rounded-full px-8 py-3.5 md:py-3 text-sm font-bold transition-transform active:scale-95 w-full md:w-auto">
                            Rechercher <ChevronRight className="w-4 h-4" />
                        </button>
                    </form>
                </div>

                {/* Barre des catégories intégrée sur la ligne de fondation */}
                <div className="absolute -bottom-16 left-0 right-0 z-20 w-full max-w-5xl mx-auto px-4 lg:px-0">
                    <div className="glass bg-white/70 backdrop-blur-2xl shadow-xl rounded-[2rem] p-3 flex overflow-x-auto hide-scrollbar items-center justify-between gap-1 w-full border border-white/60">
                        {CATEGORIES.map((cat, i) => {
                            const isActive = i === 0; // "Immobilier" est mis en évidence comme sur la maquette
                            const Icon = cat.icon;
                            
                            return (
                                <Link key={cat.id} to={`/annonces?categorie_id=${cat.id}`}
                                    className={`flex flex-col items-center justify-center flex-1 min-w-[100px] h-[100px] rounded-[1.5rem] transition-all duration-300 ${
                                        isActive ? 'bg-white shadow-[0_4px_15px_rgba(0,0,0,0.05)]' : 'hover:bg-white/40'
                                    }`}>
                                    <Icon className={`w-8 h-8 mb-2 ${isActive ? 'text-[#ffcb30]' : 'text-gray-500'}`} />
                                    <span className={`text-sm font-bold ${isActive ? 'text-[#ffcb30]' : 'text-gray-500'}`}>
                                        {cat.nom}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>
            
            {/* Espacement compensatoire pour la bannière Absolute */}
            <div className="h-24" />

            {/* Alerte si API inaccessible */}
            {apiError && (
                <div className="container mx-auto max-w-6xl px-4 mb-8">
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-amber-800 text-sm">Impossible de charger les annonces</p>
                            <p className="text-amber-700 text-xs mt-0.5">Vérifiez que le serveur Laravel est démarré sur le port 8000 avec : <code className="bg-amber-100 px-1 rounded">php artisan serve</code></p>
                        </div>
                    </div>
                </div>
            )}

  

            {/* ─── ANNONCES RÉCENTES ─── */}
            <section className="container mx-auto max-w-7xl px-4 mb-12">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="section-title"> Annonces Récentes</h2>
                        <p className="section-sub text-sm">Publiées récemment par notre communauté</p>
                    </div>
                    <Link to="/annonces" className="flex items-center gap-1 text-sm font-semibold text-axio-vert hover:text-green-700 transition">
                        Voir toutes <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {loadingRec
                        ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
                        : recentes.length > 0
                            ? recentes.map(ad => <AnnonceCard key={ad.id} ad={ad} />)
                            : <EmptyState message="Aucune annonce pour le moment. Soyez le premier à publier !" />
                    }
                </div>
            </section>

            {/* ─── ANNONCES POPULAIRES ─── */}
            <section className="container mx-auto max-w-7xl px-4 mb-12">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="section-title"> Annonces Populaires</h2>
                        <p className="section-sub text-sm">Les plus consultées du moment</p>
                    </div>
                    <Link to="/annonces" className="flex items-center gap-1 text-sm font-semibold text-axio-vert hover:text-green-700 transition">
                        Voir toutes <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {loadingPop
                        ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
                        : populaires.length > 0
                            ? populaires.map(ad => <AnnonceCard key={ad.id} ad={ad} />)
                            : <EmptyState message="Aucune annonce disponible pour le moment." />
                    }
                </div>
            </section>

            {/* ─── CTA BAN ─── */}
            <section className="container mx-auto max-w-7xl px-4 pb-16">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-axio-vert to-green-600 p-10 text-white text-center shadow-xl">
                    <div className="relative z-10">
                        <Shield className="w-12 h-12 mx-auto mb-4 text-axio-jaune" />
                        <h2 className="text-3xl font-extrabold mb-3">Publiez votre annonce gratuitement</h2>
                        <p className="text-white/80 max-w-xl mx-auto mb-6">
                            Rejoignez notre communauté et touchez des acheteurs rapidement. Inscription gratuite, annonce rapide.
                        </p>
                        <Link to="/publier" className="inline-flex items-center gap-2 bg-axio-jaune text-gray-900 font-bold px-8 py-3.5 rounded-xl hover:bg-yellow-400 transition-all shadow-lg">
                            Publier maintenant — C'est gratuit
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
