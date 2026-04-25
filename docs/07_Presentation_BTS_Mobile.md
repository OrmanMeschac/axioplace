# Structure Canva AI : Soutenance BTS - Application MOBILE complète (Axioplace)

**Avertissement Canva** : Copie-colle cette structure dans "Magic Design". Chaque "Slide" définit ce qui doit apparaître visuellement plus des notes masquées que tu liras le jour J.

---

## Slide 1 : Page de Garde
**Titre :** Soutenance BTS - Axioplace
**Sous-titre :** Une application mobile complète native et son architecture Backend.
**Notes pour l'oral :** "Bonjour au jury, je vous présente aujourd'hui l'aboutissement de mon projet logiciel. Il s'agit d'Axioplace, une grande application Mobile autonome de petites annonces pour smartphones. Ce produit intégral se compose d'un solide backend serveur sur-mesure et d'une application de téléphone téléchargeable."

## Slide 2 : Philosophie de mon application
**Titre :** Contexte et Nécessité Client
**Points clés :**
- Créer une solution "In the pocket" réactive au marché en ligne (CtoC).
- Appui impératif sur le hardware (Caméra, GPS, Notifications PUSH).
- Application dynamique reposée sur un Serveur API métier.
**Notes pour l'oral :** "L'utilisateur final aujourd'hui consomme le commerce numérisé de façon nomade. Mon objectif était de concevoir un produit tirant pleinement parti de toute l'infrastructure permise par les téléphones récents, la Caméra et les alertes d'action. Afin que cette application puisse exister dans une sphère mondiale, un serveur asynchrone joue un rôle de centralisation des flux de données."

## Slide 3 : La Fondation Serveur
**Titre :** Le co-moteur : Le Serveur Central (API REST)
**Points clés :**
- Algorithmes de sécurités traités sur un Backend Laravel 12 (PHP).
- Base de données inter-connexe avec ORM (MySQL).
- Identification des téléphones via un délivreur de distribution Token. 
**Notes pour l'oral :** "Une grosse application mobile de marché ne peut pas héberger des bases de données volumineuses de façon isolée sur le disque mémoire interne. Le cœur du système s'articule via l'API réseau PHP. À chaque "swipe", l'application interroge le grand cloud serveur, valide son identité et peint l'écran iOS ou Android au retour asynchrone des informations."

## Slide 4 : Architecture logicielle Native de l'Application
**Titre :** Technologie pure (React Native & Expo)
**Points clés :**
- React Native convertit le Javascript en langage Natif (Ojective-C/Java).
- SDK Expo exploitant les librairies matérielles sensibles.
- Navigation par "Piles et Onglets" (Système Tab & Stack Flow).
**Notes pour l'oral :** "Le socle de mon programme React Native est astucieux ; le code convertit de façon automatique ma logique d'interface en un format supporté aussi bien par l'iPhone que Samsung, sans refaire deux développements parallèles. Ma navigation repose d'ailleurs sur deux concepts natifs : les Stacks pour se repérer, et la barre d'onglets pour le multi-écran permanent."

## Slide 5 : L'Exploitation du Stockage Mobile
**Titre :** Fonctionnalité 1 : Session Silencieuse Sécurisée
**Points clés :**
- Vérification secrète au démarrage ("Async Storage").
- Sécurité et délivrance du jeton d'inviolabilité Sanctum.
**Notes pour l'oral :** "Contrairement à l'ordinateur de bureau classique, une application optimisée ne devrait jamais réclamer une déconnexion inopinée. Mon application stocke l'empreinte Token au sein de la mémoire persistante et cryptée 'Async Storage'. À chaque clic et allumage, le serveur lit silencieusement le badge de l'utilisateur, et relance l'expérience sans barrière inutile."

## Slide 6 : Gestion des Fichiers Physiques
**Titre :** Fonctionnalité 2 : Formulaires et Caméra
**Points clés :**
- Validation de droits matériels avec "Expo Image Picker".
- Traitement binaire des formulaires HTTP en 'MultiPart FormData'.
**Notes pour l'oral :** "Les API des terminaux encadrent très sérieusement les permissions de leurs utilisateurs. Mon code requiert et englobe la librairie native qui autorise le clic optique d'une image. Puis l'image brute subit un passage de codification HTTP dit "FormData", le format sécurisant l'upload du flux binaire en quelques octets vers mon API Server."

## Slide 7 : Le Réveil Asynchrone des Utilisateurs
**Titre :** Fonctionnalité 3 : Notification Push Matérielle
**Points clés :**
- Communication inter-plateforme (Framework de Notification Expo PUSH).
- Déléguation du comportement asynchrone depuis les tables MySQL.
**Notes pour l'oral :** "Axioplace comprend les Push Notifications à l'image d'Instagram ou Tiktok. Lors de l'installation, un ID réseau identifiant numériquement l'appareil est greffé sans les bases MYSQL du Cloud. L'enjeu est qu'une sanction, ou une alerte émanant d'un autre client du réseau est poussée par Laravel en interceptant l'APN natif du téléphone, allumant ou faisant vibrer un smartphone au fond d'un sac."

## Slide 8 : Interaction Visuelle & Messagerie Live
**Titre :** Fonctionnalité 4 : La Boucle WebSockets (Chat P2P)
**Points clés :**
- Moteur d'Animation Native ('Reanimated' garantissant le framerate minimal 60FPS).
- Temps Réel sous protocole WebSockets via Laravel Reverb.
**Notes pour l'oral :** "L'application détient une messagerie CtoC absolue. Via les WebSockets, un composant branché au Backend intercepte en permanence le PING en temps réel. Pour adoucir ce fonctionnement, chaque micro animation ou réaction du clavier téléphonique répond sans contrainte grâce à Reanimated calculant nativement l'effort sur le processeur hardware."

## Slide 9 : Résilience et Expertise Technologique
**Titre :** Bilan Ingénierie Projet Complet
**Points clés :**
- Structuration découplée : API Robuste traitant 90% des requêtes lourdes.
- Sécurisation du Frontend limitant les fraudes sans impacter la fluidité.
**Notes pour l'oral :** "De faire dialoguer un software mobile React/Expo tactille grand public au cœur relationnel complexe et crypté du Backend asseoit tout ce que l'on attend techniquement pour cette validation de cycle BTS. Protéger et fluidifier les données n'est viable qu'en utilisant le système de jetons asynchrone que j'ai bâti."

## Slide 10 : Épilogue & Améliorations Futures
**Titre :** Conclusion et Ouvertures
**Points clés :**
- Apprentissage fort des cycles de déploiement et requêtage (API Axios).
- Potentielles évolutions technologiques : Gestion Google Maps.
**Notes pour l'oral :** "C'est avec une grande satisfaction que j'aboutis cette conception d'application monétisable complète. Le futur logique d'une telle entité verrait grandir sa solution cartographique ou un module complet interne de module de paiement tel "Stripe". C'est un réel aboutissement et je serai comblé de répondre pertinemment à toute l'ensemble de vos ultimes interrogations !"
