# Document 4 : Technologies et Justification des Choix Techniques

Ce document synthétise toutes les technologies qui "font" Axioplace et l'expertise derrière chaque "Choix Technique".

## 1. La Section Backend (Serveur et API)
**Langage principal :** PHP 8.2  
**Framework :** Laravel 12.0

* **Pourquoi PHP et Laravel ?**
  - **Justification :** Laravel est ultra-robuste en entreprise. Il comprend un ORM "Eloquent" très intuitif, propice aux évolutions structurelles de la base. Les temps de développement sont extrêmement rapides car Laravel procure les modules communs de façon pré-intégrée (Mails, Routage, Événements liés).  

* **Laravel Sanctum (Authentification)**
  - **Justification :** Moins lourd qu'un système complet OAuth (comme Passport) ou qu'une implémentation complexe de JWT. Sanctum permet un système de Tokens asynchrones extrêmement fiables et gérables spécifiquement pour les SPA (React) et pour les plateformes Mobiles sans frictions.

* **Laravel Reverb (Outil WebSocket)**
  - **Justification :** Le besoin d'une messagerie in-app (temps réel) réclamait un serveur WebSocket. Au regard des coûts d'utiliser une solution logicielle tierce payante, Reverb est l'outil natif de Laravel pour assumer l'envoi Broadcast à l'échelle via le réseau tout en gardant une souveraineté technique sur ses propres serveurs.

* **MySQL (Base de données et conception relationnelle)**
  - **Justification :** Une application de places de marché relie par essence des annonces, à des utilisateurs, sur des villes et catégories distinctes. Ce schéma hyper-relationnel (`1 user - n favoris - n annonces`) est idéalement géré de façon ordonnée, sécurisée, empêchant des transactions cassées.

## 2. La Section Frontend Web (Le tableau de bord / site)
**Bibliothèques majeures :** React 19, Vite, React-Router-Dom.

* **Pourquoi React.js et l'architecture SPA ?**
  - **Justification :** Permettre un développement en Composants Réutilisables. Lorsqu'on développe un encart d'annonce, ce bloc est appelé partout. Le choix de React (et non de pages traditionnelles) crée une immersion proche du mobile : le changement de section est instantané pour la gestion de ses données, l'application est compilée avec **Vite** en temps super-rapide.  

* **Tailwind CSS**
  - **Justification :** Éviter l'enfer d'avoir des milliers de lignes de CSS mort ou conflictuel. Chaque composant s'autofinance en termes de style de forme atomique. C'est idéal pour maintenir les thèmes sombres/claires, l'effet de modernité (*glassmorphism*).

* **Axios & Recharts**
  - **Justification :** Axios est l'interface par défaut car il standardise les réponses par des promesses compréhensibles avec une gestion automatique du format JSON. Pour Recharts, sur une Interface d'Admin, des graphiques SVG fiables se connectant directement à un flux JSON asynchrone étaient vitaux.

## 3. La Section Mobile (Annonceurs et Publieurs en ligne)
**Framework :** React Native 0.81 couplé avec Expo SDK 54.

* **Pourquoi Expo & React Native ?**
  - **Justification :** Il s'agit du sommet de l'ingénierie Cross-Platform. On conserve le même pont intellectuel ("Mental Model") que le Web. Plus de 95 % du code de logique métier (Axios ou l'intégration d'icones) est copiable depuis le Web, accélérant considérablement sa conception tout en s'exportant de façon égale vers du SwiftUI interne chez Apple ou sur Android.  

* **Expo Notifications & Async Storage**
  - **Justification :** Ce processus unifié assure que pour l'équipe technique, l'implémentation de la complexité des serveurs lourds Google Cloud Messaging et Apple Push Network soit abstraite sous la même librairie `Expo-Notifications`. `Async Storage` répond à la nécessité d'implémenter les sessions durables (ne jamais se reconnecter constamment) en cryptant ce Token dans la puce physique.
  
* **Reanimated et React Navigation**
  - **Justification :**  Une plateforme premium à destination du public *doit* offrir plus que le tactile basique : le défilement et le "Swipe" des Stack requièrent des framerates élevés (60FPS). `Reanimated` garantit que ces interactions (et les transitions) ne saccadent aucun composant principal de logique React.
