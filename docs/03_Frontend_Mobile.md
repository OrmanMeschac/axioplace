# Document 3 : Fonctionnement du Frontend Mobile (Application)

Ce document détaille le mécanisme de l'application mobile de la plateforme Axioplace (dossier `axioplace-mobile`).

## 1. Concept de Framework Multi-plateforme
Faire une application mobile native nécessite normalement deux codes : Swift pour Apple, et Kotlin pour Android. Axioplace tourne avec une architecture **Multi-plateforme** (Cross-platform) gérée par la paire **React Native** et **Expo**.

- **React Native** : C'est un framework qui permet d'utiliser le langage web JavaScript et la structure des composants composable de **React** (le même modèle que le web) et qui les traduit "à la volée" lors de l'exécution en véritables interfaces natives Android/iOS respectant les composants natifs de l’écran (ex: `<View>` devient `UIView` sur iOS).
- **Expo** : C'est un méga-outil (*Toolchain*) englobant React Native. Il inclut de très nombreuses API matérielles prêtes à l'emploi (appareil photo, système de notification) de sorte à ne jamais avoir besoin de paramétrer manuellement les environnements locaux de code bas niveau macOS / Java.

## 2. La Navigation Mobile Stack & Tabs
La structure de la navigation utilise **React Navigation**. Elle fonctionne par couches :
- Les **Tabs** (Onglets) : Maintiennent la barre du bas avec la navigation de base.
- Le **Stack** (Pile) : Pour la navigation à l'intérieur, lorsqu'on clique sur le détail d'une annonce, la nouvelle page est "empilée" sur la précédente. Une gestuelle typique (Glisser vers la droite) "dépile" la page et nous rapporte à l'écran précédent.

## 3. Gestion de la Session et Mémoire Locale
Comme sur le Web, l'application mobile converse avec l'API grâce à **Axios**. Toutefois, sur mobile, l'utilisateur attend d'être connecté à vie, sans jamais devoir retaper son mot de passe en fermant l'application. 
À la connexion de l'utilisateur, l'API envoie le *Token d'authentification* Sanctum. L'application utilise l'outil **Async Storage** (Stockage Asynchrone) pour l'inscrire à l'intérieur de la base de données fermée et privée du téléphone (qui ne s'efface pas à l'extinction). À la réouverture de l'application, l'application repêche le Token, et reloge immédiatement l'utilisateur dans son interface de compte en ajoutant de manière invisible, sur le moment, le Token aux requêtes Axios.

## 4. Notifications Push
Axioplace implémente des notifications push distantes natives en s'appuyant sur l'infrastructure robuste de **Expo Notifications**. L'application mobile (lorsqu'elle s'installe) génère un identifiant universel d'appareil (`expo_push_token`) avec Apple/Google et le remonte en base de données du backend. L'Administrateur peut depuis son panneau, solliciter l'API, qui utilise un mécanisme pour ordonner en cascade au serveur Push d'acheminer le message sur le téléphone par-delà l'infrastructure Android ou iOS.

## 5. Aspects Performanciels, Média et UI
- Le design puise ses graphismes depuis **Lucide React Native** et module les écrans de fond avec **Expo Linear Gradient**.
- La libaririe **Expo Image** gère le chargement et la mise en commun des images des annonces (Mise en cache matérielle pour éviter de re-télécharger).
- La bibliothèque **Reanimated / Gesture Handler** capture les gestes natifs (Scroll, drag-and-drop, sliders) de manière extrêmement fluide, car elle exécute les calculs vectoriels directement depuis le processeur (UI Thread) sans bloquer le script JavaScript global.
