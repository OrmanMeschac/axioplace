import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UploadCloud, CheckCircle2, X, AlertTriangle, Home, Car, Briefcase, Wrench, Monitor, Grid } from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';

// ── Config dynamique par nom de catégorie ──────────────────────────────────────
const CATEGORY_CONFIG = {
    'Immobilier': {
        icon: Home,
        label: 'Immobilier',
        showSurface: true,   surfaceLabel: 'Surface (m²)',   surfacePlaceholder: 'ex: 85',
        showPieces:  true,   piecesLabel:  'Nombre de pièces',
        typeOffres:  [
            { value: 'vente',     label: 'Vente' },
            { value: 'location',  label: 'Location' },
            { value: 'colocation',label: 'Colocation' },
            { value: 'terrain',   label: 'Terrain' },
        ],
    },
    'Véhicules': {
        icon: Car,
        label: 'Véhicules',
        showSurface: true,   surfaceLabel: 'Kilométrage (km)', surfacePlaceholder: 'ex: 45000',
        showPieces:  true,   piecesLabel:  'Année de fabrication',
        typeOffres:  [
            { value: 'vente',    label: 'Vente' },
            { value: 'location', label: 'Location' },
        ],
    },
    'Emploi': {
        icon: Briefcase,
        label: 'Emploi',
        showSurface: false,
        showPieces:  false,
        typeOffres:  [
            { value: 'vente',    label: 'Offre d\'emploi' },
            { value: 'location', label: 'Freelance / Mission' },
        ],
    },
    'Services': {
        icon: Wrench,
        label: 'Services',
        showSurface: false,
        showPieces:  false,
        typeOffres:  [
            { value: 'vente',    label: 'Prestation unique' },
            { value: 'location', label: 'Abonnement / Récurrent' },
        ],
    },
    'Multimédia': {
        icon: Monitor,
        label: 'Multimédia',
        showSurface: false,
        showPieces:  false,
        typeOffres:  [
            { value: 'vente',    label: 'Vente' },
            { value: 'location', label: 'Location' },
        ],
    },
    'Divers': {
        icon: Grid,
        label: 'Divers',
        showSurface: false,
        showPieces:  false,
        typeOffres:  [
            { value: 'vente',    label: 'Vente' },
            { value: 'location', label: 'Don / Échange' },
        ],
    },
};

const DEFAULT_CONFIG = {
    showSurface: false,
    showPieces: false,
    typeOffres: [
        { value: 'vente',    label: 'Vente' },
        { value: 'location', label: 'Location' },
    ],
};

