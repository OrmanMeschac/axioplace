<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Annonce;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AnnonceController extends Controller
{
    /**
     * Liste les annonces validées avec filtres.
     */
    public function index(Request $request)
    {
        $query = Annonce::with(['categorie', 'ville', 'photos'])
            ->where('statut', 'validee');

        if ($request->filled('categorie_id')) {
            $query->where('categorie_id', $request->categorie_id);
        }
        if ($request->filled('ville_id')) {
            $query->where('ville_id', $request->ville_id);
        }
        if ($request->filled('type_offre')) {
            $query->where('type_offre', $request->type_offre);
        }
        if ($request->filled('prix_min')) {
            $query->where('prix', '>=', $request->prix_min);
        }
        if ($request->filled('prix_max')) {
            $query->where('prix', '<=', $request->prix_max);
        }
        if ($request->filled('recherche') || $request->filled('q')) {
            $search = $request->filled('recherche') ? $request->recherche : $request->q;
            $keywords = explode(' ', $search);
            
            $query->where(function ($q) use ($keywords) {
                foreach ($keywords as $keyword) {
                    $q->where(function ($subQ) use ($keyword) {
                        $subQ->where('titre', 'like', "%{$keyword}%")
                             ->orWhere('description', 'like', "%{$keyword}%");
                    });
                }
            });
        }

        $tri = $request->get('tri', 'recent');
        match ($tri) {
            'prix_asc'      => $query->orderBy('prix'),
            'prix_desc'     => $query->orderByDesc('prix'),
            'nb_vues_desc'  => $query->orderByDesc('nb_vues'),
            default         => $query->latest(),
        };

        return response()->json($query->paginate(15));
    }

    /**
     * Liste les annonces de l'utilisateur connecté (tous statuts).
     */
    public function mesAnnonces(Request $request)
    {
        $query = Annonce::with(['categorie', 'ville', 'photos'])
            ->where('user_id', $request->user()->id);
            
        if ($request->filled('recherche') || $request->filled('q')) {
            $search = $request->filled('recherche') ? $request->recherche : $request->q;
            $keywords = explode(' ', $search);
            
            $query->where(function ($q) use ($keywords) {
                foreach ($keywords as $keyword) {
                    $q->where(function ($subQ) use ($keyword) {
                        $subQ->where('titre', 'like', "%{$keyword}%")
                             ->orWhere('description', 'like', "%{$keyword}%");
                    });
                }
            });
        }

        $annonces = $query->latest()->paginate(20);

        return response()->json($annonces);
    }


    /**
     * Affiche le détail d'une annonce.
     */
    public function show(Annonce $annonce)
    {
        $isOwner = auth('sanctum')->check() && auth('sanctum')->id() === $annonce->user_id;
        $isAdmin  = auth('sanctum')->check() && auth('sanctum')->user()->role === 'admin';

        if ($annonce->statut !== 'validee' && !$isOwner && !$isAdmin) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $annonce->increment('nb_vues');
        $annonce->load(['categorie', 'ville', 'user:id,nom,telephone,telephone_verifie,photo_profil', 'photos']);

        return response()->json($annonce);
    }

    /**
     * Crée une nouvelle annonce avec photos optionnelles.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'titre'             => 'required|string|max:200',
            'description'       => 'required|string',
            'prix'              => 'required|numeric|min:0',
            'type_offre'        => 'required|in:location,vente,colocation,terrain',
            'categorie_id'      => 'required|exists:categories,id',
            'ville_id'          => 'required|exists:villes,id',
            'surface'           => 'nullable|integer|min:0',
            'nb_pieces'         => 'nullable|integer|min:0',
            'telephone_visible' => 'boolean',
            'photos'            => 'nullable|array|max:5',
            'photos.*'          => 'image|mimes:jpeg,jpg,png,webp|max:5120',
        ]);

        $annonce = $request->user()->annonces()->create([
            ...$validated,
            'statut' => 'validee', // Auto-validation — la modération sera activée plus tard
        ]);


        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $index => $photoFile) {
                if (!$photoFile->isValid()) {
                    return response()->json(['message' => 'Une image est invalide ou dépasse la taille maximale autorisée.'], 422);
                }
                $path = $photoFile->store('annonces', 'public');
                $annonce->photos()->create([
                    'chemin'     => $path,
                    'principale' => $index === 0,
                    'ordre'      => $index,
                ]);
            }
        }

        return response()->json($annonce->load('photos'), 201);
    }

    /**
     * Met à jour une annonce (propriétaire ou admin).
     */
    public function update(Request $request, Annonce $annonce)
    {
        if ($request->user()->id !== $annonce->user_id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $validated = $request->validate([
            'titre'             => 'sometimes|string|max:200',
            'description'       => 'sometimes|string',
            'prix'              => 'sometimes|numeric|min:0',
            'type_offre'        => 'sometimes|in:location,vente,colocation,terrain',
            'categorie_id'      => 'sometimes|exists:categories,id',
            'ville_id'          => 'sometimes|exists:villes,id',
            'surface'           => 'nullable|integer|min:0',
            'nb_pieces'         => 'nullable|integer|min:0',
            'telephone_visible' => 'boolean',
            'existing_photos'   => 'nullable', // IDs des photos à garder (peut être une string vide)
            'photos'            => 'nullable|array|max:5', // Nouvelles photos
            'photos.*'          => 'image|mimes:jpeg,jpg,png,webp|max:5120',
        ]);

        // Ne mettre à jour que les champs de la table annonces (pas photos/existing_photos)
        $annonce->update(collect($validated)->except(['existing_photos', 'photos'])->toArray());

        // Gestion des photos existantes
        // Si le champ 'existing_photos' est présent dans la requête (même vide) :
        // → On supprime toutes les photos qui ne sont pas dans la liste
        if ($request->has('existing_photos')) {
            $raw = $request->input('existing_photos');
            // Cas vide ('' ou []) = tout supprimer
            if (empty($raw)) {
                foreach ($annonce->photos as $photo) {
                    Storage::disk('public')->delete($photo->chemin);
                    $photo->delete();
                }
            } else {
                $keepIds = array_map('intval', (array) $raw);
                $toDelete = $annonce->photos()->whereNotIn('id', $keepIds)->get();
                foreach ($toDelete as $photo) {
                    Storage::disk('public')->delete($photo->chemin);
                    $photo->delete();
                }
            }
        }

        // Ajout des nouvelles photos
        if ($request->hasFile('photos')) {
            $annonce->refresh(); // Recharger pour avoir le bon count après suppressions
            $currentIndex = $annonce->photos()->count();
            foreach ($request->file('photos') as $index => $photoFile) {
                if (!$photoFile->isValid()) {
                    return response()->json(['message' => 'Une image est invalide ou dépasse la taille maximale autorisée.'], 422);
                }
                $path = $photoFile->store('annonces', 'public');
                $annonce->photos()->create([
                    'chemin'     => $path,
                    'principale' => $currentIndex === 0 && $index === 0,
                    'ordre'      => $currentIndex + $index,
                ]);
            }
        }

        return response()->json($annonce->load(['categorie', 'ville', 'photos']));
    }

    /**
     * Supprime une annonce et ses fichiers photos.
     */
    public function destroy(Request $request, Annonce $annonce)
    {
        if ($request->user()->id !== $annonce->user_id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        foreach ($annonce->photos as $photo) {
            Storage::disk('public')->delete($photo->chemin);
        }
        $annonce->delete();

        return response()->json(['message' => 'Annonce supprimée avec succès.']);
    }

    /**
     * Suspend une annonce (propriétaire uniquement).
     */
    public function pause(Request $request, Annonce $annonce)
    {
        if ($request->user()->id !== $annonce->user_id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        if ($annonce->statut !== 'validee') {
            return response()->json(['message' => 'Seule une annonce validée peut être suspendue.'], 422);
        }

        $annonce->update(['statut' => 'suspendue']);

        return response()->json(['message' => 'Annonce suspendue.', 'annonce' => $annonce]);
    }

    /**
     * Réactive une annonce suspendue (remise en attente de validation).
     */
    public function reactiver(Request $request, Annonce $annonce)
    {
        if ($request->user()->id !== $annonce->user_id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        if ($annonce->statut !== 'suspendue') {
            return response()->json(['message' => 'Seule une annonce suspendue peut être réactivée.'], 422);
        }

        $annonce->update(['statut' => 'en_attente']);

        return response()->json(['message' => 'Annonce réactivée. En attente de validation.', 'annonce' => $annonce]);
    }

    /**
     * Liste les annonces publiques d'un utilisateur.
     */
    public function userAnnonces($userId)
    {
        $user = \App\Models\User::select('id', 'nom', 'created_at', 'telephone', 'telephone_verifie', 'photo_profil')->findOrFail($userId);
        
        $annonces = Annonce::with(['categorie', 'ville', 'photos'])
            ->where('user_id', $userId)
            ->where('statut', 'validee')
            ->latest()
            ->paginate(15);

        return response()->json([
            'user' => $user,
            'annonces' => $annonces
        ]);
    }
}
