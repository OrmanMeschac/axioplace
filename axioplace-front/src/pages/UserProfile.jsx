import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Calendar, User, Eye } from 'lucide-react';
import api from '../lib/axios';
import AnnonceCard from '../components/AnnonceCard';

export default function UserProfile() {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [annonces, setAnnonces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchVendeur = async () => {
            try {
                const response = await api.get(`/users/${id}/annonces`);
                setUser(response.data.user);
                setAnnonces(response.data.annonces.data || []);
            } catch (err) {
                console.error(err);
                setError('Impossible de charger le profil de cet utilisateur.');
            } finally {
                setLoading(false);
            }
        };

        fetchVendeur();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-[#ffcb30] rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{error || 'Utilisateur introuvable'}</h2>
                <Link to="/annonces" className="text-[#ffcb30] hover:text-yellow-600 font-medium">
                    Retour aux annonces
                </Link>
            </div>
        );
    }

    const memberSince = new Date(user.created_at).toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="bg-[#f4f7f9] min-h-screen py-8">
            <div className="container mx-auto max-w-6xl px-4">
                
                {/* Fil d'ariane & Bouton retour */}
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => window.history.back()} className="flex items-center text-gray-500 hover:text-gray-900 transition font-medium">
                        <ChevronLeft className="w-5 h-5 mr-1" /> Retour
                    </button>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500 text-sm">Profil vendeur</span>
                </div>

                {/* En-tête du profil */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-24 bg-[#ffcb30]/10"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 mt-6">
                        {user.photo_profil ? (
                            <img
                                src={`${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:8000'}/storage/${String(user.photo_profil).replace(/^\/?storage\//, '')}`}
                                alt={user.nom}
                                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                        ) : null}
                        <div
                            className="w-24 h-24 rounded-full bg-[#ffcb30]/20 flex items-center justify-center text-4xl font-bold text-[#b45309] uppercase border-4 border-white shadow-md"
                            style={{ display: user.photo_profil ? 'none' : 'flex' }}
                        >
                            {user.nom?.charAt(0) || 'U'}
                        </div>

                        <div className="text-center md:text-left">
                            <h1 className="text-3xl font-extrabold text-gray-900">{user.nom}</h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2 text-gray-600">
                                <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full text-sm">
                                    <Calendar className="w-4 h-4" />
                                    Membre depuis {memberSince}
                                </span>
                                {user.telephone_verifie ? (
                                    <span className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                        ✓ Numéro vérifié
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section Annonces */}
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Ses annonces en ligne</h2>
                        <p className="text-gray-500 mt-1">{annonces.length} annonce(s) trouvée(s)</p>
                    </div>
                </div>

                {annonces.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {annonces.map(annonce => (
                            <AnnonceCard key={annonce.id} ad={annonce} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white p-12 rounded-2xl text-center border border-gray-100 shadow-sm">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Aucune annonce</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            Cet utilisateur n'a aucune annonce en ligne pour le moment.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
