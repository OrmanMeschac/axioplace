import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, X, CheckCircle2, PenLine } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import api from '../lib/api';
import { Colors } from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';

// ── Config dynamique par nom de catégorie ──────────────────────────────────────
const CATEGORY_CONFIG = {
    'Immobilier': {
        showSurface: true,   surfaceLabel: 'Surface (m²)',   surfacePlaceholder: 'Ex: 85',
        showPieces:  true,   piecesLabel:  'Nombre de pièces',
        typeOffres:  [
            { value: 'vente', label: 'Vente' },
            { value: 'location', label: 'Location' },
            { value: 'colocation', label: 'Colocation' },
            { value: 'terrain', label: 'Terrain' }
        ],
    },
    'Véhicules': {
        showSurface: true,   surfaceLabel: 'Kilométrage (km)', surfacePlaceholder: 'Ex: 45000',
        showPieces:  true,   piecesLabel:  'Année de fabrication',
        typeOffres:  [
            { value: 'vente', label: 'Vente' },
            { value: 'location', label: 'Location' }
        ],
    },
    'Emploi': {
        showSurface: false, showPieces: false,
        typeOffres:  [
            { value: 'vente', label: "Offre d'emploi" },
            { value: 'location', label: 'Freelance / Mission' }
        ],
    },
    'Services': {
        showSurface: false, showPieces: false,
        typeOffres:  [
            { value: 'vente', label: 'Prestation unique' },
            { value: 'location', label: 'Abonnement / Récurrent' }
        ],
    },
    'Multimédia': {
        showSurface: false, showPieces: false,
        typeOffres:  [
            { value: 'vente', label: 'Vente' },
            { value: 'location', label: 'Location' }
        ],
    },
    'Divers': {
        showSurface: false, showPieces: false,
        typeOffres:  [
            { value: 'vente', label: 'Vente' },
            { value: 'location', label: 'Don / Échange' }
        ],
    },
};

const DEFAULT_CONFIG = {
    showSurface: false,
    showPieces: false,
    typeOffres: [
        { value: 'vente', label: 'Vente' },
        { value: 'location', label: 'Location' }
    ],
};

