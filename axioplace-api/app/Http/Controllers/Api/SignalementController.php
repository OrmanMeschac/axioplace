<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Signalement;
use Illuminate\Http\Request;

class SignalementController extends Controller
{
    /**
     * Crée un signalement (route publique — le signaleur peut être null si non connecté).
     * Mais pour protéger contre le spam, idéalement authentifié.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'annonce_id'      => 'nullable|exists:annonces,id',
            'user_signale_id' => 'nullable|exists:users,id',
            'motif'           => 'required|string|max:300',
        ]);

        // Si l'utilisateur est connecté, on enregistre son ID comme signaleur
        $signaleurId = auth('sanctum')->id();

        if (! $signaleurId) {
            return response()->json(['message' => 'Vous devez être connecté pour signaler.'], 401);
        }

        // Éviter les doublons (même signaleur, même annonce)
        $exists = Signalement::where('signaleur_id', $signaleurId)
            ->where('annonce_id', $validated['annonce_id'] ?? null)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Vous avez déjà signalé cette annonce.'], 409);
        }

        $signalement = Signalement::create([
            'signaleur_id'    => $signaleurId,
            'annonce_id'      => $validated['annonce_id'] ?? null,
            'user_signale_id' => $validated['user_signale_id'] ?? null,
            'motif'           => $validated['motif'],
        ]);

        return response()->json(['message' => 'Signalement envoyé.', 'signalement' => $signalement], 201);
    }
}
