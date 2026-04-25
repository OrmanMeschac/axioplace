<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminNotification extends Model
{
    protected $fillable = [
        'titre', 'corps', 'type', 'sender_id', 'target_user_id', 'lu',
    ];

    protected $casts = ['lu' => 'boolean'];

    public function sender()     { return $this->belongsTo(User::class, 'sender_id'); }
    public function targetUser() { return $this->belongsTo(User::class, 'target_user_id'); }
}
