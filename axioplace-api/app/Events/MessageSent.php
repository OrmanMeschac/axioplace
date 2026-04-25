<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    public function __construct(Message $message)
    {
        // On charge les relations pour que le front-end reçoive tout
        $this->message = $message->load(['expediteur:id,nom', 'destinataire:id,nom', 'annonce:id,titre']);
    }

    public function broadcastOn()
    {
        return [
            new PrivateChannel('chat.' . $this->message->destinataire_id),
            new PrivateChannel('chat.' . $this->message->expediteur_id),
        ];
    }

    public function broadcastAs()
    {
        return 'MessageSent';
    }

    public function broadcastWith()
    {
        return [
            'message' => $this->message->toArray()
        ];
    }
}
