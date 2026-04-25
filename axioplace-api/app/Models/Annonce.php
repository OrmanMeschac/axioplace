<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Annonce extends Model
{
    protected $fillable = [
        'user_id', 'categorie_id', 'ville_id', 'titre', 'description',
        'type_offre', 'prix', 'surface', 'nb_pieces', 'telephone_visible',
        'statut', 'nb_vues', 'expires_at',
    ];

    protected $appends = ['is_favori'];

    public function getIsFavoriAttribute()
    {
        $userId = auth('sanctum')->id();
        if (!$userId) return false;
        return $this->favoris()->where('user_id', $userId)->exists();
    }

    public function user()       { return $this->belongsTo(User::class); }
    public function categorie()  { return $this->belongsTo(Categorie::class); }
    public function ville()      { return $this->belongsTo(Ville::class); }
    public function photos()     { return $this->hasMany(Photo::class); }
    public function messages()   { return $this->hasMany(Message::class); }
    public function favoris()    { return $this->hasMany(Favori::class); }
    public function signalements() { return $this->hasMany(Signalement::class); }
}
