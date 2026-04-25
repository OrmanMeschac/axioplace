<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\PhoneOtpCode;
use App\Models\PushSubscription;
use App\Models\AdminNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    // ─── INSCRIPTION ────────────────────────────────────────────────────────────

    public function register(Request $request)
    {
        $validated = $request->validate([
            'nom'       => 'required|string|max:100',
            'email'     => 'required|string|email|max:150|unique:users',
            'password'  => 'required|string|min:8|confirmed',
            'telephone' => 'nullable|string|max:20',
        ]);

        $user = User::create([
            'nom'       => $validated['nom'],
            'email'     => $validated['email'],
            'password'  => Hash::make($validated['password']),
            'telephone' => $validated['telephone'] ?? null,
        ]);

        // Envoyer l'email de vérification
        event(new Registered($user));

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'                    => $user,
            'token'                   => $token,
            'email_verification_sent' => true,
        ], 201);
    }

    // ─── CONNEXION ──────────────────────────────────────────────────────────────

    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        // Compte introuvable
        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['Aucun compte trouvé avec cette adresse email.'],
            ]);
        }

        // Compte créé uniquement via OAuth (password null) sans mot de passe défini
        if (is_null($user->password)) {
            $provider = ucfirst($user->oauth_provider ?? 'un réseau social');
            throw ValidationException::withMessages([
                'email' => [
                    "Ce compte a été créé via {$provider}. " .
                    "Connectez-vous avec le bouton {$provider}, ou cliquez sur " .
                    "\"Mot de passe oublié\" pour définir un mot de passe Axioplace."
                ],
            ]);
        }

        // Vérification du mot de passe
        if (!Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants fournis sont incorrects.'],
            ]);
        }

        if ($user->statut === 'bloque') {
            return response()->json(['message' => 'Votre compte est bloqué. Contactez le support.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'             => $user,
            'token'            => $token,
            'email_verified'   => !is_null($user->email_verified_at),
        ]);
    }

    // ─── CONNEXION SOCIALE (Google / Facebook) ────────────────────────────────

    public function socialLogin(Request $request)
    {
        $request->validate([
            'provider' => 'required|string|in:google,facebook',
            'token'    => 'required|string',
        ]);

        $provider = $request->provider;

        try {
            // Récupérer les infos utilisateur directement via l'API du provider
            if ($provider === 'google') {
                $socialUser = $this->getGoogleUser($request->token);
            } else {
                $socialUser = $this->getFacebookUser($request->token);
            }
        } catch (\Exception $e) {
            Log::error("[OAuth] Erreur {$provider} : " . $e->getMessage());
            return response()->json(['message' => 'Token OAuth invalide ou expiré.'], 401);
        }

        // Chercher d'abord par oauth_id + provider
        $user = User::where('oauth_provider', $provider)
                    ->where('oauth_id', $socialUser['id'])
                    ->first();

        // Sinon chercher par email (compte existant sans OAuth)
        if (!$user && !empty($socialUser['email'])) {
            $user = User::where('email', $socialUser['email'])->first();
            if ($user) {
                // Lier le compte existant au provider OAuth
                $user->update([
                    'oauth_provider' => $provider,
                    'oauth_id'       => $socialUser['id'],
                ]);
            }
        }

        // Créer un nouveau compte si l'utilisateur n'existe pas
        if (!$user) {
            $user = User::create([
                'nom'               => $socialUser['name'] ?? 'Utilisateur',
                'email'             => $socialUser['email'] ?? null,
                'password'          => null,
                'oauth_provider'    => $provider,
                'oauth_id'          => $socialUser['id'],
                'email_verified_at' => now(), // Email déjà vérifié par le provider
            ]);
        }

        // Vérifier que le compte n'est pas bloqué
        if ($user->statut === 'bloque') {
            return response()->json(['message' => 'Votre compte est bloqué. Contactez le support.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'           => $user->fresh(),
            'token'          => $token,
            'email_verified' => true,
        ]);
    }

    /**
     * Vérifie un access_token Google et retourne les infos de l'utilisateur.
     * Utilise l'endpoint userinfo de Google directement (plus fiable que Socialite
     * pour les tokens émis côté client via le flux implicite).
     */
    private function getGoogleUser(string $accessToken): array
    {
        $response = \Illuminate\Support\Facades\Http::withOptions($this->sslOptions())
            ->withToken($accessToken)
            ->get('https://www.googleapis.com/oauth2/v3/userinfo');

        if (!$response->successful()) {
            throw new \Exception('Impossible de vérifier le token Google : ' . $response->body());
        }

        $data = $response->json();

        return [
            'id'    => $data['sub'],
            'name'  => $data['name'] ?? (($data['given_name'] ?? '') . ' ' . ($data['family_name'] ?? '')),
            'email' => $data['email'] ?? null,
        ];
    }

    /**
     * Vérifie un access_token Facebook et retourne les infos de l'utilisateur.
     */
    private function getFacebookUser(string $accessToken): array
    {
        $response = \Illuminate\Support\Facades\Http::withOptions($this->sslOptions())
            ->get('https://graph.facebook.com/me', [
                'fields'       => 'id,name,email',
                'access_token' => $accessToken,
            ]);

        if (!$response->successful()) {
            throw new \Exception('Impossible de vérifier le token Facebook : ' . $response->body());
        }

        $data = $response->json();

        return [
            'id'    => $data['id'],
            'name'  => $data['name'] ?? 'Utilisateur',
            'email' => $data['email'] ?? null,
        ];
    }

    /**
     * Options SSL pour Guzzle.
     * Sur Windows/WAMP, PHP CLI n'a souvent pas les CA certs configurés.
     * On pointe explicitement vers le cacert.pem téléchargé.
     */
    private function sslOptions(): array
    {
        $certPath = 'C:\\wamp64\\bin\\php\\php8.3.14\\cacert.pem';

        if (file_exists($certPath)) {
            return ['verify' => $certPath];
        }

        // Fallback : désactiver la vérification SSL en local uniquement
        if (app()->environment('local')) {
            return ['verify' => false];
        }

        return []; // En production, on laisse Guzzle gérer (cert système)
    }

    // ─── PROFIL ─────────────────────────────────────────────────────────────────

    public function profile(Request $request)
    {
        $user = $request->user();
        $unreadNotifs = AdminNotification::where('target_user_id', $user->id)->where('lu', false)->count();
        return response()->json(array_merge($user->toArray(), ['unread_notifs' => $unreadNotifs]));
    }

    public function updateProfil(Request $request)
    {
        $validated = $request->validate([
            'nom'       => 'sometimes|string|max:100',
            'email'     => 'sometimes|string|email|max:150|unique:users,email,' . $request->user()->id,
            'telephone' => 'nullable|string|max:20',
        ]);

        $request->user()->update($validated);
        return response()->json($request->user()->fresh());
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($request->current_password, $request->user()->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Le mot de passe actuel est incorrect.'],
            ]);
        }

        $request->user()->update(['password' => Hash::make($request->password)]);
        return response()->json(['message' => 'Mot de passe modifié avec succès.']);
    }

    public function uploadPhoto(Request $request)
    {
        $request->validate(['photo' => 'required|image|mimes:jpeg,jpg,png,webp|max:2048']);
        $user = $request->user();
        if ($user->photo_profil) Storage::disk('public')->delete($user->photo_profil);
        $path = $request->file('photo')->store('photos_profil', 'public');
        $user->update(['photo_profil' => $path]);
        return response()->json($user->fresh());
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnexion réussie.']);
    }

    public function logoutAll(Request $request)
    {
        $request->user()->tokens()->delete();
        return response()->json(['message' => 'Déconnexion de tous les appareils effectuée.']);
    }

    // ─── MOT DE PASSE OUBLIÉ ────────────────────────────────────────────────────

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $status = Password::sendResetLink($request->only('email'));

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json(['message' => 'Un lien de réinitialisation a été envoyé à votre adresse email.']);
        }

        // Ne pas révéler si l'email existe ou non (sécurité)
        return response()->json(['message' => 'Si cet email existe, vous recevrez un lien de réinitialisation.']);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token'    => 'required',
            'email'    => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                // On utilise forceFill avec le mot de passe en clair + remember_token
                // Le cast 'hashed' dans le modèle User se charge de le hasher automatiquement.
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();
                
                // Invalider tous les tokens existants
                $user->tokens()->delete(); 
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.']);
        }

        return response()->json(['message' => 'Le lien est invalide ou expiré. Veuillez faire une nouvelle demande.'], 422);
    }

    // ─── VÉRIFICATION EMAIL ─────────────────────────────────────────────────────

    public function verifyEmail(Request $request, $id, $hash)
    {
        $user = User::findOrFail($id);

        if (!hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            return response()->json(['message' => 'Lien de vérification invalide.'], 403);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email déjà vérifié.']);
        }

        $user->markEmailAsVerified();
        event(new Verified($user));

        return response()->json(['message' => 'Email vérifié avec succès. Bienvenue sur Axioplace !']);
    }

    public function resendVerificationEmail(Request $request)
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'Votre email est déjà vérifié.']);
        }

        $request->user()->sendEmailVerificationNotification();
        return response()->json(['message' => 'Email de vérification renvoyé.']);
    }

    // ─── OTP TÉLÉPHONE ──────────────────────────────────────────────────────────

    public function sendPhoneOtp(Request $request)
    {
        $request->validate(['telephone' => 'required|string|max:20']);
        $user = $request->user();
        $tel  = $request->telephone;

        // Générer un code OTP à 6 chiffres
        $code = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);

        // Stocker (ou remplacer) le code
        PhoneOtpCode::updateOrCreate(
            ['user_id' => $user->id],
            ['code' => $code, 'telephone' => $tel, 'expires_at' => now()->addMinutes(10), 'used' => false]
        );

        // En production : appel Twilio/Vonage ici
        // $this->sendSmsViaTwilio($tel, "Votre code Axioplace : {$code}");

        // En développement : log le code
        Log::info("[OTP Axioplace] Téléphone: {$tel} | Code: {$code}");

        return response()->json([
            'message' => "Un code de vérification a été envoyé au {$tel}.",
            // En dev uniquement (retirer en production) :
            'debug_code' => config('app.debug') ? $code : null,
        ]);
    }

    public function verifyPhoneOtp(Request $request)
    {
        $request->validate(['code' => 'required|string|size:6']);
        $user = $request->user();

        $otp = PhoneOtpCode::where('user_id', $user->id)
            ->where('used', false)
            ->latest()
            ->first();

        if (!$otp || $otp->isExpired()) {
            return response()->json(['message' => 'Code expiré. Veuillez en demander un nouveau.'], 422);
        }

        if ($otp->code !== $request->code) {
            return response()->json(['message' => 'Code incorrect.'], 422);
        }

        $otp->update(['used' => true]);
        $user->update([
            'telephone'          => $otp->telephone,
            'telephone_verifie'  => true,
        ]);

        return response()->json(['message' => 'Téléphone vérifié avec succès.', 'user' => $user->fresh()]);
    }

    // ─── PUSH TOKENS ────────────────────────────────────────────────────────────

    public function saveExpoPushToken(Request $request)
    {
        $request->validate(['token' => 'required|string']);
        $request->user()->update(['expo_push_token' => $request->token]);
        return response()->json(['message' => 'Token enregistré.']);
    }

    public function saveWebPushSubscription(Request $request)
    {
        $request->validate([
            'endpoint'   => 'required|string',
            'public_key' => 'required|string',
            'auth_token' => 'required|string',
        ]);

        PushSubscription::updateOrCreate(
            ['user_id' => $request->user()->id, 'endpoint' => $request->endpoint],
            [
                'public_key' => $request->public_key,
                'auth_token' => $request->auth_token,
                'user_agent' => $request->header('User-Agent'),
            ]
        );

        return response()->json(['message' => 'Souscription Web Push enregistrée.']);
    }

    public function deleteWebPushSubscription(Request $request)
    {
        $request->validate(['endpoint' => 'required|string']);
        PushSubscription::where('user_id', $request->user()->id)
            ->where('endpoint', $request->endpoint)
            ->delete();
        return response()->json(['message' => 'Souscription supprimée.']);
    }
}
