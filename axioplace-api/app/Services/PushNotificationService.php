<?php

namespace App\Services;

use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class PushNotificationService
{
    /**
     * Envoie un push Expo à un utilisateur (mobile Android/iOS)
     */
    public static function sendExpo(?string $expoPushToken, string $title, string $body, array $data = []): void
    {
        if (!$expoPushToken || !str_starts_with($expoPushToken, 'ExponentPushToken[')) {
            return;
        }

        try {
            Http::post('https://exp.host/--/api/v2/push/send', [
                'to'    => $expoPushToken,
                'title' => $title,
                'body'  => $body,
                'data'  => $data,
                'sound' => 'default',
                'priority' => 'high',
            ]);
        } catch (\Exception $e) {
            Log::warning('Expo Push failed: ' . $e->getMessage());
        }
    }

    /**
     * Envoie des pushes Expo en batch (jusqu'à 100 tokens par requête)
     */
    public static function sendExpoBatch(array $tokens, string $title, string $body, array $data = []): void
    {
        $validTokens = array_filter($tokens, fn($t) => $t && str_starts_with($t, 'ExponentPushToken['));
        if (empty($validTokens)) return;

        $messages = array_map(fn($token) => [
            'to'    => $token,
            'title' => $title,
            'body'  => $body,
            'data'  => $data,
            'sound' => 'default',
            'priority' => 'high',
        ], array_values($validTokens));

        foreach (array_chunk($messages, 100) as $chunk) {
            try {
                Http::post('https://exp.host/--/api/v2/push/send', $chunk);
            } catch (\Exception $e) {
                Log::warning('Expo Push Batch failed: ' . $e->getMessage());
            }
        }
    }

    /**
     * Envoie un Web Push à toutes les souscriptions d'un utilisateur (ou tous)
     */
    public static function sendWebPush(array $userIds, string $title, string $body, string $type = 'info'): void
    {
        $vapidPublic  = config('services.vapid.public_key');
        $vapidPrivate = config('services.vapid.private_key');
        $vapidSubject = config('services.vapid.subject', 'mailto:noreply@axioplace.com');

        if (!$vapidPublic || !$vapidPrivate) return;

        $subscriptions = PushSubscription::whereIn('user_id', $userIds)->get();
        if ($subscriptions->isEmpty()) return;

        try {
            $webPush = new WebPush([
                'VAPID' => [
                    'subject'    => $vapidSubject,
                    'publicKey'  => $vapidPublic,
                    'privateKey' => $vapidPrivate,
                ],
            ]);

            $payload = json_encode([
                'titre' => $title,
                'corps' => $body,
                'type'  => $type,
                'url'   => '/',
            ]);

            foreach ($subscriptions as $sub) {
                $webPush->queueNotification(
                    Subscription::create([
                        'endpoint' => $sub->endpoint,
                        'keys'     => ['p256dh' => $sub->public_key, 'auth' => $sub->auth_token],
                    ]),
                    $payload
                );
            }

            foreach ($webPush->flush() as $report) {
                if ($report->isSubscriptionExpired()) {
                    PushSubscription::where('endpoint', $report->getEndpoint())->delete();
                }
            }
        } catch (\Exception $e) {
            Log::warning('Web Push failed: ' . $e->getMessage());
        }
    }
}
