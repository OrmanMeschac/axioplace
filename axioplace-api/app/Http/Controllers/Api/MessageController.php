<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    /**
     * Liste des conversations (regroupées par le dernier message entre l'utilisateur et un interlocuteur concernant une annonce spécifique)
     */
    public function conversations(Request $request)
    {
        $user_id = $request->user()->id;

        // On cherche le dernier message pour chaque duo (annonce_id, autre_utilisateur)
        $latestMessages = Message::selectRaw('MAX(id) as id')
            ->where('expediteur_id', $user_id)
            ->orWhere('destinataire_id', $user_id)
            ->groupBy(
                'annonce_id',
                DB::raw("CASE WHEN expediteur_id = $user_id THEN destinataire_id ELSE expediteur_id END")
            )
            ->pluck('id');

        $messages = Message::with([
                'expediteur:id,nom,photo_profil',
                'destinataire:id,nom,photo_profil',
                'annonce:id,titre,prix',
            ])
            ->whereIn('id', $latestMessages)
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($messages);
    }

    /**
     * Historique complet d'une conversation spécifique (par annonce et interlocuteur)
     */
    public function conversation(Request $request, $annonce_id, $interlocuteur_id)
    {
        $user_id = $request->user()->id;

        $query = Message::with([
                'expediteur:id,nom,photo_profil',
                'destinataire:id,nom,photo_profil',
                'annonce:id,titre,prix',
            ]);

        if ($annonce_id === 'null' || $annonce_id === null) {
            $query->whereNull('annonce_id');
        } else {
            $query->where('annonce_id', $annonce_id);
        }

        $messages = $query->where(function ($q) use ($user_id, $interlocuteur_id) {
                $q->where(function ($sub) use ($user_id, $interlocuteur_id) {
                    $sub->where('expediteur_id', $user_id)
                        ->where('destinataire_id', $interlocuteur_id);
                })->orWhere(function ($sub) use ($user_id, $interlocuteur_id) {
                    $sub->where('expediteur_id', $interlocuteur_id)
                        ->where('destinataire_id', $user_id);
                });
            })
            ->oldest() // Ordre chronologique pour un chat
            ->limit(200) // Sécurité : limite à 200 messages max par fetch
            ->get();

        // Marquer comme lus
        $updateQuery = Message::where('destinataire_id', $user_id)
            ->where('expediteur_id', $interlocuteur_id)
            ->where('lu', false);

        if ($annonce_id === 'null' || $annonce_id === null) {
            $updateQuery->whereNull('annonce_id');
        } else {
            $updateQuery->where('annonce_id', $annonce_id);
        }
        
        $updateQuery->update(['lu' => true]);

        return response()->json($messages);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'destinataire_id' => 'required|exists:users,id',
            'annonce_id'      => 'nullable|exists:annonces,id',
            'contenu'         => 'required|string|max:1000',
        ]);

        $message = Message::create([
            'expediteur_id' => $request->user()->id,
            'destinataire_id' => $validated['destinataire_id'],
            'annonce_id' => $validated['annonce_id'],
            'contenu' => $validated['contenu'],
            'lu' => false,
        ]);

        // Le broadcast est enveloppé dans un try/catch pour éviter que
        // l'absence de Reverb ne provoque un échec de toute la requête.
        // Le message est toujours sauvegardé en base de données.
        try {
            broadcast(new MessageSent($message))->toOthers();
        } catch (\Exception $e) {
            \Log::warning('Broadcast failed (Reverb may not be running): ' . $e->getMessage());
        }

        return response()->json($message->load([
            'expediteur:id,nom,photo_profil',
            'destinataire:id,nom,photo_profil',
            'annonce:id,titre,prix',
        ]), 201);
    }
}
