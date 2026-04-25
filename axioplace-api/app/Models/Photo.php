<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Photo extends Model
{
    public $timestamps = false;
    protected $fillable = ['annonce_id', 'chemin', 'principale', 'ordre'];

    public function annonce() { return $this->belongsTo(Annonce::class); }
}
