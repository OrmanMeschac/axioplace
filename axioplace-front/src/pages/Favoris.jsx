import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Clock, Search } from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';

export default function Favoris() {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();
    const [favoris, setFavoris] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) navigate('/login', { state: { from: { pathname: '/favoris' } } });
    }, [isAuthenticated, isLoading, navigate]);

    useEffect(() => {
        if (isAuthenticated) {
            api.get('/favoris')
                .then(r => setFavoris(r.data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [isAuthenticated]);

    const removeFavori = async (annonceId) => {
        try {
            await api.post(`/favoris/${annonceId}`);
            // L'API retourne les annonces directement (pas {annonce:{...}})
            setFavoris(prev => prev.filter(ad => ad.id !== annonceId));
        } catch (err) { console.error(err); }
    };

    if (isLoading || loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-axio-jaune rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-[#f6f7f9] min-h-screen py-10">
            <div className="container mx-auto max-w-7xl px-4">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                            <Heart className="w-8 h-8 text-red-500 fill-current" />
                            Mes Favoris
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {favoris.length} annonce{favoris.length !== 1 ? 's' : ''} sauvegardée{favoris.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <Link to="/annonces" className="btn-secondary py-2.5 px-5 text-sm">
                        Explorer les annonces
                    </Link>
                </div>

                {favoris.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
                        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Heart className="w-12 h-12 text-red-300" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-700 mb-2">Aucun favori pour le moment</h2>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            Parcourez les annonces et cliquez sur ❤️ pour ajouter vos coups de cœur ici.
                        </p>
                        <Link to="/annonces" className="btn-primary inline-flex">
                            <Search className="w-4 h-4" /> Découvrir des annonces
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {favoris.map(ad => {
                            // L'API retourne les annonces directement — pas {id, annonce:{}}
                            if (!ad?.id) return null;
                            const img = ad.photos?.[0]
                                ? `${import.meta.env.VITE_API_URL}/storage/${ad.photos[0].chemin}`
                                : null;
                            return (
                                <div key={ad.id} className="card overflow-hidden group flex flex-col">
                                    <Link to={`/annonces/${ad.id}`} className="block">
                                        <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                                            {img ? (
                                                <img src={img} alt={ad.titre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <span className="text-5xl">📋</span>
                                            )}
                                            <div className="absolute top-3 left-3 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center">
                                                <Heart className="w-4 h-4 fill-current" />
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-bold text-gray-900 truncate mb-1">{ad.titre}</h3>
                                            <p className="text-gray-400 text-xs flex items-center gap-1 mb-2">
                                                <MapPin className="w-3 h-3" /> {ad.ville?.nom || 'Non spécifié'}
                                            </p>
                                            <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-1">
                                                <span className="font-extrabold text-gray-900">
                                                    {ad.prix ? `${Number(ad.prix).toLocaleString('fr-FR')} FCFA` : 'Sur demande'}
                                                </span>
                                                <span className="text-gray-400 text-xs flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(ad.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                    <div className="px-4 pb-4 mt-auto">
                                        <button
                                            onClick={() => removeFavori(ad.id)}
                                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition text-xs font-semibold"
                                        >
                                            <Heart className="w-3.5 h-3.5 fill-current" /> Retirer des favoris
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
