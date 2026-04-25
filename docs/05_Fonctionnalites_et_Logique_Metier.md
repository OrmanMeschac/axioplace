# Document 5 : Fonctionnalités de Base et Logique Métier

Ce document expose comment fonctionne "l'intérieur" de l'application, les processus et algorithmes de traitement (Logique Métier) ainsi que les outils mis à disposition de l'Administration pour traquer la malveillance.

## 1. Fonctionnalités Globales de Base
La plateforme Axioplace est une place de marché, ses fonctionnalités gravitent toutes autour de l'objet "Annonce" et "Utilisateur".

* **Inscription / Authentification (OTP) :**
  Lorsqu'un visiteur s'inscrit, son compte est d'abord inactif. Il doit **vérifier son téléphone** (via un code OTP - One Time Password) pour obtenir la coche "Vérifié". Cette fonctionnalité utilise l'entité `PhoneOtpCode` qui génère un code à 6 chiffres, valable 10 minutes, adossé à une vérification stricte en base.
  
* **La publication d'une Annonce :**
  Lors de la soumission du formulaire d'une annonce, l'API reçoit les textes et traite indépendamment les images. L'algorithme (`AnnonceController@store`) enregistre d'abord l'annonce principale, s'empare de son ID fraichement généré, et boucle sur les fichiers téléversés pour injecter le chemin dans la table reliée `photos`.
  
* **Communications privées (Messagerie) :**
  Le système de messagerie interne relie un `expediteur_id` et un `destinataire_id` autour d'un `annonce_id`. Dès lors qu'un message est posté, un événement `MessageSent` est "broadcasté" (WebSockets) via `Laravel Reverb` pour une notification instantanée à l'écran, en plus d'activer une bannière Push sur le téléphone du vendeur (Notification silencieuse en arrière-plan).

## 2. Le Système de Signalements et d'Avertissements
Axioplace dispose d'un outil extrêmement complet pour sa **Modération**.
Lorqu'un membre détecte une fraude ou une escroquerie, il émet un **Signalement**, contenant un "motif".

L'Administrateur traite ce signalement depuis le `AdminController`. Grâce à la méthode `actionSignalement`, il dispose d'un panneau d'actions possibles découlant du signalement :
1. **Avertir (warn_user) :** La plateforme génère une "Notification Administrative" formelle accompagnée d'un message direct dans sa boîte de messagerie. L'internaute n'est pas bloqué.
2. **Suspendre (suspend_annonce) :** L'annonce est désactivée du flux public sans supprimer le contenu de l'auteur, lui donnant l'occasion de faire appel.
3. **Bloquer (block_user) / Bannir (delete_user) :** Si l'infraction est grave, le script modifie le `statut` du profil en "bloqué". Tous ses jetons de connexions sont invalidés. 

## 3. L'Algorithme de Détections des Comportements Suspects (L'œil de l'Admin)
L'une des fonctions les plus pointues d'Axioplace est son moteur de détection passive **(Méthode `suspects()`)**. Sans même qu'un humain n'effectue l'analyse globale, la base de données effectue 4 requêtes groupées asychnrones pour isoler automatiquement :

1. **Les Multirécidivistes :**
   Le système traque silencieusement les comptes totalisant plus de **3 signalements sur l'intégralité de leurs annonces** (un croisement joint *users* → *annonces* → *signalements*).
   
2. **Le Spam et l'Inondation :**
   Quiconque réussit à envoyer **5 annonces ou plus en un intervalle de 24h** rentre dans une liste rouge d'analyse.
   
3. **Le Fraudeur Géographique :**
   Il est hautement improbable de louer des biens dans 3 secteurs drastiquement éloignés au même moment. L'API repère un utilisateur publiant une annonce sur **3 villes différentes**.

4. **Les Annonces Clones (Doublons) :**
   L'API croise les chaînes de caractères. Si la plateforme identifie **les 6 premiers caractères d'un titre** comme étant strictement identiques à une précédente annonce du même membre, il est affiché en tant que "Copieur", facilitant grandement la chasse aux spambots copiés/collés.

## Synthèse Logique 
Toutes ces automatisations de contrôles (Moteur de suspect, Gestion de rôles) permettent un gain de temps considérable pour les modérateurs, et procurent aux autres membres l'assurance d'évoluer sur un marché sain et vérifié.
