# Architecture de l'application Axioplace

Suite à l'analyse du projet, notamment de l'API Laravel (Modèles et Routes), voici la structure approfondie du système représentée sous forme de diagrammes UML générés avec Mermaid.

## 1. Diagramme de Classes (Modèle de Données)

Ce diagramme illustre les différentes entités du système (basées sur les Modèles Eloquent) et leurs relations.

```mermaid
classDiagram
    class User {
        +Integer id
        +String nom
        +String email
        +String telephone
        +Boolean telephone_verifie
        +String password
        +String photo_profil
        +String role
        +String statut
        +String expo_push_token
        #casts() array
        +annonces() BelongsToMany
        +messageEnvoyes() HasMany
        +messageRecus() HasMany
        +favoris() HasMany
    }

    class Annonce {
        +Integer id
        +Integer user_id
        +Integer categorie_id
        +Integer ville_id
        +String titre
        +Text description
        +String type_offre
        +Decimal prix
        +Integer surface
        +Integer nb_pieces
        +Boolean telephone_visible
        +String statut
        +Integer nb_vues
        +Datetime expires_at
        +getIsFavoriAttribute() Boolean
        +user() BelongsTo
        +categorie() BelongsTo
        +ville() BelongsTo
        +photos() HasMany
        +messages() HasMany
        +favoris() HasMany
        +signalements() HasMany
    }

    class Categorie {
        +Integer id
        +String nom
        +String slug
    }

    class Ville {
        +Integer id
        +String nom
        +String slug
    }

    class Photo {
        +Integer id
        +Integer annonce_id
        +String chemin
        +Boolean principale
        +Integer ordre
        +annonce() BelongsTo
    }

    class Message {
        +Integer id
        +Integer expediteur_id
        +Integer destinataire_id
        +Integer annonce_id
        +Text contenu
        +Boolean lu
        +expediteur() BelongsTo
        +destinataire() BelongsTo
        +annonce() BelongsTo
    }

    class Favori {
        +Integer id
        +Integer user_id
        +Integer annonce_id
        +annonce() BelongsTo
    }

    class Signalement {
        +Integer id
        +Integer signaleur_id
        +Integer annonce_id
        +Integer user_signale_id
        +String motif
        +String statut
        +signaleur() BelongsTo
        +annonce() BelongsTo
        +userSignale() BelongsTo
    }

    class PushSubscription {
        +Integer id
        +Integer user_id
        +String endpoint
        +String public_key
        +String auth_token
        +String user_agent
        +user() BelongsTo
    }

    class PhoneOtpCode {
        +Integer id
        +Integer user_id
        +String code
        +String telephone
        +Datetime expires_at
        +Boolean used
        +user() BelongsTo
        +isExpired() Boolean
    }

    class AdminNotification {
        +Integer id
        +String titre
        +Text corps
        +String type
        +Integer sender_id
        +Integer target_user_id
        +Boolean lu
        +sender() BelongsTo
        +targetUser() BelongsTo
    }

    User "1" -- "0..*" Annonce : "publie"
    Annonce "0..*" -- "1" Categorie : "appartient à"
    Annonce "0..*" -- "1" Ville : "localisée à"
    Annonce "1" -- "0..*" Photo : "possède"
    User "1" -- "0..*" Message : "envoie/reçoit"
    Message "0..*" -- "1" Annonce : "concerne"
    User "1" -- "0..*" Favori : "ajoute"
    Favori "0..*" -- "1" Annonce : "concerne"
    User "1" -- "0..*" Signalement : "signale (ou est signalé)"
    Signalement "0..*" -- "1" Annonce : "concerne"
    User "1" -- "1..*" PushSubscription : "enregistre"
    User "1" -- "0..*" PhoneOtpCode : "demande"
    User "1" -- "0..*" AdminNotification : "reçoit/envoie"
```

## 2. Diagramme des Cas d'Utilisation

Ce diagramme présente les interactions possibles entre les différents types d'acteurs (Visiteur, Utilisateur, Administrateur) et le système Axioplace.

```text
(Note : Mermaid ne possède pas de véritable moteur pour les Cas d'Utilisation. Les rendus Mermaid ressemblent à des bulles génériques sans "bonhommes". Si vous souhaitez le vrai rendu UML avec les bonhommes et le cadre du système, utilisez le code PlantUML ci-dessous. Vous pouvez le copier sur le site planttext.com ou dans votre éditeur si PlantUML est supporté).
```

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor "Visiteur" as V
actor "Utilisateur Connecté" as U
actor "Administrateur" as A

U -|> V : "Hérite"
A -|> U : "Hérite"

