<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Gate;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;
use App\Models\User;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Schema::defaultStringLength(191);

        Gate::define('admin', function (User $user) {
            return $user->role === 'admin';
        });

        // ── Réinitialisation mot de passe ────────────────────────────────────────
        // Le lien envoyé par email pointe vers le FRONTEND React (pas le backend)
        ResetPassword::createUrlUsing(function ($user, string $token) {
            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
            return $frontendUrl . '/reinitialiser-mot-de-passe'
                . '?token=' . $token
                . '&email=' . urlencode($user->email);
        });

        // ── Vérification email ───────────────────────────────────────────────────
        // Le lien cliqué dans l'email appelle directement l'API backend
        VerifyEmail::createUrlUsing(function ($notifiable) {
            $id   = $notifiable->getKey();
            $hash = sha1($notifiable->getEmailForVerification());
            return config('app.url') . '/api/email/verify/' . $id . '/' . $hash;
        });
    }
}
