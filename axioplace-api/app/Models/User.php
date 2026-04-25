<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'nom', 'email', 'telephone', 'telephone_verifie',
        'password', 'photo_profil', 'role', 'statut', 'expo_push_token',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'telephone_verifie' => 'boolean',
            'password' => 'hashed',
        ];
    }

    public function annonces()      { return $this->hasMany(Annonce::class); }
    public function messageEnvoyes(){ return $this->hasMany(Message::class, 'expediteur_id'); }
    public function messageRecus()  { return $this->hasMany(Message::class, 'destinataire_id'); }
    public function favoris()       { return $this->hasMany(Favori::class); }
}