// ── Modal de confirmation ─────────────────────────────────────────────────
function ConfirmModal({ onConfirm, onCancel, titre, loading }) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
                <div className="w-16 h-16 bg-axio-jaune/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <AlertTriangle className="w-8 h-8 text-axio-jaune" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 text-center mb-2">
                    Confirmer la publication
                </h3>
                <p className="text-gray-500 text-center text-sm mb-2">
                    Vous êtes sur le point de publier l'annonce :
                </p>
                <p className="text-center font-bold text-gray-800 bg-gray-50 rounded-xl px-4 py-3 mb-5 text-sm">
                    « {titre} »
                </p>
                <p className="text-gray-500 text-center text-xs mb-6 leading-relaxed">
                    Votre annonce sera soumise à validation par notre équipe avant d'être visible par le public. Vous serez notifié une fois l'annonce approuvée.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 btn-secondary py-3 rounded-xl disabled:opacity-50"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 btn-primary py-3 rounded-xl disabled:opacity-70"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                                Publication...
                            </span>
                        ) : (
                            '✅ Oui, publier'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Étape indicator ───────────────────────────────────────────────────────
function StepIndicator({ step }) {
    const steps = ['Informations', 'Détails', 'Photos'];
    return (
        <div className="flex items-center justify-center gap-0 mb-8">
            {steps.map((label, i) => {
                const num = i + 1;
                const active = step === num;
                const done   = step > num;
                return (
                    <div key={i} className="flex items-center">
                        <div className="flex flex-col items-center">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                                done   ? 'bg-axio-vert text-white' :
                                active ? 'bg-axio-jaune text-gray-900' :
                                         'bg-gray-100 text-gray-400'
                            }`}>
                                {done ? '✓' : num}
                            </div>
                            <span className={`text-xs mt-1 font-medium whitespace-nowrap ${active ? 'text-gray-900' : 'text-gray-400'}`}>
                                {label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`w-16 h-0.5 mb-5 mx-1 transition-all ${step > num ? 'bg-axio-vert' : 'bg-gray-200'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function PublishAnnonce() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const fileInputRef = useRef(null);

    const [step, setStep] = useState(1);
    const [categories, setCategories] = useState([]);
    const [villes, setVilles]         = useState([]);
    const [loading, setLoading]       = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [success, setSuccess]       = useState(false);
    const [error, setError]           = useState('');
    const [photos, setPhotos]         = useState([]);
    const [previews, setPreviews]     = useState([]);
    const [existingPhotos, setExistingPhotos] = useState([]); // Photos déjà en base
    const { id } = useParams();
    const isEdit = !!id;
    const dataLoadedRef = useRef(false); // Guard: évite que le useEffect de type_offre écrase les données chargées en mode édition

    const [formData, setFormData] = useState({
        titre: '', description: '', prix: '',
        categorie_id: '', ville_id: '',
        type_offre: 'vente',
        surface: '', nb_pieces: '',
        telephone_visible: true,
    });

    const selectedCatObj = categories.find(c => c.id == formData.categorie_id);
    const catName = selectedCatObj ? selectedCatObj.nom : '';
    const catConfig = CATEGORY_CONFIG[catName] || DEFAULT_CONFIG;
    const typeOffres = catConfig.typeOffres || DEFAULT_CONFIG.typeOffres;

    // Redirect si non connecté
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: { pathname: '/publier' } } });
        }
    }, [isAuthenticated, navigate]);

    // Charger données (Initialisation + Edit)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, villeRes] = await Promise.all([
                    api.get('/categories'),
                    api.get('/villes'),
                ]);
                setCategories(catRes.data);
                setVilles(villeRes.data);

                // Si mode édition, on charge l'annonce
                if (isEdit) {
                    setLoading(true);
                    const adRes = await api.get(`/annonces/${id}`);
                    const ad = adRes.data;
                    setFormData({
                        titre: ad.titre || '',
                        description: ad.description || '',
                        prix: ad.prix || '',
                        categorie_id: ad.categorie_id || '',
                        ville_id: ad.ville_id || '',
                        type_offre: ad.type_offre || 'vente',
                        surface: ad.surface || '',
                        nb_pieces: ad.nb_pieces || '',
                        telephone_visible: ad.telephone_visible === 1,
                    });
                    setExistingPhotos(ad.photos || []);
                }
            } catch (err) {
                setError('Impossible de charger les données.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, isEdit]);

    // Quand catégorie change : reset type_offre au premier disponible
    // Guard: ignorer le premier cycle en mode édition (données chargées depuis l'API)
    useEffect(() => {
        if (!dataLoadedRef.current) {
            // Premier cycle: on ne touche pas type_offre (sera défini par le fetch)
            dataLoadedRef.current = true;
            return;
        }
        if (typeOffres.length > 0) {
            setFormData(f => ({ ...f, type_offre: typeOffres[0].value }));
        }
    }, [formData.categorie_id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    };

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files);
        
        // Vérification de la taille des fichiers
        for (let f of files) {
            if (f.size > 5 * 1024 * 1024) {
                setError(`La photo "${f.name}" dépasse la limite de 5 Mo.`);
                return;
            }
        }

        const totalActual = photos.length + existingPhotos.length;
        if (totalActual >= 5) {
            setError('Maximum 5 photos autorisées.');
            return;
        }
        const available = 5 - totalActual;
        const toAdd = files.slice(0, available);
        if (files.length > available) setError(`Seulement ${available} photo(s) ajoutée(s) — limite de 5 atteinte.`);
        else setError('');
        setPhotos(prev => [...prev, ...toAdd]);
        setPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
    };

    const removePhoto = (index) => {
        URL.revokeObjectURL(previews[index]);
        setPhotos(prev  => prev.filter((_, i)  => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    // Navigation entre étapes
    const nextStep = () => {
        setError('');
        if (step === 1) {
            if (!formData.titre || !formData.categorie_id || !formData.ville_id) {
                setError('Veuillez remplir les champs obligatoires : Titre, Catégorie et Ville.');
                return;
            }
        }
        if (step === 2) {
            if (!formData.prix || !formData.description) {
                setError('Veuillez remplir la Description et le Prix.');
                return;
            }
        }
        setStep(s => Math.min(s + 1, 3));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const prevStep = () => {
        setError('');
        setStep(s => Math.max(s - 1, 1));
    };

    // Ouvre le modal de confirmation (uniquement via clic sur le bouton "Publier")
    const openConfirm = () => {
        setError('');
        if (!formData.titre) { setError('Le titre est obligatoire.'); setStep(1); return; }
        if (!formData.prix || !formData.description) { setError('Veuillez remplir la Description et le Prix.'); setStep(2); return; }
        setShowConfirm(true);
    };

    // Publication réelle après confirmation
    const handleConfirm = async () => {
        setLoading(true);
        setError('');
        try {
            const data = new FormData();
            if (isEdit) data.append('_method', 'PUT');

            Object.entries(formData).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    data.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value);
                }
            });

            // On renvoie les IDs des photos existantes qu'on garde
            if (isEdit) {
                if (existingPhotos.length === 0) {
                    data.append('existing_photos', ''); // Indique qu'on veut tout supprimer
                } else {
                    existingPhotos.forEach(p => data.append('existing_photos[]', p.id));
                }
            }

            // Nouvelles photos
            photos.forEach(photo => data.append('photos[]', photo));

            const url = isEdit ? `/annonces/${id}` : '/annonces';
            await api.post(url, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setShowConfirm(false);
            setSuccess(true);
        } catch (err) {
            setShowConfirm(false);
            if (err.response?.status === 422) {
                const errors = err.response.data.errors;
                setError(Object.values(errors)[0]?.[0] || 'Données invalides. Vérifiez le formulaire.');
                setStep(1);
            } else {
                setError(err.response?.data?.message || 'Erreur lors de la publication. Réessayez.');
            }
        } finally {
            setLoading(false);
        }
    };

    // ── Écran succès ─────────────────────────────────────────────────────
    if (success) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center bg-[#f6f7f9] p-4">
                <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center max-w-md w-full animate-scale-in">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-3">
                        {isEdit ? 'Annonce modifiée !' : 'Annonce soumise avec succès !'}
                    </h2>
                    <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-5 text-left">
                        <p className="text-green-800 font-semibold text-sm mb-1">✅ Ce qui se passe maintenant :</p>
                        <ul className="text-green-700 text-sm space-y-1 list-disc list-inside">
                            <li>Votre annonce est en cours de validation</li>
                            <li>Notre équipe l'examine sous 24–48h</li>
                            <li>Elle sera visible une fois approuvée</li>
                        </ul>
                    </div>
                    <p className="text-gray-400 text-sm mb-6">Vous pouvez suivre l'état de votre annonce dans votre profil.</p>
                    <div className="flex gap-3">
                        <button onClick={() => navigate('/profil')} className="flex-1 btn-secondary py-3 rounded-xl text-sm">
                            Mon profil
                        </button>
                        {isEdit ? (
                            <button onClick={() => navigate(`/annonces/${id}`)} className="flex-1 btn-primary py-3 rounded-xl text-sm">
                                Voir l'annonce
                            </button>
                        ) : (
                            <button onClick={() => { setSuccess(false); setStep(1); setFormData({ titre:'', description:'', prix:'', categorie_id:'', ville_id:'', type_offre:'vente', surface:'', nb_pieces:'', telephone_visible:true }); setPhotos([]); setPreviews([]); dataLoadedRef.current = false; }}
                                className="flex-1 btn-primary py-3 rounded-xl text-sm">
                                Publier une autre
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#f6f7f9] min-h-screen py-10 px-4">
            {showConfirm && (
                <ConfirmModal
                    titre={formData.titre}
                    loading={loading}
                    onConfirm={handleConfirm}
                    onCancel={() => setShowConfirm(false)}
                />
            )}

            <div className="container mx-auto max-w-2xl">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-extrabold text-gray-900">
                        {isEdit ? 'Modifier mon annonce' : 'Publier une annonce'}
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">Remplissez les informations ci-dessous</p>
                </div>

                <StepIndicator step={step} />

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 md:p-8">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-5 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                            </div>
                        )}

                        <form id="publish-form" onSubmit={(e) => e.preventDefault()}>

                            {/* ── ÉTAPE 1 : INFORMATIONS ── */}
                            {step === 1 && (
                                <div className="space-y-5 animate-fade-in">
                                    <div>
                                        <label className="input-label">
                                            Titre de l'annonce <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="titre"
                                            value={formData.titre}
                                            onChange={handleChange}
                                            className="input-field"
                                            placeholder="ex: Appartement 3 pièces à Brazzaville"
                                            id="publish-titre"
                                            maxLength={200}
                                        />
                                        <p className="text-xs text-gray-400 mt-1 text-right">{formData.titre.length}/200</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="input-label">
                                                Catégorie <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="categorie_id"
                                                value={formData.categorie_id}
                                                onChange={handleChange}
                                                className="input-field"
                                                id="publish-categorie"
                                            >
                                                <option value="">Sélectionner...</option>
                                                {categories.map(c => (
                                                    <option key={c.id} value={c.id}>{c.nom}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="input-label">
                                                Ville <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="ville_id"
                                                value={formData.ville_id}
                                                onChange={handleChange}
                                                className="input-field"
                                                id="publish-ville"
                                            >
                                                <option value="">Sélectionner...</option>
                                                {villes.map(v => (
                                                    <option key={v.id} value={v.id}>{v.nom}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Type d'offre dynamique selon catégorie */}
                                    <div>
                                        <label className="input-label">
                                            Type d'offre <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex flex-wrap gap-2" id="publish-type-offre">
                                            {typeOffres.map(t => (
                                                <label key={t.value}
                                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all text-sm font-semibold ${
                                                        formData.type_offre === t.value
                                                            ? 'bg-axio-jaune border-axio-jaune text-gray-900'
                                                            : 'bg-white border-gray-200 text-gray-600 hover:border-axio-jaune'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="type_offre"
                                                        value={t.value}
                                                        checked={formData.type_offre === t.value}
                                                        onChange={handleChange}
                                                        className="hidden"
                                                    />
                                                    {t.label}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Champ téléphone visible */}
                                    <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-axio-jaune transition">
                                        <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${formData.telephone_visible ? 'bg-axio-jaune' : 'bg-gray-300'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.telephone_visible ? 'translate-x-4' : ''}`} />
                                        </div>
                                        <input type="checkbox" name="telephone_visible" checked={formData.telephone_visible} onChange={handleChange} className="hidden" />
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700">Afficher mon numéro de téléphone</p>
                                            <p className="text-xs text-gray-400">Les acheteurs pourront vous contacter directement</p>
                                        </div>
                                    </label>
                                </div>
                            )}

                            {/* ── ÉTAPE 2 : DÉTAILS ── */}
                            {step === 2 && (
                                <div className="space-y-5 animate-fade-in">
                                    <div>
                                        <label className="input-label">
                                            Prix (FCFA) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="prix"
                                                value={formData.prix}
                                                onChange={handleChange}
                                                min="0"
                                                className="input-field pr-16"
                                                placeholder="0"
                                                id="publish-prix"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium pointer-events-none">
                                                FCFA
                                            </span>
                                        </div>
                                        {formData.prix && (
                                            <p className="text-xs text-axio-vert mt-1 font-medium">
                                                = {Number(formData.prix).toLocaleString('fr-FR')} FCFA
                                            </p>
                                        )}
                                    </div>

                                    {/* Champs dynamiques selon catégorie */}
                                    {(catConfig.showSurface || catConfig.showPieces) && (
                                        <div className="grid grid-cols-2 gap-4">
                                            {catConfig.showSurface && (
                                                <div>
                                                    <label className="input-label">
                                                        {catConfig.surfaceLabel || 'Surface (m²)'}
                                                        <span className="text-gray-400 font-normal ml-1">— optionnel</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="surface"
                                                        value={formData.surface}
                                                        onChange={handleChange}
                                                        min="0"
                                                        className="input-field"
                                                        placeholder={catConfig.surfacePlaceholder || 'ex: 85'}
                                                        id="publish-surface"
                                                    />
                                                </div>
                                            )}
                                            {catConfig.showPieces && (
                                                <div>
                                                    <label className="input-label">
                                                        {catConfig.piecesLabel || 'Nombre de pièces'}
                                                        <span className="text-gray-400 font-normal ml-1">— optionnel</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="nb_pieces"
                                                        value={formData.nb_pieces}
                                                        onChange={handleChange}
                                                        min="0"
                                                        className="input-field"
                                                        placeholder="ex: 3"
                                                        id="publish-pieces"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <label className="input-label">
                                            Description <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows={6}
                                            className="input-field resize-none"
                                            placeholder="Décrivez votre annonce en détail : état, équipements, conditions, informations de contact..."
                                            id="publish-description"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">{formData.description.length} caractères · Plus c'est détaillé, mieux c'est !</p>
                                    </div>
                                </div>
                            )}

                            {/* ── ÉTAPE 3 : PHOTOS ── */}
                            {step === 3 && (
                                <div className="space-y-5 animate-fade-in">
                                    <div>
                                        <label className="input-label">
                                            Photos <span className="text-gray-400 font-normal">&mdash; max 5 &middot; JPG, PNG, WebP &middot; 5MB max par photo</span>
                                        </label>

                                        {/* Zone d'upload — bouton avec ref pour garantir l'ouverture du file picker */}
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-8 cursor-pointer hover:border-axio-jaune hover:bg-yellow-50/30 transition-all group"
                                            id="photo-upload-zone"
                                        >
                                            <UploadCloud className="w-12 h-12 text-gray-300 group-hover:text-axio-jaune mb-3 transition-colors" />
                                            <p className="text-gray-600 font-semibold">Cliquez ici pour sélectionner vos photos</p>
                                            <p className="text-gray-400 text-sm mt-1">{(photos.length + existingPhotos.length)}/5 photo{(photos.length + existingPhotos.length) !== 1 ? 's' : ''} sélectionnée{(photos.length + existingPhotos.length) !== 1 ? 's' : ''} &mdash; max 5</p>
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            multiple
                                            className="hidden"
                                            onChange={handlePhotoChange}
                                        />
                                    </div>

                                    {(existingPhotos.length > 0 || previews.length > 0) && (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                            {/* Photos existantes */}
                                            {existingPhotos.map((p, i) => (
                                                <div key={`old-${p.id}`} className="relative group aspect-square">
                                                    <img
                                                        src={`${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:8000'}/storage/${p.chemin?.replace(/\\/g, '/')}`}
                                                        alt=""
                                                        className="w-full h-full object-cover rounded-xl border border-gray-200"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setExistingPhotos(prev => prev.filter(x => x.id !== p.id))}
                                                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-600 shadow-lg"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            {/* Nouvelles photos */}
                                            {previews.map((src, i) => (
                                                <div key={`new-${i}`} className="relative group aspect-square">
                                                    <img
                                                        src={src}
                                                        alt=""
                                                        className="w-full h-full object-cover rounded-xl border border-gray-200"
                                                    />
                                                    {i === 0 && existingPhotos.length === 0 && (
                                                        <span className="absolute bottom-1 left-1 bg-axio-jaune text-yellow-900 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                                            Principale
                                                        </span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => removePhoto(i)}
                                                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-600 shadow-lg"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Récapitulatif */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-2">
                                        <h4 className="font-bold text-gray-900 text-sm mb-3">📋 Récapitulatif de votre annonce</h4>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                            <span className="text-gray-500">Titre</span>
                                            <span className="font-medium text-gray-900 truncate">{formData.titre || '—'}</span>
                                            <span className="text-gray-500">Catégorie</span>
                                            <span className="font-medium text-gray-900">{categories.find(c => c.id == formData.categorie_id)?.nom || '—'}</span>
                                            <span className="text-gray-500">Ville</span>
                                            <span className="font-medium text-gray-900">{villes.find(v => v.id == formData.ville_id)?.nom || '—'}</span>
                                            <span className="text-gray-500">Prix</span>
                                            <span className="font-bold text-axio-jaune">{formData.prix ? `${Number(formData.prix).toLocaleString('fr-FR')} FCFA` : '—'}</span>
                                            <span className="text-gray-500">Photos</span>
                                            <span className="font-medium text-gray-900">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </form>

                        {/* Navigation étapes */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                            {step > 1 ? (
                                <button type="button" onClick={prevStep} className="btn-secondary py-3 px-6 rounded-xl text-sm">
                                    ← Précédent
                                </button>
                            ) : <div />}

                            {step < 3 ? (
                                <button type="button" onClick={nextStep} className="btn-primary py-3 px-8 rounded-xl text-sm">
                                    Suivant →
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={openConfirm}
                                    disabled={loading}
                                    className="btn-primary py-3 px-8 rounded-xl text-sm disabled:opacity-70"
                                    id="publish-submit-btn"
                                >
                                    {isEdit ? '💾 Enregistrer les modifications' : '📤 Publier mon annonce'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