rectangle "Système Axioplace" {
  usecase "S'inscrire / Se connecter" as UC1
  usecase "Consulter annonces & villes" as UC2
  usecase "Créer/Gérer ses annonces" as UC3
  usecase "Gérer ses favoris" as UC4
  usecase "Messagerie interne" as UC5
  usecase "Signaler un contenu" as UC6
  usecase "Modérer la plateforme" as UC7
  usecase "Gérer catégories/villes" as UC8
  usecase "Statistiques & Notifications" as UC9
}

V --> UC1
V --> UC2

U --> UC3
U --> UC4
U --> UC5
U --> UC6

A --> UC7
A --> UC8
A --> UC9
@enduml
```

## 3. Diagrammes de Séquence

Voici deux diagrammes de séquence illustrant les parcours fonctionnels les plus importants.

### A. Création d'une nouvelle Annonce

```mermaid
sequenceDiagram
    actor U as Utilisateur
    participant App as Front/Mobile (Client)
    participant API as API (AnnonceController)
    participant DB as Base de Données

    U->>App: Remplit le formulaire de l'annonce (titre, prix, etc.)
    U->>App: Ajoute des photos et clique sur "Publier"
    
    App->>API: POST /api/annonces (Token Auth + Form Data)
    activate API
    API->>API: Validation des règles (Request)
    
    API->>DB: INSERT INTO `annonces`
    activate DB
    DB-->>API: Annonce enregistrée (ID généré)
    deactivate DB
    
    loop Pour chaque photo attachée
        API->>DB: INSERT INTO `photos` (chemin, annonce_id, ordre)
    end
    
    API-->>App: HTTP 201 Created (Data Annonce)
    deactivate API
    
    App-->>U: Affiche "Annonce publiée avec succès !"
    App-->>U: Redirige vers la vue détaillée de l'annonce
```

### B. Envoi d'un message sur une Annonce (Mise en relation)

```mermaid
sequenceDiagram
    actor U1 as Utilisateur (Acheteur)
    participant App as Front/Mobile (Client)
    participant API as API (MessageController)
    participant DB as Base de Données
    actor U2 as Loueur/Vendeur (Destinataire)

    U1->>App: Saisit un message sur l'annonce du Vendeur
    App->>API: POST /api/messages (annonce_id, destinataire_id, contenu)
    
    activate API
    API->>DB: INSERT INTO `messages` (expediteur_id, etc.)
    API-->>App: HTTP 201 (Message sauvegardé avec succès)
    
    API->>API: Déclenche Notification (Push/Email)
    deactivate API
    
    App-->>U1: Affiche le message dans l'interface de discussion (bulle)
    
    API-->>U2: Réception Externe (Notification Push: "Nouveau message reçu")
```

### C. Inscription (Création de compte)

```mermaid
sequenceDiagram
    actor V as Visiteur
    participant App as Front/Mobile (Client)
    participant API as API (AuthController)
    participant DB as Base de Données
    participant Mail as Service d'Emails

    V->>App: Saisit ses informations (nom, email, mot de passe)
    App->>API: POST /api/register (Données)
    
    activate API
    API->>API: Validation (Request)
    API->>DB: INSERT INTO `users` (Hash du mot de passe)
    activate DB
    DB-->>API: Utilisateur enregistré
    deactivate DB
    
    API->>Mail: Event 'Registered' (Envoi de l'email de confirmation)
    API->>API: Génération du Token d'authentification (Sanctum)
    
    API-->>App: HTTP 201 Created (Data User + Token)
    deactivate API
    
    App-->>V: Connexion automatique et avertissement "Vérifiez votre email"
```

### D. Connexion (Login)

```mermaid
sequenceDiagram
    actor U as Utilisateur
    participant App as Front/Mobile (Client)
    participant API as API (AuthController)
    participant DB as Base de Données

    U->>App: Saisit email et mot de passe
    App->>API: POST /api/login (email, password)
    
    activate API
    API->>DB: Recherche (SELECT * FROM users WHERE email)
    activate DB
    DB-->>API: Données Utilisateur
    deactivate DB
    
    API->>API: Vérification du mot de passe (Hash::check)
    alt Identifiants incorrects
        API-->>App: HTTP 422 (Erreur de validation)
        App-->>U: Affiche un message d'erreur
    else Compte bloqué
        API-->>App: HTTP 403 (Forbidden)
        App-->>U: Affiche "Compte bloqué"
    else Succès
        API->>API: Génération du Token d'authentification (Sanctum)
        API-->>App: HTTP 200 OK (Data User + Token + Status Email)
        App-->>U: Enregistre le token et accède à l'application
    end
    deactivate API
```