export default function PublierScreen({ navigation }) {
    const { isAuthenticated } = useAuth();

    const [titre, setTitre] = useState('');
    const [description, setDescription] = useState('');
    const [prix, setPrix] = useState('');
    const [typeOffre, setTypeOffre] = useState('vente');
    const [surface, setSurface] = useState('');
    const [nbPieces, setNbPieces] = useState('');
    const [categorieId, setCategorieId] = useState('');
    const [villeId, setVilleId] = useState('');
    const [telephoneVisible, setTelephoneVisible] = useState(true);
    const [photos, setPhotos] = useState([]);

    const [categories, setCategories] = useState([]);
    const [villes, setVilles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        Promise.all([
            api.get('/categories').catch(() => ({ data: [] })),
            api.get('/villes').catch(() => ({ data: [] })),
        ]).then(([catRes, villRes]) => {
            setCategories(catRes.data);
            setVilles(villRes.data);
            if (catRes.data.length) setCategorieId(String(catRes.data[0].id));
            if (villRes.data.length) setVilleId(String(villRes.data[0].id));
        });
    }, []);

    const selectedCatObj = categories.find(c => String(c.id) === String(categorieId));
    const catName = selectedCatObj ? selectedCatObj.nom : '';
    const catConfig = CATEGORY_CONFIG[catName] || DEFAULT_CONFIG;
    const typeOffresList = catConfig.typeOffres || DEFAULT_CONFIG.typeOffres;

    useEffect(() => {
        if (typeOffresList.length > 0 && !typeOffresList.some(t => t.value === typeOffre)) {
            setTypeOffre(typeOffresList[0].value);
        }
    }, [categorieId, typeOffresList]);

    const pickImages = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission requise', 'Autorisez l\'accès à votre galerie.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 1.0,
        });
        if (!result.canceled) {
            const available = 5 - photos.length;
            if (available <= 0) { Alert.alert('Limite atteinte', 'Maximum 5 photos autorisées.'); return; }
            
            // Vérification de la taille des fichiers
            for (let asset of result.assets) {
                if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
                    Alert.alert('Fichier trop volumineux', 'Chaque photo ne doit pas dépasser 5 Mo.');
                    return;
                }
            }

            const selected = result.assets.slice(0, available);
            setPhotos(prev => [...prev, ...selected]);
        }
    };

    const handlePublier = async () => {
        if (!titre.trim()) { Alert.alert('Erreur', 'Le titre est requis.'); return; }
        if (!description.trim()) { Alert.alert('Erreur', 'La description est requise.'); return; }
        if (!prix) { Alert.alert('Erreur', 'Le prix est requis.'); return; }
        if (!categorieId) { Alert.alert('Erreur', 'Sélectionnez une catégorie.'); return; }
        if (!villeId) { Alert.alert('Erreur', 'Sélectionnez une ville.'); return; }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('titre', titre);
            formData.append('description', description);
            formData.append('prix', prix);
            formData.append('type_offre', typeOffre);
            formData.append('categorie_id', categorieId);
            formData.append('ville_id', villeId);
            if (surface) formData.append('surface', surface);
            if (nbPieces) formData.append('nb_pieces', nbPieces);
            formData.append('telephone_visible', telephoneVisible ? '1' : '0');

            photos.forEach((photo, i) => {
                formData.append('photos[]', {
                    uri: photo.uri,
                    type: 'image/jpeg',
                    name: `photo_${i}.jpg`,
                });
            });

            await api.post('/annonces', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setSuccess(true);
        } catch (err) {
            const msg = err.response?.data?.errors
                ? Object.values(err.response.data.errors)[0][0]
                : err.response?.data?.message || 'Erreur lors de la publication.';
            Alert.alert('Erreur', msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.center}>
                    <View style={styles.emptyIconBg}>
                        <PenLine size={32} color={Colors.axioVert} />
                    </View>
                    <Text style={styles.centerTitle}>Connectez-vous pour publier</Text>
                    <TouchableOpacity
                        style={styles.loginBtnWrapper}
                        onPress={() => navigation.navigate('ProfilTab')}
                    >
                        <LinearGradient
                            colors={[Colors.axioJaune, '#f5b800']}
                            style={styles.loginBtnGradient}
                        >
                            <Text style={styles.loginBtnText}>Se connecter</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (success) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.center}>
                    <CheckCircle2 size={80} color={Colors.axioVert} />
                    <Text style={styles.successTitle}>Annonce publiée !</Text>
                    <Text style={styles.successSub}>Votre annonce est maintenant en ligne.</Text>
                    <TouchableOpacity
                        style={styles.loginBtnWrapper}
                        onPress={() => {
                            setSuccess(false);
                            setTitre(''); setDescription(''); setPrix('');
                            setPhotos([]); setSurface(''); setNbPieces('');
                            navigation.navigate('HomeTab');
                        }}
                    >
                        <LinearGradient
                            colors={[Colors.axioVert, Colors.axioVertDark]}
                            style={styles.loginBtnGradient}
                        >
                            <Text style={[styles.loginBtnText, { color: '#fff' }]}>Voir mes annonces</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
                <View style={styles.headerIconBg}>
                    <PenLine size={16} color="#fff" />
                </View>
                <Text style={styles.headerTitle}>Publier une annonce</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled">

                {/* Photos */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Photos ({photos.length}/5)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoList}>
                        <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImages}>
                            <Camera size={28} color={Colors.axioVert} />
                            <Text style={styles.addPhotoText}>Ajouter</Text>
                        </TouchableOpacity>
                        {photos.map((p, i) => (
                            <View key={i} style={styles.photoWrapper}>
                                <Image source={{ uri: p.uri }} style={styles.photoThumb} />
                                <TouchableOpacity
                                    style={styles.removePhoto}
                                    onPress={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                                >
                                    <X size={12} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* Infos de base */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informations</Text>

                    <Text style={styles.label}>Titre *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: Villa 4 pièces avec jardin"
                        placeholderTextColor={Colors.gray400}
                        value={titre} onChangeText={setTitre}
                    />

                    <Text style={styles.label}>Description *</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Décrivez votre bien en détail..."
                        placeholderTextColor={Colors.gray400}
                        value={description} onChangeText={setDescription}
                        multiline numberOfLines={5} textAlignVertical="top"
                    />

                    <Text style={styles.label}>Prix (FCFA) *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: 150000"
                        placeholderTextColor={Colors.gray400}
                        value={prix} onChangeText={setPrix}
                        keyboardType="numeric"
                    />
                </View>

                {/* Détails */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Détails</Text>

                    <Text style={styles.label}>Type d'offre *</Text>
                    <View style={styles.typeRow}>
                        {typeOffresList.map(t => (
                            <TouchableOpacity
                                key={t.value}
                                style={[styles.typePill, typeOffre === t.value && styles.typePillActive]}
                                onPress={() => setTypeOffre(t.value)}
                            >
                                {typeOffre === t.value ? (
                                    <LinearGradient
                                        colors={[Colors.axioJaune, '#f5b800']}
                                        style={styles.typePillGradient}
                                    >
                                        <Text style={styles.typePillTextActive}>
                                            {t.label}
                                        </Text>
                                    </LinearGradient>
                                ) : (
                                    <Text style={styles.typePillText}>
                                        {t.label}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Catégorie *</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker selectedValue={categorieId} onValueChange={setCategorieId} style={styles.picker}>
                            {categories.map(c => (
                                <Picker.Item key={c.id} label={c.nom} value={String(c.id)} />
                            ))}
                        </Picker>
                    </View>

                    <Text style={styles.label}>Ville *</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker selectedValue={villeId} onValueChange={setVilleId} style={styles.picker}>
                            {villes.map(v => (
                                <Picker.Item key={v.id} label={v.nom} value={String(v.id)} />
                            ))}
                        </Picker>
                    </View>

                    {(catConfig.showSurface || catConfig.showPieces) && (
                        <View style={styles.rowFields}>
                            {catConfig.showSurface && (
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>{catConfig.surfaceLabel}</Text>
                                    <TextInput style={styles.input} placeholder={catConfig.surfacePlaceholder} placeholderTextColor={Colors.gray400}
                                        value={surface} onChangeText={setSurface} keyboardType="numeric" />
                                </View>
                            )}
                            {catConfig.showPieces && (
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>{catConfig.piecesLabel}</Text>
                                    <TextInput style={styles.input} placeholder="Ex: 4" placeholderTextColor={Colors.gray400}
                                        value={nbPieces} onChangeText={setNbPieces} keyboardType="numeric" />
                                </View>
                            )}
                        </View>
                    )}

                    <View style={styles.switchRow}>
                        <Text style={styles.label}>Afficher mon téléphone</Text>
                        <TouchableOpacity
                            style={[styles.toggle, telephoneVisible && styles.toggleOn]}
                            onPress={() => setTelephoneVisible(v => !v)}
                        >
                            <View style={[styles.toggleThumb, telephoneVisible && styles.toggleThumbOn]} />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.publishBtn, loading && styles.publishBtnDisabled]}
                    onPress={handlePublier}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={[Colors.axioVert, Colors.axioVertDark]}
                        style={styles.publishBtnGradient}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <CheckCircle2 size={18} color="#fff" />
                                <Text style={styles.publishBtnText}>Publier l'annonce</Text>
                            </View>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    centerTitle: { fontSize: 20, fontWeight: '700', color: Colors.gray700, marginBottom: 20, textAlign: 'center' },
    successTitle: { fontSize: 26, fontWeight: '800', color: Colors.gray900, marginTop: 20, marginBottom: 8 },
    successSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24 },

    emptyIconBg: {
        width: 72, height: 72, borderRadius: 24,
        backgroundColor: Colors.axioVertLight,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
    },

    header: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: Colors.white, paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    headerIconBg: {
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: Colors.axioVert,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.gray900 },

    scrollContent: { padding: 16 },

    section: {
        backgroundColor: Colors.white, borderRadius: 18, padding: 16,
        marginBottom: 14, borderWidth: 1, borderColor: Colors.border,
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.gray900, marginBottom: 14 },

    label: { fontSize: 13, fontWeight: '700', color: Colors.gray700, marginBottom: 8, marginTop: 4 },
    input: {
        backgroundColor: Colors.gray50, borderRadius: 14, paddingHorizontal: 14,
        paddingVertical: 12, fontSize: 14, color: Colors.text,
        borderWidth: 1, borderColor: Colors.gray100, marginBottom: 4,
    },
    textArea: { minHeight: 110, textAlignVertical: 'top' },

    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
    typePill: {
        borderRadius: 20, overflow: 'hidden',
        borderWidth: 1.5, borderColor: Colors.border,
    },
    typePillActive: { borderColor: Colors.axioJaune },
    typePillGradient: {
        paddingHorizontal: 14, paddingVertical: 8,
    },
    typePillText: { fontSize: 13, fontWeight: '600', color: Colors.gray500, paddingHorizontal: 14, paddingVertical: 8 },
    typePillTextActive: { fontSize: 13, color: '#1f2937', fontWeight: '700' },

    pickerWrapper: {
        backgroundColor: Colors.gray50, borderRadius: 14,
        borderWidth: 1, borderColor: Colors.gray100, marginBottom: 4, overflow: 'hidden',
    },
    picker: { height: 48, color: Colors.text },

    rowFields: { flexDirection: 'row', gap: 12 },

    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
    toggle: {
        width: 48, height: 28, borderRadius: 14, backgroundColor: Colors.gray200,
        justifyContent: 'center', paddingHorizontal: 2,
    },
    toggleOn: { backgroundColor: Colors.axioVert },
    toggleThumb: {
        width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
    },
    toggleThumbOn: { alignSelf: 'flex-end' },

    photoList: { gap: 10, paddingVertical: 4 },
    addPhotoBtn: {
        width: 90, height: 90, borderRadius: 14,
        borderWidth: 2, borderColor: Colors.axioVert, borderStyle: 'dashed',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: Colors.axioVertLight, gap: 4,
    },
    addPhotoText: { fontSize: 11, color: Colors.axioVert, fontWeight: '700' },
    photoWrapper: { width: 90, height: 90, borderRadius: 14, overflow: 'hidden', position: 'relative' },
    photoThumb: { width: 90, height: 90, borderRadius: 14 },
    removePhoto: {
        position: 'absolute', top: 4, right: 4,
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: 'rgba(239,68,68,0.9)',
        alignItems: 'center', justifyContent: 'center',
    },

    publishBtn: {
        borderRadius: 18, overflow: 'hidden', marginBottom: 8,
        shadowColor: Colors.axioVert, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
    },
    publishBtnDisabled: { opacity: 0.7 },
    publishBtnGradient: {
        paddingVertical: 18, alignItems: 'center',
    },
    publishBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

    loginBtnWrapper: { borderRadius: 14, overflow: 'hidden' },
    loginBtnGradient: {
        paddingVertical: 14, paddingHorizontal: 32,
    },
    loginBtnText: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
});
