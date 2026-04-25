import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Heart, Clock, X, SlidersHorizontal } from 'lucide-react';
import api from '../lib/axios';
import AnnonceCard, { CardSkeleton as Skeleton } from '../components/AnnonceCard';

// ── Card annonce ──────────────────────────────────────────────────────────

// ── Page principale ───────────────────────────────────────────────────────
export default function Annonces() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [annonces,     setAnnonces]     = useState([]);
    const [categories,   setCategories]   = useState([]);  // ← depuis l'API
    const [villes,       setVilles]       = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [showFilters,  setShowFilters]  = useState(false);

    // Filtres — initialisés depuis l'URL
    const [searchQ, setSearchQ] = useState(searchParams.get('q') || searchParams.get('recherche') || '');
    const [catId,   setCatId]   = useState(searchParams.get('categorie_id') || '');
    const [prixMin, setPrixMin] = useState('');
    const [prixMax, setPrixMax] = useState('');
    const [ville,   setVille]   = useState('');

    // Compteur de déclenchement manuel (bouton Rechercher)
    const [fetchKey, setFetchKey] = useState(0);

    // ── Chargement initial des métadonnées ──────────────────────────────
    useEffect(() => {
        Promise.all([
            api.get('/categories').catch(() => ({ data: [] })),
            api.get('/villes').catch(() => ({ data: [] })),
        ]).then(([catRes, villeRes]) => {
            setCategories(catRes.data);
            setVilles(villeRes.data);
        });
    }, []);

    // ── Fetch annonces — se déclenche sur tout changement de filtre ────
    const fetchAnnonces = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (catId)   params.categorie_id = catId;
            if (searchQ) params.q = searchQ;
            if (prixMin) params.prix_min = prixMin;
            if (prixMax) params.prix_max = prixMax;
            if (ville)   params.ville_id = ville;

            const response = await api.get('/annonces', { params });
            setAnnonces(response.data.data || response.data || []);
        } catch (error) {
            console.error('Erreur annonces:', error);
            setAnnonces([]);
        } finally {
            setLoading(false);
        }
    }, [catId, searchQ, prixMin, prixMax, ville, fetchKey]);

    useEffect(() => {
        fetchAnnonces();
    }, [fetchAnnonces]);

    // ── Actions ─────────────────────────────────────────────────────────
    const handleSearch = (e) => {
        e.preventDefault();
        const params = {};
        if (searchQ) params.q = searchQ;
        if (catId)   params.categorie_id = catId;
        setSearchParams(params);
        setFetchKey(k => k + 1); // Force re-fetch même si les valeurs n'ont pas changé
    };

    const handleCatChange = (id) => {
        setCatId(id);
        // La mise à jour de catId suffit à déclencher le useEffect via fetchAnnonces
    };

    const resetFilters = () => {
        setSearchQ(''); setCatId(''); setPrixMin(''); setPrixMax(''); setVille('');
        setSearchParams({});
        setFetchKey(k => k + 1);
    };

    const hasFilters = catId || prixMin || prixMax || ville || searchQ;

    // Catégories pour les pills : "Toutes" + catégories de l'API
    const catPills = [{ id: '', nom: 'Toutes' }, ...categories];

    return (
        <div className="bg-[#f6f7f9] min-h-screen">

            {/* ── Header sticky avec filtres ── */}
            <div className="bg-white border-b border-gray-100 shadow-sm sticky top-16 z-20">
                <div className="container mx-auto max-w-7xl px-4 py-3">
                    <form onSubmit={handleSearch} className="flex items-center gap-3">

                        {/* Champ de recherche */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher une annonce..."
                                value={searchQ}
                                onChange={e => setSearchQ(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-axio-jaune/50 focus:border-axio-jaune text-sm"
                                id="annonces-search-input"
                            />
                        </div>

                        {/* Pills catégories (IDs réels depuis l'API) */}
                        <div className="hidden md:flex items-center gap-1 overflow-x-auto hide-scrollbar max-w-xs lg:max-w-none">
                            {catPills.map(c => (
                                <button
                                    key={c.id ?? 'all'}
                                    type="button"
                                    onClick={() => handleCatChange(c.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                                        catId === c.id
                                            ? 'bg-axio-jaune text-gray-900'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                    id={`cat-pill-${c.id || 'all'}`}
                                >
                                    {c.nom}
                                </button>
                            ))}
                        </div>

                        {/* Bouton filtres avancés */}
                        <button
                            type="button"
                            onClick={() => setShowFilters(v => !v)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all flex-shrink-0 ${
                                showFilters ? 'bg-axio-jaune border-axio-jaune text-gray-900' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                            id="toggle-filters-btn"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            <span className="hidden sm:inline">Filtres</span>
                            {hasFilters && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
                        </button>

                        <button type="submit" className="btn-primary py-2.5 px-5 text-sm rounded-xl flex-shrink-0" id="annonces-search-btn">
                            <Search className="w-4 h-4" />
                        </button>
                    </form>

                    {/* Filtres avancés dépliables */}
                    {showFilters && (
                        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3 animate-slide-down">
                            {/* Catégorie — depuis l'API */}
                            <select
                                value={catId}
                                onChange={e => handleCatChange(e.target.value)}
                                className="input-field py-2 text-sm"
                            >
                                <option value="">Toutes les catégories</option>
                                {categories.map(c => (
                                    <option key={c.id} value={String(c.id)}>{c.nom}</option>
                                ))}
                            </select>

                            {/* Ville — depuis l'API */}
                            <select
                                value={ville}
                                onChange={e => setVille(e.target.value)}
                                className="input-field py-2 text-sm"
                            >
                                <option value="">Toutes les villes</option>
                                {villes.map(v => (
                                    <option key={v.id} value={String(v.id)}>{v.nom}</option>
                                ))}
                            </select>

                            {/* Prix min */}
                            <input
                                type="number"
                                placeholder="Prix min (FCFA)"
                                value={prixMin}
                                onChange={e => setPrixMin(e.target.value)}
                                className="input-field py-2 text-sm"
                                min="0"
                            />

                            {/* Prix max + reset */}
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Prix max (FCFA)"
                                    value={prixMax}
                                    onChange={e => setPrixMax(e.target.value)}
                                    className="input-field py-2 text-sm flex-1"
                                    min="0"
                                />
                                {hasFilters && (
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="px-3 py-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition text-xs font-semibold flex items-center gap-1 flex-shrink-0"
                                    >
                                        <X className="w-3 h-3" /> Reset
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Contenu principal ── */}
            <div className="container mx-auto max-w-7xl px-4 py-8">

                {/* Titre + compteur */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900">
                            {catId && categories.find(c => String(c.id) === catId)
                                ? `Annonces — ${categories.find(c => String(c.id) === catId).nom}`
                                : 'Toutes les annonces'}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {loading
                                ? 'Chargement...'
                                : `${annonces.length} résultat${annonces.length > 1 ? 's' : ''} trouvé${annonces.length > 1 ? 's' : ''}`}
                        </p>
                    </div>

                    {/* Catégorie active — mobile */}
                    {catId && (
                        <button
                            onClick={() => handleCatChange('')}
                            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 bg-axio-jaune/20 text-axio-vert rounded-xl text-xs font-semibold"
                        >
                            {categories.find(c => String(c.id) === catId)?.nom}
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>

                {/* Grille */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}
                    </div>
                ) : annonces.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {annonces.map(ad => <AnnonceCard key={ad.id} ad={ad} />)}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                            🔍
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">Aucune annonce trouvée</h3>
                        <p className="text-gray-500 mb-6">
                            {hasFilters
                                ? 'Aucun résultat pour ces critères. Essayez de les modifier.'
                                : 'Aucune annonce disponible pour le moment. Soyez le premier à publier !'}
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            {hasFilters && (
                                <button onClick={resetFilters} className="btn-secondary">
                                    Réinitialiser les filtres
                                </button>
                            )}
                            <Link to="/publier" className="btn-primary">
                                📤 Publier une annonce
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
