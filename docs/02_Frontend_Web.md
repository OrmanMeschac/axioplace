# Document 2 : Fonctionnement du Frontend Web (Site Internet)

Ce document détaille le fonctionnement de la partie web "Front-End", à savoir l'application utilisée via un navigateur internet.

## 1. Architecture SPA (Single Page Application)
Le site web Axioplace (dossier `axioplace-front`) n'est pas un site traditionnel avec des dizaines de pages HTML qui se rechargent. C'est une **SPA** (*Single Page Application* - Application à page unique). 
Le navigateur charge une seule page initiale vide et télécharge ensuite un fichier JavaScript majeur. Ce Javascript va dynamiquement générer et modifier l'interface (le **DOM** - *Document Object Model*) en "remplaçant" l'écran en cours lorsqu'on navigue, sans jamais recharger le navigateur web. Cela offre une expérience ultra-fluide, semblable à un logiciel natif.

## 2. Le Cœur du Frontend Web
- **React.js** : C'est la bibliothèque (créée par Meta) sur laquelle tout le site est construit. Il permet de découper l'interface en petits blocs indépendants et réutilisables, appelés **Composants** (boutons, formulaires d'annonce, barre de navigation).
- **Vite.js** : C'est le moteur de construction (*Bundler*). Il est chargé de "compiler" et regrouper tout le code React et les styles très rapidement pour en faire une application lisible par n'importe quel navigateur web.

## 3. Communication avec l'API
Pour afficher des annonces, le Frontend Web demande l'information à l'API. Il utilise pour cela la bibliothèque **Axios**. C'est un client HTTP qui expédie les requêtes (comme les soumissions de login) au serveur externe. Si la plupart des actions sont asynchrones (on attend la réponse de l'API pour afficher la suite).

## 4. Gestion du Temps Réel
Pour observer l'arrivée de nouveaux événements (Messagerie ou Notifications), le projet Web utilise **Laravel Echo** fusionné avec **Pusher-js**. Cette librairie connecte le front-end au canal WebSocket de l'API. Dès que l'API émet un "bruit" (Broadcast), Laravel Echo l'entend ("Listen") et met instantanément le composant React à jour en ajoutant la bulle rouge à côté des messages.

## 5. Design et Stylisation
Le "look and feel" premium d'Axioplace utilise **Tailwind CSS**. Il s'agit d'un framework "Utilitaire". Plutôt que de créer de longs fichiers CSS externes, Tailwind injecte de minuscules classes de design directement sur les éléments HTML (`<div className="flex bg-white rounded-lg shadow">`). L'outil utilitaire additionnel **tailwind-merge** ou **clsx** l'accompagne pour gérer l'affichage conditionnel des classes et des couleurs sans conflits.

## 6. Tableaux de Bord et Statistiques
L'application Web intègre la bibliothèque **Recharts** qui ingère les données brutes sous forme d'objets (comme les nombres de vues par annonce) délivrés par l'API et les transforme automatiquement en graphiques (secteurs, barres) pour que l'Administrateur visualise l'activité facilement.
