import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Clock, LayoutGrid, Home as HomeIcon, Car, Briefcase, Wrench, Monitor } from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES_ICONS = [
    { id: 1, icon: HomeIcon },
    { id: 2, icon: Car },
    { id: 3, icon: Briefcase },
    { id: 4, icon: Wrench },
    { id: 5, icon: Monitor },
    { id: 6, icon: LayoutGrid },
];

export default function AnnonceCard({ ad }) {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [liked, setLiked] = useState(ad.is_favori || false);
    const [loading, setLoading] = useState(false);

    const img = ad.photos && ad.photos.length > 0
        ? (ad.photos[0].chemin?.startsWith('http')
            ? ad.photos[0].chemin
            : `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:8000'}/storage/${ad.photos[0].chemin?.replace(/\\/g, '/')}`)
        : null;

    const toggleFavorite = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            navigate('/login', { state: { from: { pathname: window.location.pathname } } });
            return;
        }

        setLoading(true);
        try {
            const res = await api.post(`/favoris/${ad.id}`);
            setLiked(res.data.action === 'added');
        } catch (err) {
            console.error('Erreur favoris:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Link to={`/annonces/${ad.id}`} className="card flex flex-col group overflow-hidden block h-full">
            <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                {img ? (
                    <img src={img} alt={ad.titre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        {(() => {
                            const CatIcon = CATEGORIES_ICONS.find(c => c.id === ad.categorie_id)?.icon || LayoutGrid;
                            return <CatIcon className="w-10 h-10 text-gray-400" />;
                        })()}
                    </div>
                )}
                
                <button
                    onClick={toggleFavorite}
                    disabled={loading}
                    className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all z-10 ${
                        liked ? 'bg-red-500 text-white shadow-lg' : 'bg-black/20 text-white hover:bg-red-500 hover:scale-110'
                    } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    title={liked ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                    <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                </button>

                {ad.type_offre && (
                    <span className="absolute top-3 left-3 bg-axio-vert/90 text-white text-[10px] font-bold px-2 py-0.5 rounded capitalize shadow-sm">
                        {ad.type_offre.replace('_', ' ')}
                    </span>
                )}
            </div>
            
            <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-1 gap-2">
                    <h3 className="font-bold text-gray-900 text-base truncate flex-1" title={ad.titre}>{ad.titre}</h3>
                </div>
                
                <p className="text-gray-400 text-[11px] flex items-center gap-1 mb-3">
                    <MapPin className="w-3 h-3 flex-shrink-0" /> {ad.ville?.nom || 'Non spécifié'}
                    {ad.categorie && (
                        <span className="ml-auto bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[9px] font-semibold">
                            {ad.categorie.nom}
                        </span>
                    )}
                </p>

                {ad.description && (
                    <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-2 h-8">
                        {ad.description}
                    </p>
                )}

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                    <span className="font-extrabold text-gray-900 text-lg">
                        {ad.prix ? `${Number(ad.prix).toLocaleString('fr-FR')}` : 'Sur demande'}
                        {ad.prix && <span className="text-[10px] font-bold text-gray-400 ml-1">FCFA</span>}
                    </span>
                    <span className="text-gray-400 text-[10px] flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        {new Date(ad.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </span>
                </div>
            </div>
        </Link>
    );
}

export function CardSkeleton() {
    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse h-full">
            <div className="aspect-[4/3] bg-gradient-to-r from-gray-200 to-gray-100" />
            <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-8 bg-gray-100 rounded w-full" />
                <div className="flex justify-between items-center pt-2">
                    <div className="h-5 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
            </div>
        </div>
    );
}
