# Document 1 : Fonctionnement de l'API REST (Backend)

Ce document explique en détail le fonctionnement du backend d'Axioplace, qui est conçu comme une **API REST**.

## 1. Qu'est-ce qu'une API REST ?
Une **API** (*Application Programming Interface* - Interface de Programmation d'Application) est un programme qui permet à deux applications de communiquer entre elles.  
L'architecture **REST** (*REpresentational State Transfer*) est un standard qui utilise les méthodes HTTP (`GET` pour lire, `POST` pour créer, `PUT/PATCH` pour modifier, `DELETE` pour supprimer) pour interagir avec des ressources.
Dans Axioplace, l'API est le "cerveau" central. Elle seule se connecte à la base de données et elle répond aux requêtes du site Web et de l'application mobile en renvoyant des données au format **JSON** (*JavaScript Object Notation*).

## 2. Architecture et Mécanismes clés
Le backend est construit avec **Laravel** (framework PHP). Le code est organisé selon le schéma classique **MVC** (Modèle, Vue, Contrôleur), où les "Vues" sont remplacées par des réponses JSON textuelles.

### Les Modèles (Models) et l'ORM
Les **Modèles** (ex: `Annonce.php`, `User.php`) représentent les entités de l'application. Ils utilisent l'**ORM** (*Object-Relational Mapping*) Eloquent de Laravel. Un ORM est un pont qui convertit automatiquement les tables de la base de données (lignes et colonnes) en Objets programmation exploitables. Il permet de récupérer facilement des données sans écrire de requêtes SQL brutes.

### Les Routes et Endpoints
Les **Routes** (définies dans `routes/api.php`) agissent comme le plan d'aiguillage de l'application. Chaque route définit un **Endpoint** (un "point d'entrée" ou une "URL" spécifique) et cible un contrôleur.
*Exemple* : L'Endpoint `POST /api/annonces` interceptera la requête HTTP et la transmettra à `AnnonceController@store`.

### Les Contrôleurs (Controllers)
Les **Contrôleurs** (ex: `AuthController.php`, `AnnonceController.php`) reçoivent les requêtes, valident les données entrantes, font appel aux Modèles pour interroger la base de données, et formatent la réponse en JSON pour le client (le front-end ou l'appli mobile).

### L'Authentification (Laravel Sanctum)
L'API gère la sécurité des utilisateurs via des **Tokens d'Authentification** (Jetons virtuels) générés par **Laravel Sanctum**. 
Lorsqu'un utilisateur se connecte, l'API vérifie ses identifiants et lui délivre un Token unique ("Jeton d'accès"). Le client (Web ou Mobile) mémorisera ce token et l'ajoutera dans l'en-tête (*Header*) de chaque requête future (Authorization Bearer). Ainsi, l'API reconnaît et valide l'identité de l'utilisateur à chaque action.

### Le Temps Réel (WebSockets avec Laravel Reverb)
Pour la messagerie et les notifications instantanées, l'API n'attend pas d'être sollicitée. Elle utilise une technologie **WebSocket** via le module **Laravel Reverb**. Un WebSocket crée un "tuyau" ouvert en continu entre l'API et le client. Quand un message est enregistré en base de données, l'API "pousse" (*Broadcast*) l'événement dans le tuyau, et l'application client se met à jour en temps réel sans avoir besoin de rafraîchir la page.
