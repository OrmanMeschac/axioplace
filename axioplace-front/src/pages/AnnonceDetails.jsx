import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Heart, Share2, Phone, Mail, ChevronLeft, Calendar, Eye, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';

const API_STORAGE_URL = import.meta.env.VITE_API_URL + '/storage/';

export default function AnnonceDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [annonce, setAnnonce] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFavori, setIsFavori] = useState(false);
    const [showPhone, setShowPhone] = useState(false);
    const [currentPhoto, setCurrentPhoto] = useState(0);  // Carousel index

    // Signalement
    const [showSignalModal, setShowSignalModal] = useState(false);
    const [signalMotif, setSignalMotif] = useState('');
    const [signalLoading, setSignalLoading] = useState(false);
    const [signalSuccess, setSignalSuccess] = useState(false);

    // Message
    const [showMessModal, setShowMessModal] = useState(false);
    const [messageContent, setMessageContent] = useState('');
    const [messLoading, setMessLoading] = useState(false);
    const [messSuccess, setMessSuccess] = useState(false);

    // Fetch annonce + polling temps réel : rafraîchissement toutes les 15s
    // Cela garantit la synchronisation automatique entre mobile et web après une modification
    const intervalRef = useRef(null);
    const isMountedRef = useRef(true);

    const fetchAnnonce = useCallback(async () => {
        if (!isMountedRef.current) return;
        try {
            const response = await api.get(`/annonces/${id}`);
            if (isMountedRef.current) {
                setAnnonce(response.data);
                setIsFavori(response.data.is_favori);
            }
        } catch (err) {
            console.error(err);
            if (isMountedRef.current && !annonce) {
                if (err.response?.status === 403) setError('Cette annonce n\'est pas disponible.');
                else if (err.response?.status === 404) setError('Annonce introuvable.');
                else setError('Impossible de charger cette annonce.');
            }
        } finally {
            if (isMountedRef.current) setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        isMountedRef.current = true;
        fetchAnnonce();
        // Poll toutes les 15s pour récupérer les modifications en temps réel
        intervalRef.current = setInterval(fetchAnnonce, 15000);

        return () => {
            isMountedRef.current = false;
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchAnnonce]);

    const toggleFavori = async () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: { pathname: `/annonces/${id}` } } });
            return;
        }
        try {
            const res = await api.post(`/favoris/${id}`);
            setIsFavori(res.data.action === 'added');
        } catch (err) {
            console.error('Erreur favoris:', err);
        }
    };

    const handleSignalement = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setSignalLoading(true);
        try {
            await api.post('/signalements', {
                annonce_id: annonce.id,
                motif: signalMotif,
            });
            setSignalSuccess(true);
            setTimeout(() => {
                setShowSignalModal(false);
                setSignalSuccess(false);
                setSignalMotif('');
            }, 2000);
        } catch (err) {
            console.error('Erreur signalement:', err);
        } finally {
            setSignalLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setMessLoading(true);
        try {
            await api.post('/messages', {
                destinataire_id: annonce.user.id,
                annonce_id: annonce.id,
                contenu: messageContent,
            });
            setMessSuccess(true);
            setMessageContent('');
        } catch (err) {
            console.error('Erreur message:', err);
        } finally {
            setMessLoading(false);
        }
    };

    const getPhotoUrl = (chemin) => {
        if (!chemin) return null;
        if (chemin.startsWith('http')) return chemin;
        return API_STORAGE_URL + chemin;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-[#ffcb30] rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !annonce) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{error || 'Annonce introuvable'}</h2>
                <Link to="/annonces" className="text-[#ffcb30] hover:text-yellow-600 font-medium">
                    Retour aux annonces
                </Link>
            </div>
        );
    }

    // Utiliser annonce.photos (champ correct de l'API)
    const photos = annonce.photos || [];
    const photoUrl = photos.length > 0 ? getPhotoUrl(photos[currentPhoto]?.chemin) : null;

    const goPrev = () => setCurrentPhoto(i => Math.max(0, i - 1));
    const goNext = () => setCurrentPhoto(i => Math.min(photos.length - 1, i + 1));

    return (
        <div className="bg-[#f4f7f9] min-h-screen py-8">
            <div className="container mx-auto max-w-6xl px-4">

                {/* Fil d'ariane & Bouton retour */}
                <div className="flex items-center gap-4 mb-6">
                    <Link to="/annonces" className="flex items-center text-gray-500 hover:text-gray-900 transition font-medium">
                        <ChevronLeft className="w-5 h-5 mr-1" /> Retour
                    </Link>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500 text-sm">{annonce.categorie?.nom || 'Détail de l\'annonce'}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Colonne Principale */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Galerie Image */}
                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                            {/* Galerie carousel */}
                        <div className="relative aspect-[16/9] bg-gray-100 flex items-center justify-center overflow-hidden">
                            {photoUrl ? (
                                <img
                                    key={currentPhoto}
                                    src={photoUrl}
                                    alt={annonce.titre}
                                    className="w-full h-full object-cover transition-opacity duration-300"
                                />
                            ) : (
                                <div className="flex flex-col items-center text-gray-400">
                                    <Eye className="w-12 h-12 mb-2" />
                                    <span className="font-medium">Aucune photo</span>
                                </div>
                            )}

                            {/* Overlay boutons navigation */}
                            {photos.length > 1 && (
                                <>
                                    {/* Bouton gauche */}
                                    {currentPhoto > 0 && (
                                        <button
                                            onClick={goPrev}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition shadow-lg"
                                            aria-label="Photo précédente"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                    )}
                                    {/* Bouton droit */}
                                    {currentPhoto < photos.length - 1 && (
                                        <button
                                            onClick={goNext}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition shadow-lg"
                                            aria-label="Photo suivante"
                                        >
                                            <ChevronLeft className="w-5 h-5 rotate-180" />
                                        </button>
                                    )}
                                    {/* Compteur */}
                                    <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                        {currentPhoto + 1}/{photos.length}
                                    </div>
                                    {/* Dots */}
                                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                                        {photos.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPhoto(i)}
                                                className={`h-1.5 rounded-full transition-all ${
                                                    i === currentPhoto ? 'w-5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Boutons action (favori + partage) */}
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button
                                    onClick={toggleFavori}
                                    className={`w-10 h-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center transition ${
                                        isFavori ? 'text-red-500' : 'text-gray-700 hover:text-red-500'
                                    }`}
                                >
                                    <Heart className={`w-5 h-5 ${isFavori ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                    onClick={() => navigator.share?.({ title: annonce.titre, url: window.location.href })}
                                    className="w-10 h-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-gray-700 hover:text-blue-500 transition"
                                >
                                    <Share2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                            {/* Miniatures cliquables */}
                            {photos.length > 1 && (
                                <div className="flex gap-2 p-3 overflow-x-auto">
                                    {photos.map((p, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPhoto(i)}
                                            className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${
                                                i === currentPhoto ? 'border-[#ffcb30]' : 'border-transparent hover:border-gray-300'
                                            }`}
                                        >
                                            <img
                                                src={getPhotoUrl(p.chemin)}
                                                alt={`Photo ${i + 1}`}
                                                className="w-16 h-16 object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Informations de l'annonce */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <div className="flex justify-between items-start mb-4 gap-4">
                                <h1 className="text-3xl font-bold text-gray-900 leading-tight">{annonce.titre}</h1>
                                <span className="text-3xl font-extrabold text-axio-vert whitespace-nowrap">
                                    {annonce.prix ? `${Number(annonce.prix).toLocaleString('fr-FR')} FCFA` : 'Sur demande'}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-100">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4" />
                                    {annonce.ville?.nom || 'Ville non spécifiée'}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    Publié le {new Date(annonce.created_at).toLocaleDateString('fr-FR')}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Eye className="w-4 h-4" />
                                    {annonce.nb_vues} vues
                                </span>
                                <span className="bg-yellow-50 text-yellow-800 border border-yellow-200 px-2.5 py-1 rounded-full text-xs font-semibold capitalize">
                                    {annonce.type_offre?.replace('_', ' ')}
                                </span>
                                {annonce.surface && (
                                    <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-medium">
                                        {annonce.surface} m²
                                    </span>
                                )}
                                {annonce.nb_pieces && (
                                    <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-medium">
                                        {annonce.nb_pieces} pièce{annonce.nb_pieces > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>

                            <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
                            <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                {annonce.description}
                            </div>
                        </div>
                    </div>

                    {/* Colonne Latérale (Vendeur) */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">À propos du vendeur</h3>

                            <div className="flex items-center gap-4 mb-6">
                                {annonce.user?.photo_profil ? (
                                    <img
                                        src={getPhotoUrl(annonce.user.photo_profil)}
                                        alt={annonce.user?.nom}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-[#ffcb30]"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div
                                    className="w-16 h-16 rounded-full bg-[#ffcb30]/20 flex items-center justify-center text-2xl font-bold text-[#b45309] uppercase"
                                    style={{ display: annonce.user?.photo_profil ? 'none' : 'flex' }}
                                >
                                    {annonce.user?.nom?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-lg">{annonce.user?.nom || 'Utilisateur'}</h4>
                                    <p className="text-sm text-gray-500">Membre Axioplace</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {annonce.user?.telephone && annonce.telephone_visible ? (
                                    showPhone ? (
                                        <a
                                            href={`tel:${annonce.user.telephone}`}
                                            className="w-full bg-[#ffcb30] hover:bg-[#eab308] text-gray-900 font-bold py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-2"
                                        >
                                            <Phone className="w-5 h-5" />
                                            {annonce.user.telephone}
                                        </a>
                                    ) : (
                                        <button
                                            onClick={() => isAuthenticated ? setShowPhone(true) : navigate('/login')}
                                            className="w-full bg-[#ffcb30] hover:bg-[#eab308] text-gray-900 font-bold py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-2"
                                        >
                                            <Phone className="w-5 h-5" />
                                            Afficher le numéro
                                        </button>
                                    )
                                ) : (
                                    <button disabled className="w-full bg-gray-100 text-gray-400 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                                        <Phone className="w-5 h-5" />
                                        Numéro masqué
                                    </button>
                                )}

                                <button
                                    onClick={() => isAuthenticated ? setShowMessModal(true) : navigate('/login')}
                                    className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-800 font-bold py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-2"
                                >
                                    <Mail className="w-5 h-5" />
                                    Envoyer un message
                                </button>
                                <Link
                                    to={`/vendeur/${annonce.user.id}`}
                                    className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 font-bold py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-2 mt-3"
                                >
                                    <Eye className="w-5 h-5" />
                                    Voir le profil
                                </Link>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-100 flex justify-center">
                                <button
                                    onClick={() => isAuthenticated ? setShowSignalModal(true) : navigate('/login')}
                                    className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                    Signaler cette annonce
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Signalement */}
            {showSignalModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        {signalSuccess ? (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Signalement envoyé</h3>
                                <p className="text-gray-500">Notre équipe va examiner cette annonce. Merci.</p>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Signaler cette annonce</h3>
                                <p className="text-gray-500 text-sm mb-6">
                                    Décrivez le problème rencontré avec cette annonce.
                                </p>
                                <form onSubmit={handleSignalement} className="space-y-4">
                                    <textarea
                                        value={signalMotif}
                                        onChange={(e) => setSignalMotif(e.target.value)}
                                        required
                                        rows="4"
                                        maxLength={300}
                                        placeholder="ex: Annonce frauduleuse, photos volées, prix trompeur..."
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                                    />
                                    <p className="text-xs text-gray-400 text-right">{signalMotif.length}/300</p>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowSignalModal(false)}
                                            className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={signalLoading || !signalMotif.trim()}
                                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
                                        >
                                            {signalLoading ? 'Envoi...' : 'Signaler'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Message */}
            {showMessModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        {messSuccess ? (
                            <div className="text-center py-6 animate-fade-in">
                                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">Message envoyé !</h3>
                                <p className="text-gray-500 mb-8">Votre message a été transmis au vendeur. Vous pouvez continuer la discussion dans votre messagerie.</p>
                                <button
                                    onClick={() => { setShowMessModal(false); setMessSuccess(false); }}
                                    className="w-full btn-primary py-3.5 rounded-xl shadow-lg glow-jaune"
                                >
                                    Fermer
                                </button>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Envoyer un message</h3>
                                <p className="text-gray-500 text-sm mb-6">
                                    Contactez le vendeur concernant son annonce.
                                </p>
                                <form onSubmit={handleSendMessage} className="space-y-4">
                                    <textarea
                                        value={messageContent}
                                        onChange={(e) => setMessageContent(e.target.value)}
                                        required
                                        rows="4"
                                        maxLength={1000}
                                        placeholder="Bonjour, je suis intéressé(e) par cette annonce..."
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                                    />
                                    <p className="text-xs text-gray-400 text-right">{messageContent.length}/1000</p>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowMessModal(false)}
                                            className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={messLoading || !messageContent.trim()}
                                            className="flex-1 btn-primary py-3 rounded-xl transition disabled:opacity-60"
                                        >
                                            {messLoading ? 'Envoi...' : 'Envoyer'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
