<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Favori;
use Illuminate\Http\Request;

class FavoriController extends Controller
{
    /**
     * Liste les favoris de l'utilisateur connecté.
     */
    public function index(Request $request)
    {
        $favoris = Favori::with(['annonce.photos', 'annonce.ville', 'annonce.categorie'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get()
            ->pluck('annonce')
            ->filter(); // retire les annonces supprimées

        return response()->json($favoris->values());
    }

    /**
     * Ajoute ou retire une annonce des favoris (toggle).
     */
    public function toggle(Request $request, $annonceId)
    {
        $favori = Favori::where('user_id', $request->user()->id)
            ->where('annonce_id', $annonceId)
            ->first();

        if ($favori) {
            $favori->delete();
            return response()->json(['action' => 'removed', 'annonce_id' => (int) $annonceId]);
        }

        Favori::create([
            'user_id'    => $request->user()->id,
            'annonce_id' => $annonceId,
        ]);

        return response()->json(['action' => 'added', 'annonce_id' => (int) $annonceId]);
    }
}
