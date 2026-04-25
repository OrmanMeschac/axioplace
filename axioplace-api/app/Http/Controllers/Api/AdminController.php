<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Annonce;
use App\Models\Signalement;
use App\Models\AdminNotification;
use App\Models\Message;
use App\Services\PushNotificationService;
use App\Events\MessageSent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    // ─── DASHBOARD STATS ───────────────────────────────────────────────────────

    public function stats()
    {
        $totalUsers      = User::count();
        $totalAnnonces   = Annonce::count();
        $annonceActives  = Annonce::where('statut', 'validee')->count();
        $signalPending   = Signalement::where('statut', 'en_attente')->count();
        $usersBloques    = User::where('statut', 'bloque')->count();

        // Nouvelles inscriptions par jour (7 derniers jours)
        $newUsers = User::select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as total'))
            ->where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->groupBy('date')->orderBy('date')->get();

        // Nouvelles annonces par jour (7 derniers jours)
        $newAnnonces = Annonce::select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as total'))
            ->where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->groupBy('date')->orderBy('date')->get();

        // Répartition par catégorie (top 6)
        $categoryStats = DB::table('annonces')
            ->join('categories', 'annonces.categorie_id', '=', 'categories.id')
            ->select('categories.nom', DB::raw('count(*) as total'))
            ->groupBy('categories.nom')
            ->orderByDesc('total')
            ->limit(6)->get();

        // Répartition par type d'offre
        $typeStats = Annonce::select('type_offre', DB::raw('count(*) as total'))
            ->groupBy('type_offre')->get();

        // Derniers inscrits
        $latestUsers = User::select('id', 'nom', 'email', 'role', 'statut', 'created_at')
            ->withCount('annonces')->latest()->limit(5)->get();

        // Dernières annonces
        $latestAnnonces = Annonce::with(['user:id,nom', 'categorie:id,nom'])
            ->latest()->limit(5)->get();

        // Suspects résumé
        $suspectsCount = $this->_countSuspects();

        // Notifications envoyées cette semaine
        $notifCount = AdminNotification::where('created_at', '>=', now()->subDays(7))
            ->distinct('titre')->count('titre');

        return response()->json([
            'total_users'      => $totalUsers,
            'total_annonces'   => $totalAnnonces,
            'annonces_actives' => $annonceActives,
            'signal_pending'   => $signalPending,
            'users_bloques'    => $usersBloques,
            'suspects_count'   => $suspectsCount,
            'notif_week'       => $notifCount,
            'new_users'        => $newUsers,
            'new_annonces'     => $newAnnonces,
            'category_stats'   => $categoryStats,
            'type_stats'       => $typeStats,
            'latest_users'     => $latestUsers,
            'latest_annonces'  => $latestAnnonces,
        ]);
    }

    // ─── GESTION UTILISATEURS ──────────────────────────────────────────────────

    public function users(Request $request)
    {
        $query = User::withCount('annonces');
        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($b) use ($q) {
                $b->where('nom', 'like', "%{$q}%")
                  ->orWhere('email', 'like', "%{$q}%")
                  ->orWhere('telephone', 'like', "%{$q}%");
            });
        }
        if ($request->filled('role'))   $query->where('role',   $request->role);
        if ($request->filled('statut')) $query->where('statut', $request->statut);
        return response()->json($query->latest()->paginate(20));
    }

    public function showUser($id)
    {
        $user = User::withCount(['annonces', 'favoris'])->findOrFail($id);
        $annonces = Annonce::with(['categorie:id,nom', 'ville:id,nom', 'photos'])
            ->where('user_id', $id)->latest()->get();
        $signalements = Signalement::with(['annonce:id,titre'])
            ->whereHas('annonce', fn($q) => $q->where('user_id', $id))
            ->latest()->limit(10)->get();
        return response()->json(['user' => $user, 'annonces' => $annonces, 'signalements' => $signalements]);
    }

    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $validated = $request->validate([
            'nom'      => 'sometimes|string|max:100',
            'email'    => 'sometimes|email|unique:users,email,' . $id,
            'telephone'=> 'nullable|string|max:20',
            'role'     => 'sometimes|in:user,admin',
            'statut'   => 'sometimes|in:actif,bloque',
        ]);
        $user->update($validated);

        if (isset($validated['statut']) && $validated['statut'] === 'bloque') {
            $msg = Message::create([
                'expediteur_id'   => $request->user()->id,
                'destinataire_id' => $user->id,
                'contenu'         => "🚫 Votre compte a été suspendu par l'administration.",
                'lu'              => false,
            ]);
            try { broadcast(new MessageSent($msg))->toOthers(); } catch (\Exception $e) {}
            
            \Illuminate\Support\Facades\Mail::raw(
                "Bonjour {$user->nom},\n\nVotre compte Axioplace a été suspendu par notre équipe de modération.\n\nCordialement,\nL'équipe Axioplace",
                function ($message) use ($user) {
                    $message->to($user->email)->subject('Suspension de votre compte Axioplace');
                }
            );
        }

        return response()->json(['message' => 'Utilisateur mis à jour.', 'user' => $user->fresh()]);
    }

    public function deleteUser($id)
    {
        $user = User::findOrFail($id);
        if ($user->role === 'admin') return response()->json(['message' => 'Impossible de supprimer un administrateur.'], 403);
        foreach ($user->annonces as $annonce) {
            foreach ($annonce->photos as $photo) Storage::disk('public')->delete($photo->chemin);
            $annonce->delete();
        }
        $user->delete();
        return response()->json(['message' => 'Utilisateur supprimé avec succès.']);
    }

    public function createUser(Request $request)
    {
        $validated = $request->validate([
            'nom'      => 'required|string|max:100',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'telephone'=> 'nullable|string|max:20',
            'role'     => 'in:user,admin',
        ]);
        $user = User::create([
            'nom'      => $validated['nom'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'telephone'=> $validated['telephone'] ?? null,
            'role'     => $validated['role'] ?? 'user',
        ]);
        return response()->json($user, 201);
    }

    // ─── GESTION ANNONCES ─────────────────────────────────────────────────────

    public function annonces(Request $request)
    {
        $query = Annonce::with(['user:id,nom,email', 'categorie:id,nom', 'ville:id,nom']);
        if ($request->filled('statut')) $query->where('statut', $request->statut);
        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($b) use ($q) {
                $b->where('titre', 'like', "%{$q}%")
                  ->orWhereHas('user', fn($u) => $u->where('nom', 'like', "%{$q}%"));
            });
        }
        if ($request->filled('categorie_id')) $query->where('categorie_id', $request->categorie_id);
        return response()->json($query->latest()->paginate(20));
    }

    public function validerAnnonce(Request $request, Annonce $annonce)
    {
        $validated = $request->validate(['statut' => 'required|in:validee,suspendue,en_attente']);
        $annonce->update(['statut' => $validated['statut']]);

        // Notification de suspension par message
        if ($validated['statut'] === 'suspendue') {
            $msg = Message::create([
                'expediteur_id'   => $request->user()->id,
                'destinataire_id' => $annonce->user_id,
                'contenu'         => "❌ Votre annonce \"{$annonce->titre}\" a été suspendue par l'administration.",
                'lu'              => false,
            ]);
            try { broadcast(new MessageSent($msg))->toOthers(); } catch (\Exception $e) {}
        }

        return response()->json(['message' => 'Statut mis à jour.', 'annonce' => $annonce]);
    }

    public function deleteAnnonce($id)
    {
        $annonce = Annonce::with('photos')->findOrFail($id);
        foreach ($annonce->photos as $photo) Storage::disk('public')->delete($photo->chemin);
        $annonce->delete();
        return response()->json(['message' => 'Annonce supprimée avec succès.']);
    }

    // ─── GESTION SIGNALEMENTS (ÉTENDUE) ───────────────────────────────────────

    public function signalements(Request $request)
    {
        $query = Signalement::with([
            'signaleur:id,nom,email,photo_profil',
            'annonce:id,titre,statut,user_id',
            'annonce.user:id,nom,email,statut,photo_profil',
        ]);
        if ($request->filled('statut')) $query->where('statut', $request->statut);
        return response()->json($query->latest()->paginate(20));
    }

    /**
     * Action étendue sur un signalement (remplace traiterSignalement)
     * Actions : suspend_annonce | block_user | delete_user | delete_annonce | warn_user | reject
     */
    public function actionSignalement(Request $request, Signalement $signalement)
    {
        $validated = $request->validate([
            'action' => 'required|in:suspend_annonce,block_user,delete_annonce,delete_user,warn_user,reject',
            'note'   => 'nullable|string|max:500',
        ]);

        $annonce = $signalement->annonce()->with('photos', 'user')->first();
        $vendeur = $annonce?->user;

        switch ($validated['action']) {
            case 'suspend_annonce':
                $annonce?->update(['statut' => 'suspendue']);
                $signalement->update(['statut' => 'traite']);
                if ($annonce && $vendeur) {
                    $msg = Message::create([
                        'expediteur_id'   => $request->user()->id,
                        'destinataire_id' => $vendeur->id,
                        'contenu'         => "❌ Votre annonce \"{$annonce->titre}\" a été suspendue suite à un signalement.",
                        'lu'              => false,
                    ]);
                    try { broadcast(new MessageSent($msg))->toOthers(); } catch (\Exception $e) {}
                }
                break;

            case 'block_user':
                if ($vendeur && $vendeur->role !== 'admin') {
                    $vendeur->update(['statut' => 'bloque']);
                    $msg = Message::create([
                        'expediteur_id'   => $request->user()->id,
                        'destinataire_id' => $vendeur->id,
                        'contenu'         => "🚫 Votre compte a été suspendu suite à des infractions répétées.",
                        'lu'              => false,
                    ]);
                    try { broadcast(new MessageSent($msg))->toOthers(); } catch (\Exception $e) {}
                    
                    \Illuminate\Support\Facades\Mail::raw(
                        "Bonjour {$vendeur->nom},\n\nVotre compte Axioplace a été suspendu par notre équipe de modération suite à des signalements d'infractions répétées aux conditions d'utilisation.\n\nCordialement,\nL'équipe Axioplace",
                        function ($message) use ($vendeur) {
                            $message->to($vendeur->email)->subject('Suspension de votre compte Axioplace');
                        }
                    );
                }
                $signalement->update(['statut' => 'traite']);
                break;

            case 'delete_annonce':
                if ($annonce) {
                    foreach ($annonce->photos as $p) Storage::disk('public')->delete($p->chemin);
                    $annonce->delete();
                }
                $signalement->update(['statut' => 'traite']);
                break;

            case 'delete_user':
                if ($vendeur && $vendeur->role !== 'admin') {
                    foreach ($vendeur->annonces as $ann) {
                        foreach ($ann->photos as $p) Storage::disk('public')->delete($p->chemin);
                        $ann->delete();
                    }
                    $vendeur->delete();
                }
                $signalement->update(['statut' => 'traite']);
                break;

            case 'warn_user':
                if ($vendeur) {
                    $note = $validated['note'] ?? "Votre comportement a été signalé. Veuillez respecter les règles d'utilisation d'Axioplace pour éviter la suspension de votre compte.";
                    AdminNotification::create([
                        'titre'          => '⚠️ Avertissement officiel',
                        'corps'          => $note,
                        'type'           => 'warning',
                        'sender_id'      => $request->user()->id,
                        'target_user_id' => $vendeur->id,
                    ]);
                    $msg = Message::create([
                        'expediteur_id'   => $request->user()->id,
                        'destinataire_id' => $vendeur->id,
                        'contenu'         => "⚠️ Avertissement officiel\n\n" . $note,
                        'lu'              => false,
                    ]);
                    try { broadcast(new MessageSent($msg))->toOthers(); } catch (\Exception $e) {}
                }
                $signalement->update(['statut' => 'traite']);
                break;

            case 'reject':
                $signalement->update(['statut' => 'rejete']);
                break;
        }

        return response()->json(['message' => 'Action effectuée.', 'signalement' => $signalement->fresh()]);
    }

    // ─── SUSPECTS ────────────────────────────────────────────────────────────

    public function suspects()
    {
        // 1. Comptes avec ≥3 signalements reçus
        $signalesOften = DB::table('users')
            ->join('annonces', 'users.id', '=', 'annonces.user_id')
            ->join('signalements', 'annonces.id', '=', 'signalements.annonce_id')
            ->select('users.id', 'users.nom', 'users.email', 'users.statut', 'users.photo_profil', 'users.created_at',
                     DB::raw('COUNT(signalements.id) as nb_signalements'))
            ->groupBy('users.id', 'users.nom', 'users.email', 'users.statut', 'users.photo_profil', 'users.created_at')
            ->having('nb_signalements', '>=', 3)
            ->orderByDesc('nb_signalements')
            ->get()->map(fn($u) => array_merge((array)$u, ['reason' => 'signalements']));

        // 2. Comptes avec ≥5 annonces publiées en 24h (spam)
        $spamUsers = DB::table('users')
            ->join('annonces', 'users.id', '=', 'annonces.user_id')
            ->select('users.id', 'users.nom', 'users.email', 'users.statut', 'users.photo_profil', 'users.created_at',
                     DB::raw('COUNT(annonces.id) as nb_annonces_24h'))
            ->where('annonces.created_at', '>=', now()->subDay())
            ->groupBy('users.id', 'users.nom', 'users.email', 'users.statut', 'users.photo_profil', 'users.created_at')
            ->having('nb_annonces_24h', '>=', 5)
            ->orderByDesc('nb_annonces_24h')
            ->get()->map(fn($u) => array_merge((array)$u, ['reason' => 'spam']));

        // 3. Comptes utilisant ≥3 villes différentes
        $multiVille = DB::table('users')
            ->join('annonces', 'users.id', '=', 'annonces.user_id')
            ->select('users.id', 'users.nom', 'users.email', 'users.statut', 'users.photo_profil', 'users.created_at',
                     DB::raw('COUNT(DISTINCT annonces.ville_id) as nb_villes'))
            ->groupBy('users.id', 'users.nom', 'users.email', 'users.statut', 'users.photo_profil', 'users.created_at')
            ->having('nb_villes', '>=', 3)
            ->orderByDesc('nb_villes')
            ->get()->map(fn($u) => array_merge((array)$u, ['reason' => 'multi_villes']));

        // 4. Annonces avec titres similaires (même user, même 6 premiers caractères)
        $duplicates = DB::table('annonces as a1')
            ->join('annonces as a2', function ($j) {
                $j->on('a1.user_id', '=', 'a2.user_id')
                  ->on('a1.id', '<', 'a2.id')
                  ->whereRaw('LEFT(a1.titre, 6) = LEFT(a2.titre, 6)');
            })
            ->join('users', 'a1.user_id', '=', 'users.id')
            ->select('users.id', 'users.nom', 'users.email', 'users.statut', 'users.photo_profil', 'users.created_at',
                     DB::raw('COUNT(*) as nb_doublons'),
                     'a1.titre as exemple_titre')
            ->groupBy('users.id', 'users.nom', 'users.email', 'users.statut', 'users.photo_profil', 'users.created_at', 'a1.titre')
            ->orderByDesc('nb_doublons')
            ->limit(20)->get()
            ->map(fn($u) => array_merge((array)$u, ['reason' => 'duplicate']));

        return response()->json([
            'signales_souvent' => $signalesOften,
            'spam_annonces'    => $spamUsers,
            'multi_villes'     => $multiVille,
            'duplicates'       => $duplicates,
            'total'            => count($signalesOften) + count($spamUsers) + count($multiVille) + count($duplicates),
        ]);
    }

    private function _countSuspects(): int
    {
        $s = DB::table('users')
            ->join('annonces', 'users.id', '=', 'annonces.user_id')
            ->join('signalements', 'annonces.id', '=', 'signalements.annonce_id')
            ->select('users.id')
            ->groupBy('users.id')
            ->havingRaw('COUNT(signalements.id) >= 3')
            ->get()->count();
        return $s;
    }

    // ─── NOTIFICATIONS ADMIN ──────────────────────────────────────────────────

    public function listNotifications(Request $request)
    {
        $notifs = AdminNotification::with(['targetUser:id,nom,email', 'sender:id,nom'])
            ->latest()->paginate(30);
        return response()->json($notifs);
    }

    public function sendNotification(Request $request)
    {
        $validated = $request->validate([
            'titre'          => 'required|string|max:200',
            'corps'          => 'required|string',
            'type'           => 'required|in:info,warning,alert,update',
            'target_user_id' => 'nullable|exists:users,id',
        ]);

        $senderId = $request->user()->id;

        if ($validated['target_user_id']) {
            // ── Notification ciblée ──
            AdminNotification::create([
                'titre'          => $validated['titre'],
                'corps'          => $validated['corps'],
                'type'           => $validated['type'],
                'sender_id'      => $senderId,
                'target_user_id' => $validated['target_user_id'],
            ]);

            // Duplication dans les chats de l'utilisateur
            $msg = Message::create([
                'expediteur_id'   => $senderId,
                'destinataire_id' => $validated['target_user_id'],
                'contenu'         => "📢 [Notification Admin] : " . $validated['titre'] . "\n\n" . $validated['corps'],
                'lu'              => false,
            ]);
            try { broadcast(new MessageSent($msg))->toOthers(); } catch (\Exception $e) {}

            $targetUser = User::find($validated['target_user_id']);

            // Expo Push (mobile)
            if ($targetUser?->expo_push_token) {
                PushNotificationService::sendExpo(
                    $targetUser->expo_push_token,
                    $validated['titre'],
                    $validated['corps'],
                    ['type' => $validated['type']]
                );
            }

            // Web Push (navigateur)
            PushNotificationService::sendWebPush(
                [$validated['target_user_id']],
                $validated['titre'],
                $validated['corps'],
                $validated['type']
            );

            $count = 1;
        } else {
            // ── Broadcast : tous les utilisateurs actifs ──
            $users   = User::where('statut', 'actif')->where('role', 'user')->get();
            $userIds = $users->pluck('id');
            $now     = now();

            $rows = $userIds->map(fn($uid) => [
                'titre'          => $validated['titre'],
                'corps'          => $validated['corps'],
                'type'           => $validated['type'],
                'sender_id'      => $senderId,
                'target_user_id' => $uid,
                'lu'             => false,
                'created_at'     => $now,
                'updated_at'     => $now,
            ])->toArray();

            $messageRows = $userIds->map(fn($uid) => [
                'expediteur_id'   => $senderId,
                'destinataire_id' => $uid,
                'contenu'         => "📢 [Annonce Admin] : " . $validated['titre'] . "\n\n" . $validated['corps'],
                'lu'             => false,
                'created_at'     => $now,
            ])->toArray();

            foreach (array_chunk($rows, 500) as $chunk) {
                AdminNotification::insert($chunk);
            }

            foreach (array_chunk($messageRows, 500) as $chunk) {
                Message::insert($chunk);
            }
            
            // Broadcast pour Reverb en background pour chaque utilisateur 
            // (En production, utiliser une action de "Job" si la table est gigantesque)
            try {
                $insertedMessages = Message::where('expediteur_id', $senderId)->where('created_at', $now)->get();
                foreach($insertedMessages as $imsg) {
                    broadcast(new MessageSent($imsg));
                }
            } catch (\Exception $e) {}

            // Expo Push batch
            $expoTokens = $users->pluck('expo_push_token')->filter()->values()->toArray();
            PushNotificationService::sendExpoBatch(
                $expoTokens,
                $validated['titre'],
                $validated['corps'],
                ['type' => $validated['type']]
            );

            // Web Push batch
            PushNotificationService::sendWebPush(
                $userIds->toArray(),
                $validated['titre'],
                $validated['corps'],
                $validated['type']
            );

            $count = count($userIds);
        }

        return response()->json(['message' => "Notification envoyée à {$count} utilisateur(s).", 'count' => $count]);
    }

    public function deleteNotification($id)
    {
        AdminNotification::whereId($id)->delete();
        return response()->json(['message' => 'Notification supprimée.']);
    }

    // ─── NOTIFICATIONS UTILISATEUR (côté user) ────────────────────────────────

    public function myNotifications(Request $request)
    {
        $notifs = AdminNotification::where('target_user_id', $request->user()->id)
            ->latest()->paginate(30);
        $unread = AdminNotification::where('target_user_id', $request->user()->id)
            ->where('lu', false)->count();
        return response()->json(['notifications' => $notifs, 'unread' => $unread]);
    }

    public function markNotificationRead(Request $request, $id)
    {
        AdminNotification::where('id', $id)
            ->where('target_user_id', $request->user()->id)
            ->update(['lu' => true]);
        return response()->json(['message' => 'Marqué comme lu.']);
    }

    public function markAllRead(Request $request)
    {
        AdminNotification::where('target_user_id', $request->user()->id)
            ->where('lu', false)->update(['lu' => true]);
        return response()->json(['message' => 'Toutes les notifications marquées comme lues.']);
    }

    // ─── GESTION CATÉGORIES ───────────────────────────────────────────────────

    public function categories()
    {
        return response()->json(\App\Models\Categorie::withCount('annonces')->orderBy('nom')->get());
    }

    public function createCategorie(Request $request)
    {
        $validated = $request->validate(['nom' => 'required|string|max:100|unique:categories,nom', 'icone' => 'nullable|string|max:50']);
        return response()->json(\App\Models\Categorie::create($validated), 201);
    }

    public function deleteCategorie($id)
    {
        $cat = \App\Models\Categorie::findOrFail($id);
        if ($cat->annonces()->count() > 0) return response()->json(['message' => 'Impossible de supprimer une catégorie utilisée.'], 422);
        $cat->delete();
        return response()->json(['message' => 'Catégorie supprimée.']);
    }

    // ─── GESTION VILLES ───────────────────────────────────────────────────────

    public function villes()
    {
        return response()->json(\App\Models\Ville::withCount('annonces')->orderBy('nom')->get());
    }

    public function createVille(Request $request)
    {
        $validated = $request->validate(['nom' => 'required|string|max:100|unique:villes,nom']);
        return response()->json(\App\Models\Ville::create($validated), 201);
    }

    public function deleteVille($id)
    {
        $ville = \App\Models\Ville::findOrFail($id);
        if ($ville->annonces()->count() > 0) return response()->json(['message' => 'Impossible de supprimer une ville utilisée.'], 422);
        $ville->delete();
        return response()->json(['message' => 'Ville supprimée.']);
    }
}
