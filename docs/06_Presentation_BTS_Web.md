# Structure Canva AI : Soutenance BTS - Application WEB complète (Axioplace)

**Avertissement Canva** : Copie-colle cette structure dans "Magic Design". Chaque "Slide" définit ce qui doit apparaître visuellement plus des notes masquées que tu liras le jour J.

---

## Slide 1 : Page de Garde
**Titre :** Soutenance BTS - Application Nationale Axioplace
**Sous-titre :** Une plateforme web complète et autonome de gestion d'annonces.
**Notes pour l'oral :** "Bonjour, je vous présente aujourd'hui mon projet de fin d'études : Axioplace. Il s'agit d'une application Web complète, de bout en bout, conçue pour opérer et modérer un réseau de petites annonces commerciales."

## Slide 2 : La Philosophie du Projet
**Titre :** Contexte et Objectifs
**Points clés :**
- Répondre au besoin de la mise en relation (CtoC).
- Architecture scindée ("Headless API" connectée à un Front-End Web).
- Ergonomie et fiabilité des serveurs distants.
**Notes pour l'oral :** "Créer une place de marché performante exige de la fiabilité. J'ai donc développé cette application web selon le modèle moderne 'Headless'. C'est-à-dire que le visuel interactif dans le navigateur Web est un programme isolé qui interroge et donne des ordres au coeur de mon serveur API distant via des requêtes réseau chiffrées."

## Slide 3 : La Fondation Serveur 
**Titre :** Le Coeur du Dispositif (API Backend)
**Points clés :**
- Architecture serveur Laravel (PHP) exposant les accès REST.
- Base de données MySQL et ORM de modélisation (Eloquent).
- Authentification protégée par Tokens chiffrés (Laravel Sanctum).
**Notes pour l'oral :** "Mon application web tire toute son intelligence de son backend. Il est développé sur le Framework Laravel. C'est ce serveur qui garantit l'intégrité de la base de données MySQL et valide mon identité en m'attribuant des jetons Sanctum afin de verrouiller tous les accès névralgiques de mon application."

## Slide 4 : Développement Frontend
**Titre :** Programmation de l'Application Client (React.js)
**Points clés :**
- Format Single Page Application de haute interactivité.
- Moteur de compilation ultra-rapide Vite.
- Thèmes graphiques propulsés et compilés via Tailwind CSS.
**Notes pour l'oral :** "Pour ma partie front, j'ai sélectionné le langage React. En créant une application à page unique (une SPA), mon navigateur ne subit plus de chargement de pages traditionnelles fastidieuses. Grâce à l'utilitaire Tailwind CSS, j'ai pu forger un design software très haut de gamme sans le poids lourd des anciens fichiers CSS."

## Slide 5 : Tableaux de Bord (Dashboard)
**Titre :** Fonctionnalité 1 : Le Moteur de Statistiques
**Points clés :**
- Réception du Big Data de façon asynchrone.
- Traitement de graphiques via la bibliothèque Recharts.
- Visualisation instantanée de l'activité commerciale.
**Notes pour l'oral :** "Une application de gestion performante doit synthétiser l'activité. J'ai incorporé la bibliothèque 'Recharts' qui absorbe les flux d'informations JSON du backend et dessine instantanément les ratios de nouveaux vendeurs ou annonces dans le navigateur Web, de façon parfaitement lisible."

## Slide 6 : Le Moteur de Sanction (Logique Métier)
**Titre :** Fonctionnalité 2 : Algorithmes de Modération
**Points clés :**
- Validation et Suspension asynchrone des flux ciblés.
- Suppression propre logicielle (Destruction récurcive des dépendances).
**Notes pour l'oral :** "Une action décisive dans mon application web, par exemple valider la suspension d'un profil, déclenche une logique ultra chirurgicale sur le serveur. Pour maintenir la propreté du système, l'application efface automatiquement les photos privées liées sur le disque interne et radie l'ensemble des dépendances SQL et sous-commentaires."

## Slide 7 : Détecteur de Fraude Automatisé
**Titre :** Fonctionnalité 3 : Algorithme Anti-Spam
**Points clés :**
- Traque du Flood (spam de 5 annonces en un intervalle < 24h).
- Détection d'usurpateurs multi-villes et des plagiats algorithmiques d'annonces.
**Notes pour l'oral :** "Et pour démontrer que mon programme web agit intelligemment, le serveur identifie de lui-même les probabilités de fraudes. Les robots générant des titres identiques ou ceux postant défoisemment sur trois villes différentes simultanément sont ciblés. Le système remonte les alertes directement et mon tableau de bord Web les met en surbrillance rouge."

## Slide 8 : Du Temps-Réel Implémenté
**Titre :** Fonctionnalité 4 : Protocole WebSockets
**Points clés :**
- Implémentation du moteur Laravel Reverb (Serveur de Temps Réel API).
- Écoute dynamique front-end via les écouteurs React Echo.
**Notes pour l'oral :** "Pour asseoir l'aboutissement de l'application, j'ai introduit la technologie des WebSockets. Si un membre lève un signalement de gravité en pleine nuit, l'API serveur 'Pousse' directement l'alerte sur le Front-end sans le moindre rafraichissement, de manière parfaitement instantanée."

## Slide 9 : Résilience et Modèle Industriel
**Titre :** Bilan Opérationnel et Architecture
**Points clés :**
- Souveraineté totale entre Logique d'affichage et Base de Données.
- Tolérance absolue à la charge lourde (Scalabilité prouvée).
**Notes pour l'oral :** "Le résultat de ce développement asynchrone est qu'il calque l'ingénierie professionnelle exigée. L'application web est un software autonome sur le navigateur dont les informations stockées sont strictement sécurisées au coeur du Backend invisible, rendant le tout invulnérable aux attaques directes."

## Slide 10 : Conclusion 
**Titre :** Conclusion de mon application Web
**Points clés :**
- Un projet unifié, complet, prêt pour du B2B ou CtoC.
- Apprentissage exhaustif du requêtage JSON.
**Notes pour l'oral :** "Axioplace est donc une application Web entière. Elle lie brillamment une puissante sécurisation de ses accès à travers son architecture Backend, et une formidable expérience de navigation logicielle en Front-end ! Je termine ma présentation ici, et c'est avec plaisir que j'accueillerai à vos nombreuses questions techniques."
