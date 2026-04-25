<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AnnonceController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\CategorieController;
use App\Http\Controllers\Api\VilleController;
use App\Http\Controllers\Api\FavoriController;
use App\Http\Controllers\Api\SignalementController;
use App\Http\Controllers\Api\ContactController;

// ── Authentification (publique) ──────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);
// Connexion sociale (Google / Facebook)
Route::post('/auth/social', [AuthController::class, 'socialLogin']);

// Mot de passe oublié / réinitialisation (publique)
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password',  [AuthController::class, 'resetPassword']);

// Vérification email (publique — lien cliqué depuis l'email)
Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])->name('verification.verify');

// ── Données publiques ───────────────────────────────────────────────────────
Route::get('/categories',          [CategorieController::class, 'index']);
Route::get('/villes',              [VilleController::class, 'index']);
Route::get('/annonces',            [AnnonceController::class, 'index']);
Route::get('/annonces/{annonce}',  [AnnonceController::class, 'show']);
Route::get('/users/{id}/annonces', [AnnonceController::class, 'userAnnonces']);

// ── Formulaire de contact (public) ──────────────────────────────────────────
Route::post('/contact', [ContactController::class, 'send']);

// ── Routes authentifiées ────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth & Profil
    Route::get('/user',          [AuthController::class, 'profile']);
    Route::post('/logout',       [AuthController::class, 'logout']);
    Route::post('/logout-all',   [AuthController::class, 'logoutAll']);
    Route::put('/user/profil',   [AuthController::class, 'updateProfil']);
    Route::put('/user/password', [AuthController::class, 'updatePassword']);
    Route::post('/user/photo',   [AuthController::class, 'uploadPhoto']);

    // Vérification email (renvoyer)
    Route::post('/email/verify/resend', [AuthController::class, 'resendVerificationEmail']);

    // Vérification téléphone (OTP)
    Route::post('/phone/send-otp',   [AuthController::class, 'sendPhoneOtp']);
    Route::post('/phone/verify-otp', [AuthController::class, 'verifyPhoneOtp']);

    // Push tokens
    Route::patch('/user/push-token',            [AuthController::class, 'saveExpoPushToken']);
    Route::post('/user/web-push/subscribe',     [AuthController::class, 'saveWebPushSubscription']);
    Route::delete('/user/web-push/unsubscribe', [AuthController::class, 'deleteWebPushSubscription']);

    // Mes annonces
    Route::get('/mes-annonces', [AnnonceController::class, 'mesAnnonces']);

    // Annonces (CRUD)
    Route::post('/annonces',                      [AnnonceController::class, 'store']);
    Route::put('/annonces/{annonce}',             [AnnonceController::class, 'update']);
    Route::delete('/annonces/{annonce}',          [AnnonceController::class, 'destroy']);
    Route::patch('/annonces/{annonce}/pause',     [AnnonceController::class, 'pause']);
    Route::patch('/annonces/{annonce}/reactiver', [AnnonceController::class, 'reactiver']);

    // Favoris
    Route::get('/favoris',       [FavoriController::class, 'index']);
    Route::post('/favoris/{id}', [FavoriController::class, 'toggle']);

    // Signalements
    Route::post('/signalements', [SignalementController::class, 'store']);

    // Messages
    Route::get('/conversations',                             [MessageController::class, 'conversations']);
    Route::get('/messages/{annonce_id}/{interlocuteur_id}', [MessageController::class, 'conversation']);
    Route::post('/messages',                                 [MessageController::class, 'store']);

    // Notifications reçues (côté utilisateur)
    Route::get('/user/notifications',             [AdminController::class, 'myNotifications']);
    Route::patch('/user/notifications/{id}/read', [AdminController::class, 'markNotificationRead']);
    Route::post('/user/notifications/read-all',   [AdminController::class, 'markAllRead']);

    // ── Administration ─────────────────────────────────────────────────────
    Route::middleware('can:admin')->prefix('admin')->group(function () {

        // Dashboard
        Route::get('/stats', [AdminController::class, 'stats']);

        // Utilisateurs
        Route::get('/users',         [AdminController::class, 'users']);
        Route::post('/users',        [AdminController::class, 'createUser']);
        Route::get('/users/{id}',    [AdminController::class, 'showUser']);
        Route::put('/users/{id}',    [AdminController::class, 'updateUser']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);

        // Annonces
        Route::get('/annonces',                  [AdminController::class, 'annonces']);
        Route::put('/annonces/{annonce}/valider', [AdminController::class, 'validerAnnonce']);
        Route::delete('/annonces/{id}',          [AdminController::class, 'deleteAnnonce']);

        // Signalements (6 actions)
        Route::get('/signalements',                       [AdminController::class, 'signalements']);
        Route::put('/signalements/{signalement}/traiter', [AdminController::class, 'actionSignalement']);
        Route::post('/signalements/{signalement}/action', [AdminController::class, 'actionSignalement']);

        // Suspects
        Route::get('/suspects', [AdminController::class, 'suspects']);

        // Notifications broadcast
        Route::get('/notifications',         [AdminController::class, 'listNotifications']);
        Route::post('/notifications',        [AdminController::class, 'sendNotification']);
        Route::delete('/notifications/{id}', [AdminController::class, 'deleteNotification']);

        // Catégories & Villes
        Route::get('/categories',         [AdminController::class, 'categories']);
        Route::post('/categories',        [AdminController::class, 'createCategorie']);
        Route::delete('/categories/{id}', [AdminController::class, 'deleteCategorie']);

        Route::get('/villes',         [AdminController::class, 'villes']);
        Route::post('/villes',        [AdminController::class, 'createVille']);
        Route::delete('/villes/{id}', [AdminController::class, 'deleteVille']);
    });
});
