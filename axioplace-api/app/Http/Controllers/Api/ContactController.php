<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

/**
 * Gère l'envoi de messages via le formulaire de contact public.
 */
class ContactController extends Controller
{
    /**
     * Traite la soumission du formulaire de contact et envoie un email.
     */
    public function send(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom'     => 'required|string|min:2|max:100',
            'email'   => 'required|email|max:255',
            'sujet'   => 'required|string|min:3|max:200',
            'message' => 'required|string|min:10|max:2000',
        ], [
            'nom.required'     => 'Le nom est obligatoire.',
            'email.required'   => 'L\'adresse email est obligatoire.',
            'email.email'      => 'L\'adresse email n\'est pas valide.',
            'sujet.required'   => 'Le sujet est obligatoire.',
            'message.required' => 'Le message est obligatoire.',
            'message.min'      => 'Le message doit contenir au moins 10 caractères.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Données invalides.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        try {
            // Envoi de l'email à l'adresse configurée dans MAIL_FROM_ADDRESS
            Mail::send([], [], function ($mail) use ($data) {
                $mail->to(config('mail.from.address'))
                     ->replyTo($data['email'], $data['nom'])
                     ->subject('[Axioplace Contact] ' . $data['sujet'])
                     ->html(
                         '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 12px;">
                             <div style="background: linear-gradient(135deg, #FFC533, #009543); padding: 25px; border-radius: 10px; text-align: center; margin-bottom: 25px;">
                                 <h1 style="color: white; margin: 0; font-size: 24px;">📬 Nouveau message — Axioplace</h1>
                             </div>
                             <div style="background: white; padding: 25px; border-radius: 10px; border: 1px solid #eee;">
                                 <p style="margin: 0 0 12px;"><strong>Nom :</strong> ' . htmlspecialchars($data['nom']) . '</p>
                                 <p style="margin: 0 0 12px;"><strong>Email :</strong> <a href="mailto:' . htmlspecialchars($data['email']) . '">' . htmlspecialchars($data['email']) . '</a></p>
                                 <p style="margin: 0 0 12px;"><strong>Sujet :</strong> ' . htmlspecialchars($data['sujet']) . '</p>
                                 <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                                 <p style="margin: 0 0 8px; font-weight: bold; color: #333;">Message :</p>
                                 <p style="margin: 0; line-height: 1.7; color: #555; white-space: pre-line;">' . htmlspecialchars($data['message']) . '</p>
                             </div>
                             <p style="text-align: center; color: #aaa; font-size: 12px; margin-top: 20px;">Axioplace — La marketplace du Congo</p>
                         </div>'
                     );
            });

            return response()->json([
                'message' => 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Une erreur est survenue lors de l\'envoi. Veuillez réessayer.',
            ], 500);
        }
    }
}
