<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Signalement extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'signaleur_id',
        'annonce_id',
        'user_signale_id',
        'motif',
        'statut',
    ];

    /**
     * L'utilisateur qui a créé le signalement.
     */
    public function signaleur()
    {
        return $this->belongsTo(User::class, 'signaleur_id');
    }

    /**
     * L'annonce signalée.
     */
    public function annonce()
    {
        return $this->belongsTo(Annonce::class);
    }

    /**
     * L'utilisateur signalé (si signalement d'un profil).
     */
    public function userSignale()
    {
        return $this->belongsTo(User::class, 'user_signale_id');
    }
}
