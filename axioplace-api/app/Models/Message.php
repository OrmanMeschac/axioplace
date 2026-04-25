<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    public $timestamps = false;
    protected $fillable = ['expediteur_id', 'destinataire_id', 'annonce_id', 'contenu', 'lu'];

    public function expediteur()  { return $this->belongsTo(User::class, 'expediteur_id'); }
    public function destinataire(){ return $this->belongsTo(User::class, 'destinataire_id'); }
    public function annonce()     { return $this->belongsTo(Annonce::class); }
}
