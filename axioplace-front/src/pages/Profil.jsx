import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, LayoutList, Heart, Lock, Camera, Mail, Phone, Shield, Trash2, Eye, CheckCircle2, AlertCircle, Pencil } from 'lucide-react';
import api from '../lib/axios';
import AnnonceCard from '../components/AnnonceCard';

const TABS = [
    { id: 'profil',   label: 'Profil',        Icon: User },
    { id: 'annonces', label: 'Mes annonces',  Icon: LayoutList },
    { id: 'favoris',  label: 'Favoris',       Icon: Heart },
    { id: 'securite', label: 'Sécurité',      Icon: Lock },
];

function Alert({ type, message }) {
    if (!message) return null;
    const styles = type === 'success'
        ? 'bg-green-50 text-green-700 border-green-200'
        : 'bg-red-50 text-red-700 border-red-200';
    const Icon = type === 'success' ? CheckCircle2 : AlertCircle;
    return (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium mb-4 ${styles}`}>
            <Icon className="w-4 h-4 flex-shrink-0" /> {message}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Onglet Profil
// ─────────────────────────────────────────────────────────────
function TabProfil({ user, onUpdate }) {
    const [nom,      setNom]      = useState(user?.nom || '');
    const [email,    setEmail]    = useState(user?.email || '');
    const [telephone,setTel]      = useState(user?.telephone || '');
    const [loading,  setLoading]  = useState(false);
    const [feedback, setFeedback] = useState({ type: '', msg: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setFeedback({ type: '', msg: '' });
        try {
            const res = await api.put('/user/profil', { nom, email, telephone });
            onUpdate(res.data); // Met à jour globalement via AuthContext
            setFeedback({ type: 'success', msg: 'Profil mis à jour avec succès !' });
        } catch (err) {
            const msg = err.response?.data?.errors
                ? Object.values(err.response.data.errors)[0][0]
                : err.response?.data?.message || 'Erreur lors de la mise à jour.';
            setFeedback({ type: 'error', msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-axio-jaune" /> Informations personnelles
            </h2>
            <Alert type={feedback.type} message={feedback.msg} />
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="input-label">Nom complet</label>
                    <input type="text" value={nom} onChange={e => setNom(e.target.value)} className="input-field" required />
                </div>
                <div>
                    <label className="input-label">Adresse email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" required />
                </div>
                <div>
                    <label className="input-label">Téléphone <span className="text-gray-400 font-normal">(optionnel)</span></label>
                    <input type="tel" value={telephone} onChange={e => setTel(e.target.value)} className="input-field" placeholder="+242 06 XXX XX XX" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                    {loading ? 'Mise à jour...' : 'Mettre à jour'}
                </button>
            </form>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Onglet Mes Annonces
// ─────────────────────────────────────────────────────────────
function TabAnnonces() {
    const [annonces, setAnnonces] = useState([]);
    const [loading,  setLoading]  = useState(true);

    useEffect(() => {
        api.get('/mes-annonces')
            .then(r => setAnnonces(r.data.data || r.data || []))
            .catch(err => console.error('Erreur mes-annonces:', err))
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) return;
        try {
            await api.delete(`/annonces/${id}`);
            setAnnonces(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la suppression.');
        }
    };

    if (loading) {
        return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-gray-200 border-t-axio-jaune rounded-full animate-spin" /></div>;
    }

    if (annonces.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <LayoutList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-700 mb-2">Aucune annonce publiée</h3>
                <p className="text-gray-500 mb-4">Vous n'avez pas encore publié d'annonce.</p>
                <Link to="/publier" className="btn-primary inline-flex">Publier une annonce</Link>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {annonces.map(ad => (
                <div key={ad.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-sm transition">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {ad.photos?.[0] ? (
                            <img
                                src={`${import.meta.env.VITE_API_URL}/storage/${ad.photos[0].chemin.replace(/^\/?storage\//, '')}`}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={e => { e.target.style.display = 'none'; }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">📷</div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{ad.titre}</h4>
                        <p className="text-sm text-gray-500">
                            {ad.ville?.nom} · {ad.prix ? `${Number(ad.prix).toLocaleString('fr-FR')} FCFA` : 'Prix non défini'}
                        </p>
                        <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ad.statut === 'validee'    ? 'bg-green-100 text-green-700' :
                            ad.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-700' :
                            ad.statut === 'suspendue'  ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-500'
                        }`}>
                            {ad.statut === 'validee' ? '✅ Validée' :
                             ad.statut === 'en_attente' ? '⏳ En attente de validation' :
                             ad.statut === 'suspendue'  ? '⏸ Suspendue' : ad.statut}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Link to={`/annonces/${ad.id}`}
                            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
                            title="Voir l'annonce">
                            <Eye className="w-4 h-4" />
                        </Link>
                        <Link to={`/modifier-annonce/${ad.id}`}
                            className="p-2 rounded-xl bg-axio-jaune/20 hover:bg-axio-jaune/30 text-yellow-700 transition"
                            title="Modifier">
                            <Pencil className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDelete(ad.id)}
                            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition"
                            title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Onglet Favoris
// Le FavoriController retourne directement les annonces (pas {annonce: {...}})
// ─────────────────────────────────────────────────────────────
function TabFavoris() {
    const [favoris, setFavoris] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/favoris')
            .then(r => setFavoris(Array.isArray(r.data) ? r.data : []))
            .catch(err => console.error('Erreur favoris:', err))
            .finally(() => setLoading(false));
    }, []);

    const removeFavori = async (id) => {
        try {
            await api.post(`/favoris/${id}`);
            setFavoris(prev => prev.filter(ad => ad.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-gray-200 border-t-axio-jaune rounded-full animate-spin" /></div>;
    }

    if (favoris.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-700 mb-2">Aucun favori</h3>
                <p className="text-gray-500 mb-4">Vous n'avez pas encore ajouté d'annonce en favori.</p>
                <Link to="/annonces" className="btn-primary inline-flex">Explorer les annonces</Link>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            {favoris.map(ad => (
                <AnnonceCard key={ad.id} ad={ad} />
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Onglet Sécurité
// ─────────────────────────────────────────────────────────────
function TabSecurite() {
    const [form, setForm] = useState({
        current_password: '', password: '', password_confirmation: ''
    });
    const [loading,  setLoading]  = useState(false);
    const [feedback, setFeedback] = useState({ type: '', msg: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.password_confirmation) {
            setFeedback({ type: 'error', msg: 'Les nouveaux mots de passe ne correspondent pas.' });
            return;
        }
        setLoading(true);
        setFeedback({ type: '', msg: '' });
        try {
            await api.put('/user/password', form);
            setFeedback({ type: 'success', msg: 'Mot de passe modifié avec succès !' });
            setForm({ current_password: '', password: '', password_confirmation: '' });
        } catch (err) {
            const msg = err.response?.data?.errors
                ? Object.values(err.response.data.errors)[0][0]
                : err.response?.data?.message || 'Erreur lors du changement.';
            setFeedback({ type: 'error', msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-axio-vert" /> Changer de mot de passe
            </h2>
            <Alert type={feedback.type} message={feedback.msg} />
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="input-label">Mot de passe actuel</label>
                    <input
                        type="password"
                        value={form.current_password}
                        onChange={e => setForm({ ...form, current_password: e.target.value })}
                        className="input-field" required
                        id="sec-current-pwd"
                    />
                </div>
                <div>
                    <label className="input-label">Nouveau mot de passe</label>
                    <input
                        type="password"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        className="input-field" minLength={8} required
                        id="sec-new-pwd"
                        placeholder="Min. 8 caractères"
                    />
                </div>
                <div>
                    <label className="input-label">Confirmer le nouveau mot de passe</label>
                    <input
                        type="password"
                        value={form.password_confirmation}
                        onChange={e => setForm({ ...form, password_confirmation: e.target.value })}
                        className="input-field" minLength={8} required
                        id="sec-confirm-pwd"
                    />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full mt-2" id="sec-pwd-submit">
                    {loading ? 'Modification...' : '🛡 Changer le mot de passe'}
                </button>
            </form>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────
export default function Profil() {
    const { user, isAuthenticated, isLoading, setUser } = useAuth();
    const navigate     = useNavigate();
    const photoInputRef = useRef(null);

    const [activeTab,    setActiveTab]    = useState('profil');
    const [localUser,    setLocalUser]    = useState(null);
    const [stats,        setStats]        = useState({ annonces: 0, favoris: 0 });
    const [photoLoading, setPhotoLoading] = useState(false);

    // Redirect si pas connecté
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login', { state: { from: { pathname: '/profil' } } });
        }
    }, [isAuthenticated, isLoading, navigate]);

    // Charge l'utilisateur et ses stats
    useEffect(() => {
        if (user) {
            setLocalUser(user);
            Promise.all([
                api.get('/mes-annonces').catch(() => ({ data: { data: [], total: 0 } })),
                api.get('/favoris').catch(() => ({ data: [] })),
            ]).then(([ann, fav]) => {
                // Bug #7 Fix: mesAnnonces retourne une réponse paginée → utiliser .total
                const annCount = ann.data?.total ?? (ann.data?.data?.length ?? 0);
                const favCount = Array.isArray(fav.data) ? fav.data.length : 0;
                setStats({ annonces: annCount, favoris: favCount });
            });
        }
    }, [user]);

    // Bug #6 Fix: Met à jour l'utilisateur GLOBALEMENT (navbar + partout)
    const handleUserUpdate = (updatedUser) => {
        setLocalUser(updatedUser);
        setUser(updatedUser); // Propagation globale via AuthContext
    };

    // Upload photo de profil
    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoLoading(true);
        try {
            const fd = new FormData();
            fd.append('photo', file);
            const res = await api.post('/user/photo', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setLocalUser(res.data);
            setUser(res.data); // Mise à jour globale de la photo
        } catch (err) {
            console.error('Erreur photo:', err);
            alert('Impossible de mettre à jour la photo. Vérifiez le format (JPEG/PNG/WebP, max 2Mo).');
        } finally {
            setPhotoLoading(false);
            if (photoInputRef.current) photoInputRef.current.value = '';
        }
    };

    if (isLoading || !localUser) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-axio-jaune rounded-full animate-spin" />
            </div>
        );
    }

    const initiale = localUser.nom?.charAt(0)?.toUpperCase() || 'U';
    // Normalise le chemin pour éviter /storage/storage/ si l'API retourne déjà le préfixe
    const buildStorageUrl = (path) => {
        if (!path) return null;
        const clean = String(path).replace(/^\/?storage\//, '');
        return `${import.meta.env.VITE_API_URL}/storage/${clean}`;
    };

    return (
        <div className="bg-[#f6f7f9] min-h-screen pb-12">

            {/* ── Header dégradé ── */}
            <div className="container mx-auto max-w-5xl px-4 pt-6">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#d5a528] to-[#25903b] shadow-lg flex flex-col sm:flex-row items-center p-8 sm:p-10">
                    
                    {/* Avatar + bouton upload */}
                    <div className="relative flex-shrink-0 mb-6 sm:mb-0 sm:mr-8">
                        <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-white flex items-center justify-center">
                            {localUser.photo_profil ? (
                                <img
                                    src={buildStorageUrl(localUser.photo_profil)}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                    onError={e => { e.target.style.display = 'none'; }}
                                />
                            ) : (
                                <span className="text-4xl font-black text-gray-400">{initiale}</span>
                            )}
                            {photoLoading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => photoInputRef.current?.click()}
                            disabled={photoLoading}
                            title="Changer la photo de profil"
                            className="absolute -bottom-3 -right-3 w-10 h-10 bg-[#fbbd08] rounded-2xl flex items-center justify-center hover:bg-yellow-400 transition shadow-lg border-2 border-white disabled:opacity-50 cursor-pointer"
                        >
                            <Camera className="w-[18px] h-[18px] text-white" />
                        </button>
                        <input
                            ref={photoInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handlePhotoUpload}
                        />
                    </div>

                    {/* Informations utilisateur */}
                    <div className="text-center sm:text-left flex-1 w-full">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center sm:justify-start gap-2">
                            <span className="bg-white/20 p-1.5 rounded-xl"><User className="w-5 h-5 text-white stroke-[2.5]" /></span>
                            {localUser.nom}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-[15px] text-white/90 font-medium">
                            <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{localUser.email}</span>
                            {localUser.telephone && (
                                <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{localUser.telephone}</span>
                            )}
                        </div>
                        <div className="flex items-center justify-center sm:justify-start gap-3 mt-5">
                            <span className="bg-white/20 backdrop-blur-md border border-white/10 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                                <LayoutList className="w-4 h-4" /> {stats.annonces} annonce{stats.annonces > 1 ? 's' : ''}
                            </span>
                            <span className="bg-white/20 backdrop-blur-md border border-white/10 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                                <Heart className="w-4 h-4 fill-white" /> {stats.favoris} favoris
                            </span>
                        </div>
                    </div>

                </div>
            </div>

            {/* ── Navigation onglets ── */}
            <div className="container mx-auto max-w-5xl px-4 mt-2">
                <div className="flex gap-1 bg-white rounded-2xl p-1.5 mb-6 shadow-sm border border-gray-100 overflow-x-auto hide-scrollbar">
                    {TABS.map(({ id, label, Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-1 justify-center ${
                                activeTab === id
                                    ? 'bg-axio-jaune text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                            }`}
                            id={`tab-${id}`}
                        >
                            <Icon className="w-4 h-4" /> {label}
                        </button>
                    ))}
                </div>

                {/* Contenu onglet actif */}
                <div className="animate-fade-in">
                    {activeTab === 'profil'   && <TabProfil   user={localUser} onUpdate={handleUserUpdate} />}
                    {activeTab === 'annonces' && <TabAnnonces />}
                    {activeTab === 'favoris'  && <TabFavoris />}
                    {activeTab === 'securite' && <TabSecurite />}
                </div>
            </div>
        </div>
    );
}
