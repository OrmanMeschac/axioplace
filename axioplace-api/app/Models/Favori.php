<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Favori extends Model
{
    public $timestamps = false;
    protected $fillable = ['user_id', 'annonce_id'];

    public function annonce() { return $this->belongsTo(Annonce::class); }
}
