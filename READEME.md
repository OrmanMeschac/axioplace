# AXIOPLACE — README Projet

> Plateforme Marketplace Web — Annonces Multi-Catégories  
> Développeur : Orman Boudimbou | Scholia Institut | BTS SIO SLAM 2026  
> Stack : Laravel 11 + React (SPA) + MySQL 8 + Laravel Sanctum

---

## Sommaire

1. [Présentation](#1-présentation)
2. [Architecture](#2-architecture)
3. [Prérequis](#3-prérequis)
4. [Installation Backend Laravel](#4-installation-backend-laravel)
5. [Installation Frontend React](#5-installation-frontend-react)
6. [Base de données — Structure complète](#6-base-de-données--structure-complète)
7. [Configuration Sanctum](#7-configuration-sanctum)
8. [Routes API complètes](#8-routes-api-complètes)
9. [Modèles Eloquent & Relations](#9-modèles-eloquent--relations)
10. [Contrôleurs API](#10-contrôleurs-api)
11. [Middlewares & Rôles](#11-middlewares--rôles)
12. [Frontend React — Structure](#12-frontend-react--structure)
13. [Gestion du token Sanctum côté React](#13-gestion-du-token-sanctum-côté-react)
14. [Scénarios de tests](#14-scénarios-de-tests)
15. [Planning de développement](#15-planning-de-développement)

---

## 1. Présentation

Axioplace est une plateforme web marketplace multi-catégories destinée au marché congolais. Elle permet de publier et consulter des annonces dans les catégories : **Immobilier, Véhicules, Services, Emploi**.

### Catégories v1.0

| Catégorie   | Types d'offres disponibles                  |
|-------------|---------------------------------------------|
| Immobilier  | location, vente, colocation, terrain        |
| Véhicules   | vente, location                             |
| Services    | prestation                                  |
| Emploi      | offre, demande                              |

### Acteurs

| Acteur              | Droits                                                                 |
|---------------------|------------------------------------------------------------------------|
| Visiteur            | Consulter, rechercher, filtrer, signaler, créer un compte              |
| Utilisateur inscrit | Profil, messagerie, favoris, modifier mot de passe                     |
| Propriétaire        | Publier, modifier, suspendre, supprimer ses annonces, statistiques     |
| Administrateur      | Valider/refuser annonces, gérer users, traiter signalements            |

---

## 2. Architecture

```
axioplace/
├── axioplace-api/        ← Backend Laravel 11 (API REST pure)
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   ├── Middleware/
│   │   │   └── Requests/
│   │   ├── Models/
│   │   └── Providers/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/
│   │   └── api.php
│   └── .env
│
└── axioplace-front/      ← Frontend React SPA (Vite + Tailwind)
    ├── src/
    │   ├── api/          ← Appels Axios
    │   ├── components/
    │   ├── pages/
    │   ├── context/      ← AuthContext (token Sanctum)
    │   └── App.jsx
    └── .env
```

**Principe :** Le backend Laravel expose une API REST pure (préfixe `/api`). Le frontend React consomme cette API via Axios. Aucune vue Blade n'est utilisée pour les fonctionnalités applicatives. L'authentification est entièrement stateless via **Laravel Sanctum (tokens Bearer)**.

---

## 3. Prérequis

### Backend

| Outil       | Version minimale |
|-------------|-----------------|
| PHP         | 8.2+            |
| Composer    | 2.x             |
| MySQL       | 8.0+            |
| Laravel     | 11.x            |

### Frontend

| Outil    | Version minimale |
|----------|-----------------|
| Node.js  | 18.x+           |
| npm      | 9.x+            |
| Vite     | 5.x             |

---

## 4. Installation Backend Laravel

### 4.1 Créer le projet

```bash
composer create-project laravel/laravel axioplace-api
cd axioplace-api
```

### 4.2 Installer les dépendances

```bash
# Sanctum (authentification API)
composer require laravel/sanctum

# Intervention Image (compression photos)
composer require intervention/image-laravel

# JWT optionnel (alternative à Sanctum)
# composer require tymon/jwt-auth
```

### 4.3 Configurer le fichier .env

```env
APP_NAME=Axioplace
APP_ENV=local
APP_KEY=                          # généré par php artisan key:generate
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=axioplace
DB_USERNAME=root
DB_PASSWORD=

# Sanctum
SANCTUM_STATEFUL_DOMAINS=localhost:5173
SESSION_DRIVER=cookie
SESSION_DOMAIN=localhost

# Upload images
FILESYSTEM_DISK=public
MAX_UPLOAD_SIZE=10240

# CORS
FRONTEND_URL=http://localhost:5173
```

### 4.4 Publier et configurer Sanctum

```bash
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

Dans `config/sanctum.php`, vérifier :

```php
'expiration' => 60 * 24 * 30, // 30 jours en minutes
```

### 4.5 Configurer CORS

Dans `config/cors.php` :

```php
return [
    'paths'               => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods'     => ['*'],
    'allowed_origins'     => [env('FRONTEND_URL', 'http://localhost:5173')],
    'allowed_headers'     => ['*'],
    'exposed_headers'     => [],
    'max_age'             => 0,
    'supports_credentials'=> true,
];
```

### 4.6 Lancer le serveur

```bash
php artisan key:generate
php artisan storage:link
php artisan migrate --seed
php artisan serve
# API disponible sur http://localhost:8000/api
```

---

## 5. Installation Frontend React

### 5.1 Créer le projet

```bash
npm create vite@latest axioplace-front -- --template react
cd axioplace-front
npm install
```

### 5.2 Installer les dépendances

```bash
# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Axios (appels API)
npm install axios

# React Router (navigation SPA)
npm install react-router-dom

# React Query (gestion état serveur) — optionnel mais recommandé
npm install @tanstack/react-query
```

### 5.3 Configurer Tailwind

Dans `tailwind.config.js` :

```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

Dans `src/index.css` :

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 5.4 Configurer le fichier .env

```env
VITE_API_URL=http://localhost:8000/api
```

### 5.5 Lancer le frontend

```bash
npm run dev
# Frontend disponible sur http://localhost:5173
```

---

## 6. Base de données — Structure complète

### 6.1 Créer la base

```sql
CREATE DATABASE axioplace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 6.2 Migrations Laravel (ordre d'exécution)

#### Table `users`

```php
// database/migrations/xxxx_create_users_table.php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('nom', 100);
    $table->string('email', 150)->unique();
    $table->string('telephone', 20)->nullable();
    $table->boolean('telephone_verifie')->default(false);
    $table->string('password');
    $table->string('photo_profil', 500)->nullable();
    $table->enum('role', ['user', 'admin'])->default('user');
    $table->enum('statut', ['actif', 'bloque'])->default('actif');
    $table->timestamps();
});
```

#### Table `categories`

```php
Schema::create('categories', function (Blueprint $table) {
    $table->id();
    $table->string('nom', 100);
    $table->string('slug', 120)->unique();
    $table->timestamp('created_at')->useCurrent();
});
```

#### Table `villes`

```php
Schema::create('villes', function (Blueprint $table) {
    $table->id();
    $table->string('nom', 100);
    $table->string('slug', 120)->unique();
});
```

#### Table `annonces`

```php
Schema::create('annonces', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
    $table->foreignId('categorie_id')->nullable()->constrained('categories')->onDelete('set null');
    $table->foreignId('ville_id')->nullable()->constrained('villes')->onDelete('set null');
    $table->string('titre', 200);
    $table->text('description');
    $table->enum('type_offre', ['location', 'vente', 'colocation', 'terrain']);
    $table->decimal('prix', 12, 2);
    $table->unsignedInteger('surface')->nullable();
    $table->unsignedTinyInteger('nb_pieces')->nullable();
    $table->boolean('telephone_visible')->default(true);
    $table->enum('statut', ['en_attente', 'validee', 'suspendue', 'expiree'])->default('en_attente');
    $table->unsignedInteger('nb_vues')->default(0);
    $table->date('expires_at')->nullable();
    $table->timestamps();
});
```

#### Table `photos`

```php
Schema::create('photos', function (Blueprint $table) {
    $table->id();
    $table->foreignId('annonce_id')->constrained('annonces')->onDelete('cascade');
    $table->string('chemin', 500);
    $table->boolean('principale')->default(false);
    $table->unsignedTinyInteger('ordre')->default(0);
    $table->timestamp('created_at')->useCurrent();
});
```

#### Table `messages`

```php
Schema::create('messages', function (Blueprint $table) {
    $table->id();
    $table->foreignId('expediteur_id')->constrained('users')->onDelete('cascade');
    $table->foreignId('destinataire_id')->constrained('users')->onDelete('cascade');
    $table->foreignId('annonce_id')->nullable()->constrained('annonces')->onDelete('set null');
    $table->text('contenu');
    $table->boolean('lu')->default(false);
    $table->timestamp('created_at')->useCurrent();
});
```

#### Table `signalements`

```php
Schema::create('signalements', function (Blueprint $table) {
    $table->id();
    $table->foreignId('signaleur_id')->constrained('users')->onDelete('cascade');
    $table->foreignId('annonce_id')->nullable()->constrained('annonces')->onDelete('cascade');
    $table->foreignId('user_signale_id')->nullable()->constrained('users')->onDelete('cascade');
    $table->string('motif', 300);
    $table->enum('statut', ['en_attente', 'traite', 'rejete'])->default('en_attente');
    $table->timestamp('created_at')->useCurrent();
});
```

#### Table `favoris`

```php
Schema::create('favoris', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
    $table->foreignId('annonce_id')->constrained('annonces')->onDelete('cascade');
    $table->timestamp('created_at')->useCurrent();
    $table->unique(['user_id', 'annonce_id']);
});
```

### 6.3 Seeders

```bash
php artisan make:seeder DatabaseSeeder
```

```php
// database/seeders/DatabaseSeeder.php
public function run(): void
{
    // Catégories
    foreach (['Immobilier', 'Véhicules', 'Services', 'Emploi'] as $nom) {
        \App\Models\Categorie::create([
            'nom'  => $nom,
            'slug' => \Str::slug($nom),
        ]);
    }

    // Villes du Congo
    $villes = ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi', 'Impfondo', 'Ouesso', 'Madingou'];
    foreach ($villes as $nom) {
        \App\Models\Ville::create([
            'nom'  => $nom,
            'slug' => \Str::slug($nom),
        ]);
    }

    // Admin
    \App\Models\User::create([
        'nom'      => 'Administrateur',
        'email'    => 'admin@axioplace.cg',
        'password' => \Hash::make('Admin@2026!'),
        'role'     => 'admin',
    ]);
}
```

---

## 7. Configuration Sanctum

### 7.1 Ajouter Sanctum au modèle User

```php
// app/Models/User.php
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'nom', 'email', 'telephone', 'telephone_verifie',
        'password', 'photo_profil', 'role', 'statut',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'telephone_verifie' => 'boolean',
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
    ];
}
```

### 7.2 Contrôleur d'authentification

```php
// app/Http/Controllers/Api/AuthController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'nom'       => 'required|string|max:100',
            'email'     => 'required|email|unique:users',
            'telephone' => 'nullable|string|max:20',
            'password'  => 'required|string|min:8|confirmed',
        ]);

        $user  = User::create($data);
        $token = $user->createToken('axioplace-token')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Identifiants incorrects.'],
            ]);
        }

        if ($user->statut === 'bloque') {
            return response()->json(['message' => 'Compte bloqué.'], 403);
        }

        $token = $user->createToken('axioplace-token')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnecté.']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}
```

---

## 8. Routes API complètes

```php
// routes/api.php
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AnnonceController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\FavoriController;
use App\Http\Controllers\Api\SignalementController;
use App\Http\Controllers\Api\Admin\AdminAnnonceController;
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\Admin\AdminSignalementController;
use App\Http\Controllers\Api\CategorieController;
use App\Http\Controllers\Api\VilleController;

// ── Authentification ──────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::delete('/logout', [AuthController::class, 'logout']);
        Route::get('/me',        [AuthController::class, 'me']);
    });
});

// ── Publique ──────────────────────────────────────────────────────────────────
Route::get('/annonces',       [AnnonceController::class, 'index']);
Route::get('/annonces/{id}',  [AnnonceController::class, 'show']);
Route::get('/categories',     [CategorieController::class, 'index']);
Route::get('/villes',         [VilleController::class, 'index']);
Route::post('/signalements',  [SignalementController::class, 'store']);

// ── Authentifiées (Sanctum) ───────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    // Annonces
    Route::post('/annonces',                      [AnnonceController::class, 'store']);
    Route::put('/annonces/{id}',                  [AnnonceController::class, 'update']);
    Route::delete('/annonces/{id}',               [AnnonceController::class, 'destroy']);
    Route::patch('/annonces/{id}/pause',          [AnnonceController::class, 'pause']);
    Route::patch('/annonces/{id}/reactiver',      [AnnonceController::class, 'reactiver']);

    // Favoris
    Route::get('/favoris',          [FavoriController::class, 'index']);
    Route::post('/favoris/{id}',    [FavoriController::class, 'toggle']);

    // Messages
    Route::get('/messages',         [MessageController::class, 'index']);
    Route::post('/messages',        [MessageController::class, 'store']);
});

// ── Administration ────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/annonces',                          [AdminAnnonceController::class, 'index']);
    Route::patch('/annonces/{id}/valider',           [AdminAnnonceController::class, 'valider']);
    Route::patch('/annonces/{id}/refuser',           [AdminAnnonceController::class, 'refuser']);
    Route::get('/signalements',                      [AdminSignalementController::class, 'index']);
    Route::get('/users',                             [AdminUserController::class, 'index']);
    Route::patch('/users/{id}/bloquer',              [AdminUserController::class, 'bloquer']);
});
```

---

## 9. Modèles Eloquent & Relations

```php
// app/Models/Annonce.php
class Annonce extends Model
{
    protected $fillable = [
        'user_id', 'categorie_id', 'ville_id', 'titre', 'description',
        'type_offre', 'prix', 'surface', 'nb_pieces', 'telephone_visible',
        'statut', 'nb_vues', 'expires_at',
    ];

    public function user()       { return $this->belongsTo(User::class); }
    public function categorie()  { return $this->belongsTo(Categorie::class); }
    public function ville()      { return $this->belongsTo(Ville::class); }
    public function photos()     { return $this->hasMany(Photo::class); }
    public function messages()   { return $this->hasMany(Message::class); }
    public function favoris()    { return $this->hasMany(Favori::class); }
    public function signalements() { return $this->hasMany(Signalement::class); }
}

// app/Models/User.php (relations)
public function annonces()      { return $this->hasMany(Annonce::class); }
public function messageEnvoyes(){ return $this->hasMany(Message::class, 'expediteur_id'); }
public function messageRecus()  { return $this->hasMany(Message::class, 'destinataire_id'); }
public function favoris()       { return $this->hasMany(Favori::class); }

// app/Models/Message.php
class Message extends Model
{
    public $timestamps = false;
    protected $fillable = ['expediteur_id', 'destinataire_id', 'annonce_id', 'contenu', 'lu'];

    public function expediteur()  { return $this->belongsTo(User::class, 'expediteur_id'); }
    public function destinataire(){ return $this->belongsTo(User::class, 'destinataire_id'); }
    public function annonce()     { return $this->belongsTo(Annonce::class); }
}

// app/Models/Favori.php
class Favori extends Model
{
    public $timestamps = false;
    protected $fillable = ['user_id', 'annonce_id'];

    public function annonce() { return $this->belongsTo(Annonce::class); }
}

// app/Models/Signalement.php
class Signalement extends Model
{
    public $timestamps = false;
    protected $fillable = ['signaleur_id', 'annonce_id', 'user_signale_id', 'motif', 'statut'];
}
```

---

## 10. Contrôleurs API

### AnnonceController (extrait)

```php
// app/Http/Controllers/Api/AnnonceController.php
public function index(Request $request)
{
    $query = Annonce::with(['user', 'categorie', 'ville', 'photos'])
        ->where('statut', 'validee');

    if ($request->filled('q'))           $query->where('titre', 'like', "%{$request->q}%");
    if ($request->filled('ville_id'))    $query->where('ville_id', $request->ville_id);
    if ($request->filled('categorie_id'))$query->where('categorie_id', $request->categorie_id);
    if ($request->filled('prix_min'))    $query->where('prix', '>=', $request->prix_min);
    if ($request->filled('prix_max'))    $query->where('prix', '<=', $request->prix_max);
    if ($request->filled('type_offre'))  $query->where('type_offre', $request->type_offre);

    $tri = $request->get('tri', 'recent');
    match ($tri) {
        'prix_asc'  => $query->orderBy('prix'),
        'prix_desc' => $query->orderByDesc('prix'),
        default     => $query->latest(),
    };

    return response()->json($query->paginate(15));
}

public function show($id)
{
    $annonce = Annonce::with(['user', 'categorie', 'ville', 'photos'])->findOrFail($id);
    $annonce->increment('nb_vues');
    return response()->json($annonce);
}

public function store(Request $request)
{
    $data = $request->validate([
        'titre'       => 'required|string|max:200',
        'description' => 'required|string',
        'categorie_id'=> 'required|exists:categories,id',
        'ville_id'    => 'required|exists:villes,id',
        'type_offre'  => 'required|in:location,vente,colocation,terrain',
        'prix'        => 'required|numeric|min:0',
        'surface'     => 'nullable|integer',
        'nb_pieces'   => 'nullable|integer',
        'photos'      => 'nullable|array|max:10',
        'photos.*'    => 'image|max:5120',
    ]);

    $annonce = $request->user()->annonces()->create($data);

    if ($request->hasFile('photos')) {
        foreach ($request->file('photos') as $i => $file) {
            $path = $file->store('annonces', 'public');
            $annonce->photos()->create([
                'chemin'     => $path,
                'principale' => $i === 0,
                'ordre'      => $i,
            ]);
        }
    }

    return response()->json($annonce->load('photos'), 201);
}
```

### FavoriController

```php
// app/Http/Controllers/Api/FavoriController.php
public function toggle(Request $request, $annonceId)
{
    $favori = Favori::where('user_id', $request->user()->id)
                    ->where('annonce_id', $annonceId)
                    ->first();

    if ($favori) {
        $favori->delete();
        return response()->json(['action' => 'removed']);
    }

    Favori::create(['user_id' => $request->user()->id, 'annonce_id' => $annonceId]);
    return response()->json(['action' => 'added']);
}
```

---

## 11. Middlewares & Rôles

### Créer le middleware de rôle

```bash
php artisan make:middleware CheckRole
```

```php
// app/Http/Middleware/CheckRole.php
public function handle(Request $request, Closure $next, string $role): Response
{
    if ($request->user()?->role !== $role) {
        return response()->json(['message' => 'Accès interdit.'], 403);
    }
    return $next($request);
}
```

### Enregistrer le middleware

```php
// bootstrap/app.php (Laravel 11)
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias(['role' => \App\Http\Middleware\CheckRole::class]);
})
```

---

## 12. Frontend React — Structure

```
src/
├── api/
│   ├── axios.js          ← Instance Axios configurée
│   ├── auth.js           ← register, login, logout, me
│   ├── annonces.js       ← CRUD annonces
│   ├── messages.js       ← messagerie
│   ├── favoris.js        ← toggle favoris
│   └── admin.js          ← endpoints admin
│
├── context/
│   └── AuthContext.jsx   ← token, user, login(), logout()
│
├── components/
│   ├── Navbar.jsx
│   ├── AnnonceCard.jsx
│   ├── SearchBar.jsx
│   └── ProtectedRoute.jsx
│
├── pages/
│   ├── Home.jsx
│   ├── AnnoncesList.jsx
│   ├── AnnonceDetail.jsx
│   ├── PublierAnnonce.jsx
│   ├── MesAnnonces.jsx
│   ├── Messagerie.jsx
│   ├── Favoris.jsx
│   ├── Profil.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   └── admin/
│       ├── Dashboard.jsx
│       ├── Moderation.jsx
│       ├── Signalements.jsx
│       └── Utilisateurs.jsx
│
└── App.jsx               ← Routes React Router
```

### App.jsx — Routage

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Publiques */}
        <Route path="/"              element={<Home />} />
        <Route path="/annonces"      element={<AnnoncesList />} />
        <Route path="/annonces/:id"  element={<AnnonceDetail />} />
        <Route path="/login"         element={<Login />} />
        <Route path="/register"      element={<Register />} />

        {/* Authentifiées */}
        <Route element={<ProtectedRoute />}>
          <Route path="/publier"       element={<PublierAnnonce />} />
          <Route path="/mes-annonces"  element={<MesAnnonces />} />
          <Route path="/messagerie"    element={<Messagerie />} />
          <Route path="/favoris"       element={<Favoris />} />
          <Route path="/profil"        element={<Profil />} />
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute role="admin" />}>
          <Route path="/admin"                element={<Dashboard />} />
          <Route path="/admin/moderation"     element={<Moderation />} />
          <Route path="/admin/signalements"   element={<Signalements />} />
          <Route path="/admin/utilisateurs"   element={<Utilisateurs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 13. Gestion du token Sanctum côté React

### Instance Axios

```js
// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// Injecter le token à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sanctum_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Rediriger vers /login si 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sanctum_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

### AuthContext

```jsx
// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sanctum_token');
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => localStorage.removeItem('sanctum_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('sanctum_token', data.token);
    setUser(data.user);
  };

  const logout = async () => {
    await api.delete('/auth/logout');
    localStorage.removeItem('sanctum_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### ProtectedRoute

```jsx
// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Chargement...</div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return <Outlet />;
}
```

### Appels API — exemples

```js
// src/api/annonces.js
import api from './axios';

export const getAnnonces = (params) => api.get('/annonces', { params });
export const getAnnonce  = (id)     => api.get(`/annonces/${id}`);
export const creerAnnonce= (data)   => api.post('/annonces', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const modifierAnnonce = (id, data) => api.put(`/annonces/${id}`, data);
export const supprimerAnnonce= (id)       => api.delete(`/annonces/${id}`);
export const pauseAnnonce    = (id)       => api.patch(`/annonces/${id}/pause`);
export const reactiverAnnonce= (id)       => api.patch(`/annonces/${id}/reactiver`);

// src/api/favoris.js
export const getFavoris  = ()   => api.get('/favoris');
export const toggleFavori= (id) => api.post(`/favoris/${id}`);

// src/api/messages.js
export const getMessages = ()     => api.get('/messages');
export const envoyerMessage=(data)=> api.post('/messages', data);
```

---

## 14. Scénarios de tests

### Tests fonctionnels

| # | Test | Scénario | Résultat attendu |
|---|------|----------|-----------------|
| 1 | Inscription | POST /api/auth/register avec données valides | 201, token Sanctum retourné |
| 2 | Connexion | POST /api/auth/login avec bons credentials | 200, token Bearer retourné |
| 3 | Persistance token | Rechargement de la SPA React | Utilisateur toujours connecté |
| 4 | Route protégée | Requête sans token | 401 Unauthorized |
| 5 | Publication | POST /api/annonces + 3 photos | 201, statut 'en_attente' |
| 6 | Validation admin | PATCH /api/admin/annonces/{id}/valider | Statut 'validee' |
| 7 | Refus admin | PATCH avec motif | Annonce masquée |
| 8 | Recherche | GET /api/annonces?ville_id=1&prix_max=200000 | Liste filtrée |
| 9 | Message | POST /api/messages | 201, lu=0 |
| 10 | Favori toggle | POST /api/favoris/{id} (x2) | Ajout puis retrait |
| 11 | Signalement | POST /api/signalements | En attente back-office |
| 12 | Suspension | PATCH /api/annonces/{id}/pause | Masquée des résultats |
| 13 | Déconnexion | DELETE /api/auth/logout | Token invalidé, 401 ensuite |
| 14 | Blocage user | PATCH /api/admin/users/{id}/bloquer | Connexion impossible |

### Collection Postman — Variables

```json
{
  "base_url": "http://localhost:8000/api",
  "token": "{{sanctum_token}}"
}
```

Header à ajouter sur toutes les routes protégées :
```
Authorization: Bearer {{sanctum_token}}
```

---

## 15. Planning de développement

| Semaine | Objectif | Tâches |
|---------|----------|--------|
| S1 | Conception | CDC, UML, MCD, config environnements Laravel + React |
| S2 | Infrastructure | Migrations 8 tables, seeders, Sanctum, Axios, React Router |
| S3 | Authentification | register / login / logout / me — AuthContext React — middleware rôle |
| S4 | Annonces consultation | Home, liste, détail, galerie, compteur de vues |
| S5 | Annonces gestion | Publication (upload), modification, suppression, suspension, réactivation |
| S6 | Recherche & filtres | Moteur de recherche React, filtres dynamiques, tri, pagination API |
| S7 | Messagerie | Messagerie interne API, badge non-lus, WhatsApp, blocage |
| S8 | Favoris & signalements | Toggle favoris, signalements, écran profil |
| S9 | Administration | Dashboard React admin, modération, signalements, gestion users |
| S10 | Tests & soutenance | Tests Postman, correction bugs, README, préparation jury BTS |

---

## Commandes utiles

```bash
# Laravel
php artisan migrate:fresh --seed     # Réinitialiser la BDD
php artisan route:list --path=api    # Lister toutes les routes API
php artisan make:controller Api/AnnonceController --api
php artisan make:model Annonce -m    # Modèle + migration
php artisan make:request StoreAnnonceRequest
php artisan make:middleware CheckRole
php artisan storage:link             # Lier le dossier public/storage

# React
npm run dev      # Démarrer en développement
npm run build    # Build production
```

---

*Axioplace v1.0 — Avril 2026 — Orman Boudimbou — Scholia Institut*

# AXIOPLACE — Design System Complet & Fichiers Intégrés

> Tous les CSS sont intégrés directement dans chaque fichier.  
> Le designer n'a **aucune raison** de modifier les fichiers CSS séparés.  
> Couleurs officielles : `#FFC533` (jaune) · `#009543` (vert) · `#DC241F` (rouge hover)

---

## Palette de couleurs & variables design

```
#FFC533  → Jaune principal (boutons, accents, actif)
#009543  → Vert principal (prix, liens, succès)
#DC241F  → Rouge (hover boutons, danger)
#1c1c1c  → Texte principal
#6b6b6b  → Texte secondaire
#f7f8fc  → Fond clair
#eef1f7  → Fond légèrement bleu
white    → Cartes, navbar, éléments en relief
```

---

## 1. `layouts/app.blade.php` — Layout principal

```html
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>

    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="base-url" content="{{ url('/') }}">

    <title>@yield('title', 'Axioplace')</title>

    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

    @stack('styles')

    <style>

    /* ===== RESET ===== */
    *{ margin:0; padding:0; box-sizing:border-box; font-family:'Inter',sans-serif; }

    body{
        background:linear-gradient(180deg,#f7f8fc 0%,#eef1f7 100%);
        color:#1c1c1c;
        min-height:100vh;
        overflow-x:hidden;
    }

    /* ===== NAVBAR ===== */
    .navbar{
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding:20px 60px;
        background:rgba(255,255,255,0.75);
        backdrop-filter:blur(12px);
        box-shadow:0 8px 30px rgba(0,0,0,0.05);
        position:sticky;
        top:0;
        z-index:100;
    }

    .logo{
        display:flex;
        align-items:center;
        gap:10px;
        font-weight:600;
        font-size:18px;
        color:#333;
        text-decoration:none;
    }
    .logo i{ color:#FFC533; font-size:22px; }

    .menu{ display:flex; gap:40px; }

    .menu a{
        text-decoration:none;
        color:#6b6b6b;
        font-weight:500;
        position:relative;
    }
    .menu a.active{ color:#111; }
    .menu a.active::after{
        content:"";
        position:absolute;
        bottom:-8px; left:0;
        width:100%; height:3px;
        background:#FFC533;
        border-radius:4px;
    }

    .nav-right{ display:flex; align-items:center; gap:12px; }

    .icon{
        width:40px; height:40px;
        display:flex; align-items:center; justify-content:center;
        border-radius:50%;
        background:rgba(255,255,255,0.7);
        box-shadow:0 4px 10px rgba(0,0,0,0.08);
        cursor:pointer;
        transition:0.2s;
        text-decoration:none;
        color:#333;
    }
    .icon:hover{ background:white; transform:scale(1.05); }

    .btn-login{
        background:rgba(255,255,255,0.7);
        border:1px solid rgba(0,0,0,0.05);
        padding:10px 16px;
        border-radius:12px;
        font-weight:500;
        cursor:pointer;
        text-decoration:none;
        color:#333;
        transition:0.2s;
    }
    .btn-login:hover{ background:white; }

    .btn-publish{
        background:#FFC533;
        border:none;
        padding:12px 18px;
        border-radius:12px;
        font-weight:600;
        cursor:pointer;
        text-decoration:none;
        color:#333;
        transition:0.2s;
    }
    .btn-publish:hover{ background:#ffb700; transform:translateY(-1px); }

    .badge-fav{
        background:red; color:white;
        padding:2px 6px; border-radius:10px;
        font-size:11px; margin-left:5px;
    }

    /* ===== FOOTER ===== */
    footer{
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:40px 80px;
        margin-top:40px;
        background:rgba(255,255,255,0.8);
        backdrop-filter:blur(10px);
    }
    .footer-left{ display:flex; gap:22px; font-size:14px; color:#6b6b6b; }
    .footer-left a{ cursor:pointer; text-decoration:none; color:#6b6b6b; }
    .footer-right img{ height:40px; margin-left:10px; }

    /* ===== AUTH PAGE ===== */
    .auth-page{
        min-height:100vh;
        display:flex; align-items:center; justify-content:center;
        background:linear-gradient(135deg,rgba(255,197,51,0.9),rgba(0,149,67,0.7)),
                   url("https://i.pinimg.com/originals/3c/05/71/3c05716d80249529424e1a05b9f414c1.jpg");
        background-size:cover; background-position:center;
        position:relative;
    }
    .auth-overlay{ position:absolute; width:100%; height:100%; backdrop-filter:blur(2px); }

    .auth-card{
        position:relative;
        width:100%; max-width:420px;
        background:rgba(255,255,255,0.9);
        backdrop-filter:blur(20px);
        padding:35px; border-radius:20px;
        box-shadow:0 25px 60px rgba(0,0,0,0.2);
        border:1px solid rgba(255,255,255,0.3);
        animation:fadeIn 0.6s ease;
    }
    .auth-card h2{ font-size:28px; font-weight:800; text-align:center; color:#111; }
    .auth-subtitle{ text-align:center; color:#555; margin-bottom:25px; }

    .input-group{ margin-bottom:18px; }
    .input-group label{ font-size:13px; color:#444; }
    .input-group input{
        width:100%; padding:13px; margin-top:5px;
        border-radius:12px; border:1px solid #ddd; transition:0.2s;
    }
    .input-group input:focus{
        border-color:#FFC533;
        box-shadow:0 0 0 2px rgba(255,197,51,0.2);
        outline:none;
    }

    .btn-auth{
        width:100%; padding:14px; border:none;
        border-radius:12px; background:#FFC533;
        font-weight:700; cursor:pointer; transition:0.3s;
    }
    .btn-auth:hover{ background:#DC241F; color:white; transform:translateY(-2px); }

    .auth-footer{ margin-top:10px; text-align:center; }
    .auth-footer a{ color:#009543; font-weight:600; text-decoration:none; }

    .forgot-link{
        color:#009543; font-weight:600;
        text-decoration:none; font-size:14px;
        transition:0.3s; position:relative;
    }
    .forgot-link:hover{ color:#DC241F; }

    @keyframes fadeIn{
        from{ opacity:0; transform:translateY(30px); }
        to{ opacity:1; transform:translateY(0); }
    }

    /* ===== RESPONSIVE ===== */
    @media(max-width:768px){
        .navbar{ flex-direction:column; align-items:flex-start; padding:15px; gap:12px; }
        .menu{ width:100%; justify-content:space-between; gap:10px; flex-wrap:wrap; }
        .nav-right{ width:100%; justify-content:space-between; }
        .btn-login,.btn-publish{ flex:1; text-align:center; }
        footer{ flex-direction:column; gap:15px; text-align:center; padding:30px 15px; }
        .auth-card{ margin:10px; padding:25px; }
    }

    </style>

</head>
<body>

<!-- ===== NAVBAR ===== -->
<header class="navbar">

    <a href="{{ route('home') }}" class="logo">
        <i class="fa-solid fa-mountain-sun"></i>
        <span>Axioplace</span>
    </a>

    <nav class="menu">
        <a href="{{ route('home') }}" class="{{ request()->is('/') ? 'active' : '' }}">Accueil</a>
        <a href="{{ route('annonces.index') }}" class="{{ request()->routeIs('annonces.*') ? 'active' : '' }}">Annonces</a>
        @auth
        <a href="{{ route('favorites.index') }}" class="{{ request()->routeIs('favorites.*') ? 'active' : '' }}">
            Favoris
            <span class="badge-fav">{{ auth()->user()->favoris()->count() }}</span>
        </a>
        @endauth
    </nav>

    <div class="nav-right">
        @guest
            <a href="{{ route('login') }}" class="btn-login">Connexion</a>
            <a href="{{ route('register') }}" class="btn-login">Inscription</a>
        @endguest

        @auth
            <form method="POST" action="{{ route('logout') }}" style="display:inline;">
                @csrf
                <button type="submit" class="btn-login">Déconnexion</button>
            </form>
        @endauth

        <a href="{{ auth()->check() ? route('annonces.create') : route('login') }}" class="btn-publish">
            + Publier une annonce
        </a>

        <div class="icon"><i class="fa-regular fa-bell"></i></div>

        <a href="{{ auth()->check() ? route('profil') : route('login') }}" class="icon">
            <i class="fa-regular fa-user"></i>
        </a>
    </div>

</header>

<main style="overflow-x:hidden;">
    @yield('content')
</main>

<!-- ===== FOOTER ===== -->
<footer>
    <div class="footer-left">
        <a href="#">A propos</a>
        <a href="#">Contact</a>
        <a href="#">CGU</a>
        <a href="#">Politique de confidentialité</a>
    </div>
    <div class="footer-right">
        <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg">
        <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg">
    </div>
</footer>

<!-- ===== JS GLOBAL ===== -->
<script>
window.csrfToken = document.querySelector('meta[name="csrf-token"]').content;
window.baseUrl   = document.querySelector('meta[name="base-url"]').content;

window.apiFetch = async function(url, options = {}) {
    const token = localStorage.getItem('sanctum_token');
    const response = await fetch(window.baseUrl + url, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': options.body instanceof FormData ? undefined : 'application/json',
            ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
            ...options.headers
        },
        ...options
    });
    if (response.status === 401) { window.location.href = '/login'; throw new Error('401'); }
    if (!response.ok) throw new Error('Erreur API ' + response.status);
    return await response.json();
};
</script>

@stack('scripts')

</body>
</html>
```

---

## 2. `pages/home.blade.php` — Page d'accueil

```html
@extends('layouts.app')
@section('title', 'Accueil — Axioplace')
@section('content')

<style>

/* ===== HERO ===== */
.hero{
    height:350px;
    background:url("https://i.pinimg.com/originals/3c/05/71/3c05716d80249529424e1a05b9f414c1.jpg") center/cover;
    display:flex; align-items:center; justify-content:center;
    position:relative;
}
.overlay{
    position:absolute; width:100%; height:100%;
    background:rgba(255,255,255,0.15);
    backdrop-filter:blur(4px);
}
.hero-content{ text-align:center; position:relative; z-index:1; }
.hero h1{ font-size:40px; font-weight:800; margin-bottom:10px; color:white; text-shadow:0 2px 10px rgba(0,0,0,0.3); }
.hero p{ color:#ffffff; margin-bottom:25px; }

/* ===== SEARCH BAR ===== */
.search-bar{
    display:flex; align-items:center; gap:10px;
    background:rgba(255,255,255,0.75);
    backdrop-filter:blur(12px);
    padding:14px; border-radius:18px;
    box-shadow:0 20px 50px rgba(0,0,0,0.1);
}
.search-bar input, .search-bar select{
    border:none; padding:12px; border-radius:10px;
    background:transparent; font-size:14px; outline:none;
}
.filter-btn{
    border:none; background:#f3f4f8; padding:10px 14px;
    border-radius:10px; cursor:pointer; font-weight:500;
    display:flex; gap:6px; align-items:center;
}
.search-btn{
    background:#FFC533; border:none; padding:12px 20px;
    border-radius:12px; font-weight:600;
    display:flex; align-items:center; gap:8px;
    cursor:pointer; transition:0.2s;
}
.search-btn:hover{ background:#ffb700; transform:translateY(-1px); }

/* ===== CATEGORIES ===== */
.categories{
    display:flex; justify-content:space-between; align-items:center;
    width:80%; margin:auto; margin-top:-60px; padding:20px;
    background:rgba(255,255,255,0.75);
    backdrop-filter:blur(12px);
    border-radius:20px;
    box-shadow:0 25px 60px rgba(0,0,0,0.08);
}
.category{
    flex:1; text-align:center; padding:14px;
    border-radius:14px; transition:0.25s; cursor:pointer; color:#6b6b6b;
}
.category i{ font-size:20px; margin-bottom:5px; display:block; }
.category:hover{ background:#f3f5f8; }
.category.active{ background:white; color:#FFC533; box-shadow:0 10px 25px rgba(0,0,0,0.08); }

/* ===== SECTION ===== */
.section{ padding:60px 80px; }
.section-title{ display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; }
.section h2{ font-size:22px; font-weight:600; }

.btn-all{
    background:#FFC533; border:none; padding:10px 18px;
    border-radius:12px; font-weight:600; cursor:pointer; color:#333;
    transition:0.2s;
}
.btn-all:hover{ background:#ffb700; }

/* ===== SLIDER CONTAINER ===== */
.slide-wrapper{ position:relative; }
.slide-btn{
    position:absolute; top:50%; transform:translateY(-50%);
    z-index:10; width:42px; height:42px;
    border-radius:50%; border:none; background:#FFC533; cursor:pointer;
    font-size:16px;
}
.slide-btn.left{ left:-10px; }
.slide-btn.right{ right:-10px; }

/* ===== CARDS SCROLL ===== */
.cards{
    display:flex; overflow-x:auto; gap:25px; scroll-behavior:smooth;
    -ms-overflow-style:none; scrollbar-width:none;
    padding:10px 5px;
}
.cards::-webkit-scrollbar{ display:none; }

/* ===== CARD ===== */
.card{
    flex:0 0 auto; min-width:260px; max-width:260px;
    background:white; border-radius:18px; overflow:hidden;
    box-shadow:0 10px 30px rgba(0,0,0,0.08);
    transition:0.25s; cursor:pointer; position:relative;
}
.card:hover{ transform:translateY(-6px); box-shadow:0 20px 40px rgba(0,0,0,0.12); }
.card img{ width:100%; height:170px; object-fit:cover; display:block; }
.card-content{ padding:16px; }
.card-content h3{ font-size:16px; font-weight:600; margin-bottom:4px; }
.location{ color:#8a8a8a; font-size:13px; margin-bottom:6px; }
.price{ font-weight:700; font-size:15px; color:#009543; margin-top:6px; }
.desc{
    font-size:13px; color:#666; margin-top:4px;
    display:-webkit-box; -webkit-line-clamp:2;
    -webkit-box-orient:vertical; overflow:hidden;
}

/* ===== FAVORITE ===== */
.favorite{
    position:absolute; top:10px; right:10px;
    background:white; width:36px; height:36px;
    border-radius:50%; display:flex; align-items:center; justify-content:center;
    cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.1); z-index:20;
}
.favorite i{ color:#888; }
.favorite.active i{ color:red; }

/* ===== RESPONSIVE ===== */
@media(max-width:768px){
    .hero{ height:auto; padding:40px 15px; }
    .hero h1{ font-size:26px; }
    .search-bar{ flex-direction:column; width:100%; gap:8px; }
    .search-bar input,.search-bar select,.search-bar button{ width:100%; }
    .categories{ flex-wrap:wrap; width:95%; margin-top:-30px; gap:8px; padding:12px; }
    .category{ flex:1 1 30%; font-size:13px; padding:10px; }
    .section{ padding:30px 15px; }
}

</style>

<!-- HERO -->
<section class="hero">
    <div class="overlay"></div>
    <div class="hero-content">
        <h1>Que recherchez-vous ?</h1>
        <p>Explorez et trouvez des milliers d'annonces près de chez vous</p>

        <form method="GET" action="{{ route('annonces.index') }}" class="search-bar">
            <select name="category">
                <option value="">Catégorie</option>
                @foreach($categories as $cat)
                    <option value="{{ $cat->id }}">{{ $cat->nom }}</option>
                @endforeach
            </select>

            <input type="text" name="q" placeholder="Que recherchez-vous ?">

            <button class="filter-btn" type="button">
                <i class="fa-solid fa-sliders"></i> Filtres
            </button>

            <button class="search-btn" type="submit">
                Rechercher <i class="fa-solid fa-arrow-right"></i>
            </button>
        </form>
    </div>
</section>

<!-- CATEGORIES -->
<section class="categories">
    @foreach($categories as $cat)
        <div class="category" onclick="loadCategory({{ $cat->id }})">
            @if($cat->slug == 'immobilier') <i class="fa-solid fa-house"></i>
            @elseif($cat->slug == 'vehicules') <i class="fa-solid fa-car"></i>
            @elseif($cat->slug == 'emploi') <i class="fa-solid fa-briefcase"></i>
            @elseif($cat->slug == 'services') <i class="fa-solid fa-screwdriver-wrench"></i>
            @else <i class="fa-solid fa-grip"></i>
            @endif
            <p>{{ $cat->nom }}</p>
        </div>
    @endforeach
</section>

<!-- ANNONCES -->
<section class="section">
    <div class="section-title">
        <h2 id="section-title">🔥 Annonces Populaires</h2>
        <a href="{{ route('annonces.index') }}">
            <button class="btn-all">Voir toutes les annonces</button>
        </a>
    </div>

    <div class="slide-wrapper">
        <button onclick="slideLeft()" class="slide-btn left">❮</button>
        <div class="cards" id="annonces-container"></div>
        <button onclick="slideRight()" class="slide-btn right">❯</button>
    </div>
</section>

<script>
loadHome();

async function loadHome(){
    let data = await apiFetch('/api/annonces');
    renderCards(data.data || data);
}

function renderCards(list){
    let container = document.getElementById('annonces-container');
    container.innerHTML = '';
    list.slice(0,10).forEach(a => {
        let image = a.photos?.[0]?.chemin ? '/storage/' + a.photos[0].chemin : '/images/placeholder.jpg';
        container.innerHTML += `
        <div onclick="window.location='/annonces/${a.id}'" class="card">
            <div class="favorite" onclick="toggleFav(event,this,${a.id})">
                <i class="fa-regular fa-heart"></i>
            </div>
            <img src="${image}" loading="lazy">
            <div class="card-content">
                <h3>${a.titre}</h3>
                <p class="location"><i class="fa-solid fa-location-dot"></i> ${a.ville?.nom ?? ''}</p>
                <p class="price">${Number(a.prix).toLocaleString()} FCFA</p>
                <p class="desc">${a.description?.substring(0,80) ?? ''}</p>
            </div>
        </div>`;
    });
}

async function toggleFav(e, el, id){
    e.preventDefault(); e.stopPropagation();
    try {
        let res = await apiFetch('/api/favoris/' + id, { method:'POST' });
        let icon = el.querySelector('i');
        let added = res.action === 'added';
        el.classList.toggle('active', added);
        icon.className = added ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    } catch(err){ window.location.href = '/login'; }
}

function slideLeft(){ document.getElementById('annonces-container').scrollBy({left:-300,behavior:'smooth'}); }
function slideRight(){ document.getElementById('annonces-container').scrollBy({left:300,behavior:'smooth'}); }

async function loadCategory(id){
    document.querySelectorAll('.category').forEach(c => c.classList.remove('active'));
    event.currentTarget.classList.add('active');
    let data = await apiFetch('/api/annonces?categorie_id=' + id);
    document.getElementById('section-title').innerText = "Annonces filtrées";
    renderCards(data.data || data);
}
</script>

@endsection
```

---

## 3. `pages/annonces/index.blade.php` — Liste des annonces

```html
@extends('layouts.app')
@section('title', 'Annonces — Axioplace')
@section('content')

<style>

/* ===== SEARCH WRAPPER ===== */
.search-wrapper{ width:100%; background:#f6f7f9; padding:20px 0; }

.search-bar-annonces{
    max-width:1200px; margin:auto; background:white;
    padding:20px; border-radius:16px;
    box-shadow:0 10px 30px rgba(0,0,0,0.05);
}

.search-top{ display:flex; gap:10px; }
.search-top input, .search-top select{
    flex:1; padding:12px; border-radius:10px;
    border:1px solid #ddd; font-size:14px;
}
.search-top button{
    background:#FFC533; border:none; padding:12px 20px;
    border-radius:10px; font-weight:600; cursor:pointer;
}
.filters{ display:flex; gap:10px; margin-top:10px; flex-wrap:wrap; }
.filters input, .filters select{
    padding:12px; border-radius:10px; border:1px solid #ddd; font-size:14px;
}

/* ===== PAGE & GRID ===== */
.page{ max-width:1200px; margin:auto; padding:20px; }
.grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }

/* ===== CARD ===== */
.card{
    background:white; border-radius:16px; overflow:hidden;
    box-shadow:0 8px 25px rgba(0,0,0,0.06);
    transition:0.25s; position:relative; cursor:pointer;
}
.card:hover{ transform:translateY(-4px); box-shadow:0 15px 35px rgba(0,0,0,0.1); }

/* ===== SLIDER ===== */
.card-slider{ position:relative; }
.card-slider img{ width:100%; height:200px; object-fit:cover; display:block; transition:opacity 0.3s; }

.slider-btn{
    position:absolute; top:50%; transform:translateY(-50%);
    background:rgba(0,0,0,0.4); color:white; border:none;
    border-radius:50%; width:30px; height:30px; cursor:pointer; z-index:10;
}
.slider-btn.left{ left:10px; }
.slider-btn.right{ right:10px; }

/* ===== FAVORITE ===== */
.favorite{
    position:absolute; top:10px; right:10px;
    background:white; width:36px; height:36px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.1); z-index:20;
}
.favorite i{ color:#888; }
.favorite.active i{ color:red; }

/* ===== PRICE BADGE ===== */
.price-badge{
    position:absolute; bottom:10px; left:10px;
    background:white; padding:6px 10px; border-radius:8px;
    font-weight:700; color:#009543; font-size:14px;
}

/* ===== CONTENT ===== */
.content{ padding:14px; }
.title{ font-weight:600; font-size:15px; margin-bottom:4px; }
.meta{ font-size:12px; color:#777; }
.desc{
    font-size:13px; color:#666; margin-top:6px;
    display:-webkit-box; -webkit-line-clamp:2;
    -webkit-box-orient:vertical; overflow:hidden;
}

/* ===== RESPONSIVE ===== */
@media(max-width:900px){
    .grid{ grid-template-columns:1fr; }
    .search-top{ flex-direction:column; }
}

</style>

<!-- FILTRE -->
<div class="search-wrapper">
    <div class="search-bar-annonces">
        <form id="searchForm">
            <div class="search-top">
                <input type="text" name="q" placeholder="Rechercher une annonce...">
                <select name="categorie_id" id="categoryFilter">
                    <option value="">Toutes catégories</option>
                    @foreach($categories as $cat)
                        <option value="{{ $cat->id }}" data-slug="{{ $cat->slug }}">{{ $cat->nom }}</option>
                    @endforeach
                </select>
                <select name="ville_id">
                    <option value="">Toutes les villes</option>
                    @foreach($villes as $v)
                        <option value="{{ $v->id }}">{{ $v->nom }}</option>
                    @endforeach
                </select>
                <button type="submit">🔍 Rechercher</button>
            </div>
            <div class="filters">
                <input type="number" name="prix_min" placeholder="Prix min (FCFA)">
                <input type="number" name="prix_max" placeholder="Prix max (FCFA)">
                <select name="type_offre">
                    <option value="">Type d'offre</option>
                    <option value="location">Location</option>
                    <option value="vente">Vente</option>
                    <option value="colocation">Colocation</option>
                    <option value="terrain">Terrain</option>
                </select>
                <select name="tri">
                    <option value="recent">Plus récent</option>
                    <option value="prix_asc">Prix croissant</option>
                    <option value="prix_desc">Prix décroissant</option>
                </select>
            </div>
        </form>
    </div>
</div>

<!-- GRID -->
<div class="page">
    <div class="grid" id="annoncesContainer"></div>
    <div id="paginationContainer" style="text-align:center; margin-top:30px;"></div>
</div>

<script>
loadAnnonces();

async function loadAnnonces(params = '') {
    let data = await apiFetch('/api/annonces' + params);
    let container = document.getElementById('annoncesContainer');
    container.innerHTML = '';

    (data.data || []).forEach(annonce => {
        let images = annonce.photos?.map(p => p.chemin) || [];
        let image  = images[0] ? '/storage/' + images[0] : '/images/placeholder.jpg';

        container.innerHTML += `
        <div onclick="window.location='/annonces/${annonce.id}'" style="cursor:pointer;">
            <div class="card">
                <div class="favorite" onclick="toggleFav(event,this,${annonce.id})">
                    <i class="fa-regular fa-heart"></i>
                </div>
                <div class="card-slider">
                    <img class="slider-image"
                         data-images='${JSON.stringify(images)}'
                         data-index="0"
                         src="${image}" loading="lazy">
                    ${images.length > 1 ? `
                    <button class="slider-btn left"  onclick="prevSlide(event,this)">❮</button>
                    <button class="slider-btn right" onclick="nextSlide(event,this)">❯</button>
                    ` : ''}
                    <div class="price-badge">${Number(annonce.prix).toLocaleString()} FCFA</div>
                </div>
                <div class="content">
                    <div class="title">${annonce.titre}</div>
                    <div class="meta"><i class="fa-solid fa-location-dot"></i> ${annonce.ville?.nom ?? ''}</div>
                    <div class="desc">${annonce.description?.substring(0,80) ?? ''}</div>
                </div>
            </div>
        </div>`;
    });
}

document.getElementById('searchForm').addEventListener('submit', function(e){
    e.preventDefault();
    let params = '?' + new URLSearchParams(new FormData(this)).toString();
    loadAnnonces(params);
});

async function toggleFav(e, el, id){
    e.preventDefault(); e.stopPropagation();
    try {
        let res = await apiFetch('/api/favoris/' + id, { method:'POST' });
        let icon = el.querySelector('i');
        let added = res.action === 'added';
        el.classList.toggle('active', added);
        icon.className = added ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    } catch(err){ console.error(err); }
}

function nextSlide(e, btn){
    e.preventDefault(); e.stopPropagation();
    let img = btn.closest('.card-slider').querySelector('.slider-image');
    let imgs = JSON.parse(img.dataset.images || '[]');
    if(!imgs.length) return;
    let idx = (parseInt(img.dataset.index||0)+1) % imgs.length;
    img.dataset.index = idx;
    img.src = '/storage/' + imgs[idx];
}
function prevSlide(e, btn){
    e.preventDefault(); e.stopPropagation();
    let img = btn.closest('.card-slider').querySelector('.slider-image');
    let imgs = JSON.parse(img.dataset.images || '[]');
    if(!imgs.length) return;
    let idx = (parseInt(img.dataset.index||0)-1+imgs.length) % imgs.length;
    img.dataset.index = idx;
    img.src = '/storage/' + imgs[idx];
}
</script>

@endsection
```

---

## 4. `pages/annonces/show.blade.php` — Détail d'une annonce

```html
@extends('layouts.app')
@section('title', 'Annonce — Axioplace')
@section('content')

<style>

.container{ max-width:1200px; margin:auto; padding:16px; }

/* ===== LAYOUT 2 COLONNES ===== */
.layout{
    display:grid; grid-template-columns:2fr 1fr;
    gap:20px; align-items:start;
}

/* ===== SLIDER ===== */
.slider{ position:relative; }
.slider img{
    width:100%; height:320px; object-fit:cover; border-radius:16px; display:block;
}
.slider-btn{
    position:absolute; top:50%; transform:translateY(-50%);
    background:rgba(0,0,0,0.5); color:white; border:none;
    border-radius:50%; width:40px; height:40px; cursor:pointer; z-index:10;
}
.slider-btn.left{ left:10px; }
.slider-btn.right{ right:10px; }

/* ===== CARD ===== */
.card{
    background:white; padding:18px; border-radius:16px; margin-top:14px;
    box-shadow:0 6px 20px rgba(0,0,0,0.04); height:auto; align-self:start;
}

/* ===== TITLE & PRICE ===== */
.title{ font-size:22px; font-weight:600; color:#111; }
.price{ font-size:26px; font-weight:700; margin-top:6px; color:#009543; }

/* ===== META ===== */
.meta{
    display:flex; justify-content:space-between;
    font-size:13px; color:#888; margin-top:8px; align-items:center;
}

/* ===== DETAILS ===== */
.detail{
    display:flex; justify-content:space-between;
    padding:10px 0; border-bottom:1px solid #f0f0f0; font-size:14px;
}

/* ===== DESCRIPTION ===== */
.description{ line-height:1.6; color:#444; margin-top:10px; }

/* ===== SIDEBAR ===== */
.sidebar{ position:sticky; top:100px; align-self:start; }

/* ===== BUTTON ===== */
.btn{
    width:100%; padding:14px; background:#FFC533; border:none;
    border-radius:12px; font-weight:600; margin-top:10px; cursor:pointer;
    display:flex; align-items:center; justify-content:center; gap:8px;
    font-size:15px; transition:0.2s;
}
.btn:hover{ background:#DC241F; color:white; }
.btn.whatsapp{ background:#25D366; color:white; }
.btn.whatsapp:hover{ background:#1ebe5a; }

/* ===== THUMBNAILS ===== */
.thumbnails{ display:flex; gap:8px; margin-top:10px; flex-wrap:wrap; }
.thumbnails img{
    width:70px; height:55px; object-fit:cover; border-radius:8px;
    cursor:pointer; opacity:0.7; transition:0.2s; border:2px solid transparent;
}
.thumbnails img.active, .thumbnails img:hover{ opacity:1; border-color:#FFC533; }

/* ===== RESPONSIVE ===== */
@media(max-width:900px){
    .layout{ grid-template-columns:1fr; }
    .sidebar{ position:static; }
    .slider img{ height:220px; }
}

</style>

<div class="container">
    <div id="annonceContainer">
        <div style="text-align:center; padding:60px; color:#888;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size:30px;"></i>
            <p style="margin-top:10px;">Chargement de l'annonce...</p>
        </div>
    </div>
</div>

<script>
let annonceId = window.location.pathname.split('/').pop();

async function loadAnnonce(){
    try {
        let annonce = await apiFetch('/api/annonces/' + annonceId);
        let images  = annonce.photos?.map(p => '/storage/' + p.chemin) ?? [];
        let mainImg = images[0] ?? '/images/placeholder.jpg';

        let thumbnailsHtml = images.length > 1
            ? `<div class="thumbnails" id="thumbs">
                ${images.map((src, i) => `
                <img src="${src}" class="${i===0?'active':''}" onclick="goToImage(${i})" loading="lazy">
                `).join('')}
               </div>`
            : '';

        document.getElementById('annonceContainer').innerHTML = `
        <div class="layout">
            <div>
                <!-- SLIDER -->
                <div class="slider">
                    <img id="mainImage" src="${mainImg}">
                    ${images.length > 1 ? `
                    <button class="slider-btn left"  onclick="prevImage(event)">❮</button>
                    <button class="slider-btn right" onclick="nextImage(event)">❯</button>
                    ` : ''}
                </div>
                ${thumbnailsHtml}

                <!-- INFOS -->
                <div class="card">
                    <div class="title">${annonce.titre}</div>
                    <div class="price">${Number(annonce.prix).toLocaleString()} FCFA</div>
                    <div class="meta">
                        <span><i class="fa-solid fa-location-dot"></i> ${annonce.ville?.nom ?? ''}</span>
                        <span>${new Date(annonce.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                </div>

                <!-- DETAILS -->
                <div class="card">
                    <strong>Détails</strong>
                    <div style="margin-top:10px;">${generateDetails(annonce)}</div>
                </div>
            </div>

            <!-- SIDEBAR -->
            <div class="sidebar">
                <div class="card">
                    <strong>Description</strong>
                    <p class="description">${annonce.description ?? 'Aucune description'}</p>
                </div>

                <div class="card">
                    <h3 style="margin-bottom:10px; font-size:16px;">Contacter le vendeur</h3>
                    ${annonce.telephone_visible && annonce.user?.telephone ? `
                    <button class="btn" onclick="window.location='tel:${annonce.user.telephone}'">
                        <i class="fa-solid fa-phone"></i> Appeler
                    </button>
                    <button class="btn whatsapp" onclick="window.open('https://wa.me/${annonce.user.telephone}')">
                        <i class="fa-brands fa-whatsapp"></i> WhatsApp
                    </button>
                    ` : ''}
                    <button class="btn" onclick="openMessage(${annonce.id})">
                        <i class="fa-solid fa-envelope"></i> Envoyer un message
                    </button>
                    <button class="btn" style="background:#eee; color:#555;" onclick="signaler(${annonce.id})">
                        <i class="fa-solid fa-flag"></i> Signaler
                    </button>
                </div>
            </div>
        </div>`;

        window._images = images;
        window._index  = 0;

    } catch(err){
        console.error(err);
        document.getElementById('annonceContainer').innerHTML = "<p style='padding:40px; color:red;'>Erreur chargement de l'annonce.</p>";
    }
}

function generateDetails(a){
    let html = '';
    if(a.categorie) html += `<div class="detail"><span>Catégorie</span><span>${a.categorie.nom}</span></div>`;
    if(a.type_offre) html += `<div class="detail"><span>Type</span><span>${a.type_offre}</span></div>`;
    if(a.surface)   html += `<div class="detail"><span>Surface</span><span>${a.surface} m²</span></div>`;
    if(a.nb_pieces) html += `<div class="detail"><span>Pièces</span><span>${a.nb_pieces}</span></div>`;
    if(a.nb_vues !== undefined) html += `<div class="detail"><span>Vues</span><span>${a.nb_vues}</span></div>`;
    return html || '<p style="color:#888; margin-top:8px;">Aucun détail disponible.</p>';
}

function goToImage(idx){
    window._index = idx;
    document.getElementById('mainImage').src = window._images[idx];
    document.querySelectorAll('#thumbs img').forEach((img,i) => img.classList.toggle('active', i===idx));
}
function nextImage(e){ e.preventDefault(); e.stopPropagation(); goToImage((window._index+1) % window._images.length); }
function prevImage(e){ e.preventDefault(); e.stopPropagation(); goToImage((window._index-1+window._images.length) % window._images.length); }

async function openMessage(id){
    let msg = prompt("Votre message au vendeur :");
    if(!msg) return;
    try {
        await apiFetch('/api/messages', { method:'POST', body: JSON.stringify({ annonce_id: id, contenu: msg }) });
        alert('Message envoyé !');
    } catch(e){ window.location.href = '/login'; }
}

async function signaler(id){
    let motif = prompt("Motif du signalement :");
    if(!motif) return;
    await apiFetch('/api/signalements', { method:'POST', body: JSON.stringify({ annonce_id: id, motif }) });
    alert('Signalement envoyé, merci.');
}

loadAnnonce();
</script>

@endsection
```

---

## 5. `pages/annonces/create.blade.php` — Publier une annonce

```html
@extends('layouts.app')
@section('title', 'Publier une annonce — Axioplace')
@section('content')

<style>

body::before{
    content:"";
    position:fixed; top:0; left:0;
    width:100%; height:220px;
    background:linear-gradient(135deg,#FFC533,#009543);
    z-index:-1;
    border-bottom-left-radius:40px;
    border-bottom-right-radius:40px;
}

/* ===== CONTAINER ===== */
.container{
    max-width:950px; margin:40px auto; background:white;
    padding:30px; border-radius:20px;
    box-shadow:0 20px 40px rgba(0,0,0,0.1);
}
.container h1{ text-align:center; margin-bottom:20px; font-size:26px; font-weight:700; }

/* ===== STEPS ===== */
.steps{ display:flex; justify-content:space-between; margin-bottom:30px; gap:10px; flex-wrap:wrap; }
.step{
    flex:1; text-align:center; padding:10px;
    color:#777; font-size:14px; cursor:pointer;
}
.step.active{
    color:#FFC533; font-weight:bold;
    border-bottom:3px solid #009543;
}

/* ===== FORM ===== */
label{ display:block; margin-top:15px; font-weight:600; font-size:14px; }
input, select, textarea{
    width:100%; padding:12px; margin-top:5px;
    border-radius:12px; border:1px solid #ddd; font-size:14px;
    transition:0.2s;
}
input:focus, select:focus, textarea:focus{
    border-color:#009543;
    box-shadow:0 0 0 2px rgba(0,149,67,0.2);
    outline:none;
}
textarea{ min-height:120px; resize:vertical; }

.row{ display:flex; gap:15px; flex-wrap:wrap; }
.row > div{ flex:1; min-width:200px; }

/* ===== OPTIONS PILLS ===== */
.options{ display:flex; gap:10px; margin-top:10px; flex-wrap:wrap; }
.option-pill{
    padding:10px 18px; border-radius:20px;
    border:2px solid #ddd; cursor:pointer;
    font-size:14px; transition:0.2s; background:white;
}
.option-pill.selected{ border-color:#FFC533; background:#FFF8E7; font-weight:600; }
.option-pill:hover{ border-color:#FFC533; }

/* ===== UPLOAD ===== */
.upload-box{
    border:2px dashed #ccc; border-radius:16px;
    padding:25px; text-align:center; cursor:pointer;
    background:#fafafa; transition:0.2s; margin-top:10px;
}
.upload-box:hover{ border-color:#009543; background:#f0fff4; }
.upload-box i{ font-size:30px; color:#009543; margin-bottom:10px; display:block; }
.upload-box p{ color:#666; font-size:14px; }

.preview{ display:flex; gap:10px; margin-top:10px; flex-wrap:wrap; }
.preview img{
    width:80px; height:80px; object-fit:cover;
    border-radius:10px; border:2px solid #eee;
}

/* ===== BUTTONS ===== */
.buttons{
    display:flex; justify-content:flex-end;
    gap:10px; margin-top:30px; flex-wrap:wrap;
}
.btn-next{
    background:#FFC533; color:#333; border:none;
    padding:12px 24px; border-radius:12px;
    font-weight:bold; cursor:pointer; transition:0.2s; font-size:15px;
}
.btn-next:hover{ background:#DC241F; color:white; }
.btn-cancel{
    background:#eee; border:none; padding:12px 24px;
    border-radius:12px; cursor:pointer; font-size:15px;
}

/* ===== STEP PANELS ===== */
.step-panel{ display:none; }
.step-panel.active{ display:block; }

/* ===== ALERT ===== */
.alert-success{
    background:#d4edda; color:#155724;
    padding:15px; border-radius:12px; margin-bottom:15px;
    display:none;
}

@media(max-width:768px){
    .container{ margin:20px 10px; padding:20px; }
    .steps{ gap:5px; }
    .step{ font-size:12px; padding:8px 5px; }
}

</style>

<div class="container">
    <h1>📢 Publier une annonce</h1>

    <!-- STEPS -->
    <div class="steps">
        <div class="step active" data-step="1">1. Informations</div>
        <div class="step" data-step="2">2. Localisation</div>
        <div class="step" data-step="3">3. Photos</div>
        <div class="step" data-step="4">4. Confirmation</div>
    </div>

    <div class="alert-success" id="alertSuccess">
        ✅ Annonce publiée avec succès ! En attente de validation par un administrateur.
    </div>

    <!-- STEP 1 : Infos -->
    <div class="step-panel active" id="panel-1">
        <label>Titre de l'annonce *</label>
        <input type="text" id="titre" placeholder="Ex: Appartement 3 pièces à louer à Brazzaville" maxlength="200">

        <label>Catégorie *</label>
        <select id="categorie_id" onchange="updateTypeOffre()">
            <option value="">Sélectionner une catégorie</option>
            @foreach($categories as $c)
                <option value="{{ $c->id }}" data-slug="{{ $c->slug }}">{{ $c->nom }}</option>
            @endforeach
        </select>

        <label>Type d'offre *</label>
        <div class="options" id="type-options">
            <div class="option-pill" onclick="selectType('location')">Location</div>
            <div class="option-pill" onclick="selectType('vente')">Vente</div>
            <div class="option-pill" onclick="selectType('colocation')">Colocation</div>
            <div class="option-pill" onclick="selectType('terrain')">Terrain</div>
        </div>
        <input type="hidden" id="type_offre" value="">

        <label>Prix (FCFA) *</label>
        <input type="number" id="prix" placeholder="Ex: 150000" min="0">

        <label>Description *</label>
        <textarea id="description" placeholder="Décrivez votre annonce en détail..."></textarea>

        <div class="row" id="immobilier-fields" style="display:none;">
            <div>
                <label>Surface (m²)</label>
                <input type="number" id="surface" placeholder="Ex: 65">
            </div>
            <div>
                <label>Nombre de pièces</label>
                <input type="number" id="nb_pieces" placeholder="Ex: 3">
            </div>
        </div>

        <div class="buttons">
            <button class="btn-cancel" onclick="window.history.back()">Annuler</button>
            <button class="btn-next" onclick="goStep(2)">Suivant →</button>
        </div>
    </div>

    <!-- STEP 2 : Localisation -->
    <div class="step-panel" id="panel-2">
        <label>Ville *</label>
        <select id="ville_id">
            <option value="">Sélectionner une ville</option>
            @foreach($villes as $v)
                <option value="{{ $v->id }}">{{ $v->nom }}</option>
            @endforeach
        </select>

        <label>Afficher mon numéro de téléphone</label>
        <div class="options">
            <div class="option-pill selected" onclick="selectTel(true, this)">Oui</div>
            <div class="option-pill" onclick="selectTel(false, this)">Non</div>
        </div>
        <input type="hidden" id="telephone_visible" value="1">

        <div class="buttons">
            <button class="btn-cancel" onclick="goStep(1)">← Retour</button>
            <button class="btn-next" onclick="goStep(3)">Suivant →</button>
        </div>
    </div>

    <!-- STEP 3 : Photos -->
    <div class="step-panel" id="panel-3">
        <label>Photos (1 à 10 images)</label>
        <div class="upload-box" onclick="document.getElementById('photoInput').click()">
            <i class="fa-solid fa-cloud-arrow-up"></i>
            <p>Cliquer pour ajouter des photos</p>
            <p style="font-size:12px; color:#999; margin-top:5px;">JPG, PNG — Max 5 Mo chacune</p>
        </div>
        <input type="file" id="photoInput" multiple accept="image/*" hidden onchange="previewPhotos(this)">
        <div class="preview" id="photoPreview"></div>

        <div class="buttons">
            <button class="btn-cancel" onclick="goStep(2)">← Retour</button>
            <button class="btn-next" onclick="goStep(4)">Suivant →</button>
        </div>
    </div>

    <!-- STEP 4 : Confirmation -->
    <div class="step-panel" id="panel-4">
        <div id="recap" style="background:#f9f9f9; padding:20px; border-radius:16px; margin-bottom:20px; line-height:2;">
            <!-- rempli dynamiquement -->
        </div>
        <div class="buttons">
            <button class="btn-cancel" onclick="goStep(3)">← Retour</button>
            <button class="btn-next" onclick="publier()">✅ Publier l'annonce</button>
        </div>
    </div>
</div>

<script>
let currentStep = 1;
let selectedType = '';
let selectedFiles = [];

function goStep(n){
    if(n > currentStep && !validateStep(currentStep)) return;
    document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.step').forEach((s,i) => s.classList.toggle('active', i+1 === n));
    document.getElementById('panel-' + n).classList.add('active');
    currentStep = n;
    if(n === 4) fillRecap();
}

function validateStep(n){
    if(n === 1){
        if(!document.getElementById('titre').value.trim()){ alert('Veuillez saisir un titre.'); return false; }
        if(!document.getElementById('categorie_id').value){ alert('Veuillez choisir une catégorie.'); return false; }
        if(!selectedType){ alert('Veuillez choisir un type d\'offre.'); return false; }
        if(!document.getElementById('prix').value){ alert('Veuillez saisir un prix.'); return false; }
        if(!document.getElementById('description').value.trim()){ alert('Veuillez saisir une description.'); return false; }
    }
    if(n === 2){
        if(!document.getElementById('ville_id').value){ alert('Veuillez choisir une ville.'); return false; }
    }
    return true;
}

function selectType(val){
    selectedType = val;
    document.getElementById('type_offre').value = val;
    document.querySelectorAll('#type-options .option-pill').forEach(p => p.classList.toggle('selected', p.textContent.toLowerCase() === val));
}

function selectTel(val, el){
    document.getElementById('telephone_visible').value = val ? '1' : '0';
    document.querySelectorAll('#panel-2 .options .option-pill').forEach(p => p.classList.remove('selected'));
    el.classList.add('selected');
}

function updateTypeOffre(){
    let slug = document.getElementById('categorie_id').selectedOptions[0]?.dataset.slug;
    document.getElementById('immobilier-fields').style.display = slug === 'immobilier' ? 'flex' : 'none';
}

function previewPhotos(input){
    selectedFiles = Array.from(input.files);
    let preview = document.getElementById('photoPreview');
    preview.innerHTML = '';
    selectedFiles.forEach(f => {
        let r = new FileReader();
        r.onload = e => {
            let img = document.createElement('img');
            img.src = e.target.result;
            preview.appendChild(img);
        };
        r.readAsDataURL(f);
    });
}

function fillRecap(){
    let cat = document.getElementById('categorie_id').selectedOptions[0]?.text ?? '';
    let ville = document.getElementById('ville_id').selectedOptions[0]?.text ?? '';
    document.getElementById('recap').innerHTML = `
        <strong>Titre :</strong> ${document.getElementById('titre').value}<br>
        <strong>Catégorie :</strong> ${cat}<br>
        <strong>Type :</strong> ${selectedType}<br>
        <strong>Prix :</strong> ${Number(document.getElementById('prix').value).toLocaleString()} FCFA<br>
        <strong>Ville :</strong> ${ville}<br>
        <strong>Photos :</strong> ${selectedFiles.length} photo(s)<br>
        <strong>Afficher téléphone :</strong> ${document.getElementById('telephone_visible').value === '1' ? 'Oui' : 'Non'}
    `;
}

async function publier(){
    let formData = new FormData();
    formData.append('titre',       document.getElementById('titre').value);
    formData.append('categorie_id',document.getElementById('categorie_id').value);
    formData.append('ville_id',    document.getElementById('ville_id').value);
    formData.append('type_offre',  selectedType);
    formData.append('prix',        document.getElementById('prix').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('telephone_visible', document.getElementById('telephone_visible').value);
    if(document.getElementById('surface').value)   formData.append('surface',   document.getElementById('surface').value);
    if(document.getElementById('nb_pieces').value) formData.append('nb_pieces', document.getElementById('nb_pieces').value);
    selectedFiles.forEach(f => formData.append('photos[]', f));

    try {
        const token = localStorage.getItem('sanctum_token');
        let res = await fetch(window.baseUrl + '/api/annonces', {
            method:'POST',
            headers: { 'Accept':'application/json', 'Authorization':'Bearer '+token },
            body: formData
        });
        let data = await res.json();
        if(res.ok){
            document.getElementById('alertSuccess').style.display = 'block';
            setTimeout(() => window.location.href = '/annonces', 2500);
        } else {
            alert(data.message || 'Erreur lors de la publication.');
        }
    } catch(e){ alert('Erreur réseau. Veuillez réessayer.'); }
}
</script>

@endsection
```

---

## 6. `pages/favoris/index.blade.php` — Mes favoris

```html
@extends('layouts.app')
@section('title', 'Mes favoris — Axioplace')
@section('content')

<style>

.page{ max-width:1200px; margin:auto; padding:30px 20px; }
.page-header{ margin-bottom:25px; }
.page-header h1{ font-size:26px; font-weight:700; }
.page-header p{ color:#666; margin-top:5px; }

/* ===== GRID ===== */
.grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }

/* ===== CARD ===== */
.card{
    background:white; border-radius:16px; overflow:hidden;
    box-shadow:0 8px 25px rgba(0,0,0,0.06);
    position:relative; transition:0.3s; cursor:pointer;
}
.card:hover{ transform:translateY(-5px); box-shadow:0 15px 30px rgba(0,0,0,0.1); }

/* ===== SLIDER ===== */
.card-slider{ position:relative; }
.card-slider img{ width:100%; height:200px; object-fit:cover; display:block; transition:opacity 0.3s; }

.slider-btn{
    position:absolute; top:50%; transform:translateY(-50%);
    background:rgba(0,0,0,0.4); color:white; border:none;
    border-radius:50%; width:30px; height:30px; cursor:pointer; z-index:10;
}
.slider-btn.left{ left:10px; }
.slider-btn.right{ right:10px; }

/* ===== FAVORITE BTN ===== */
.favorite{
    position:absolute; top:10px; right:10px;
    background:white; width:36px; height:36px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.1); z-index:20;
}
.favorite.active i{ color:red; }

/* ===== PRICE BADGE ===== */
.price-badge{
    position:absolute; bottom:10px; left:10px;
    background:white; padding:6px 10px; border-radius:8px;
    font-weight:700; color:#009543; font-size:13px;
}

/* ===== CONTENT ===== */
.content{ padding:14px; }
.title{ font-weight:600; font-size:15px; margin-bottom:4px; }
.meta{ font-size:12px; color:#777; }

/* ===== EMPTY ===== */
.empty-state{
    text-align:center; padding:80px 20px; color:#888;
}
.empty-state i{ font-size:48px; color:#ddd; margin-bottom:15px; display:block; }
.empty-state h3{ font-size:20px; margin-bottom:8px; color:#555; }
.empty-state a{
    display:inline-block; margin-top:15px;
    background:#FFC533; color:#333; padding:12px 24px;
    border-radius:12px; font-weight:600; text-decoration:none;
}

@media(max-width:900px){ .grid{ grid-template-columns:1fr; } }

</style>

<div class="page">
    <div class="page-header">
        <h1>❤️ Mes favoris</h1>
        <p>Vos annonces sauvegardées</p>
    </div>

    <div class="grid" id="favorites-container">
        <div style="text-align:center; padding:40px; color:#888; grid-column:1/-1;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size:24px;"></i>
        </div>
    </div>
</div>

<script>
loadFavorites();

async function loadFavorites(){
    try {
        let data = await apiFetch('/api/favoris');
        let container = document.getElementById('favorites-container');
        container.innerHTML = '';

        if(!data.length){
            container.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;">
                <i class="fa-regular fa-heart"></i>
                <h3>Aucun favori pour le moment</h3>
                <p>Explorez les annonces et ajoutez-en à vos favoris</p>
                <a href="/annonces">Parcourir les annonces</a>
            </div>`;
            return;
        }

        data.forEach(a => {
            let images = a.photos?.map(p => '/storage/' + p.chemin) || [];
            let image  = images[0] ?? '/images/placeholder.jpg';

            container.innerHTML += `
            <div class="card" onclick="window.location='/annonces/${a.id}'">
                <div class="favorite active" onclick="toggleFav(event,this,${a.id})">
                    <i class="fa-solid fa-heart" style="color:red;"></i>
                </div>
                <div class="card-slider">
                    <img class="slider-image"
                         data-images='${JSON.stringify(images)}'
                         data-index="0"
                         src="${image}" loading="lazy">
                    ${images.length > 1 ? `
                    <button class="slider-btn left"  onclick="prevSlide(event,this)">❮</button>
                    <button class="slider-btn right" onclick="nextSlide(event,this)">❯</button>
                    ` : ''}
                    <div class="price-badge">${Number(a.prix).toLocaleString()} FCFA</div>
                </div>
                <div class="content">
                    <div class="title">${a.titre}</div>
                    <div class="meta"><i class="fa-solid fa-location-dot"></i> ${a.ville?.nom ?? ''}</div>
                </div>
            </div>`;
        });
    } catch(err){
        console.error(err);
        document.getElementById('favorites-container').innerHTML = "<p style='padding:40px; color:red;'>Erreur chargement.</p>";
    }
}

async function toggleFav(e, el, id){
    e.preventDefault(); e.stopPropagation();
    try {
        await apiFetch('/api/favoris/' + id, { method:'POST' });
        el.closest('.card').style.transition = 'opacity 0.3s';
        el.closest('.card').style.opacity = '0';
        setTimeout(() => {
            el.closest('.card').remove();
            if(!document.querySelectorAll('.card').length){
                document.getElementById('favorites-container').innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <i class="fa-regular fa-heart"></i>
                    <h3>Aucun favori pour le moment</h3>
                    <a href="/annonces">Parcourir les annonces</a>
                </div>`;
            }
        }, 300);
    } catch(err){ window.location.href = '/login'; }
}

function nextSlide(e, btn){ e.preventDefault(); e.stopPropagation(); slideImg(btn, 1); }
function prevSlide(e, btn){ e.preventDefault(); e.stopPropagation(); slideImg(btn, -1); }
function slideImg(btn, dir){
    let img   = btn.closest('.card-slider').querySelector('.slider-image');
    let imgs  = JSON.parse(img.dataset.images || '[]');
    if(!imgs.length) return;
    let idx = (parseInt(img.dataset.index||0) + dir + imgs.length) % imgs.length;
    img.dataset.index = idx;
    img.style.opacity = '0';
    setTimeout(() => { img.src = imgs[idx]; img.style.opacity = '1'; }, 150);
}
</script>

@endsection
```

---

## 7. `profil/index.blade.php` — Profil utilisateur

```html
@extends('layouts.app')
@section('title', 'Mon profil — Axioplace')
@section('content')

<style>

.profile-page{ max-width:1100px; margin:auto; padding:20px; font-family:'Inter',sans-serif; }

/* ===== HEADER ===== */
.profile-header{
    position:relative;
    background:linear-gradient(135deg,#FFC533,#009543);
    padding:30px 20px; border-radius:20px; color:white; text-align:center; overflow:hidden;
}
.profile-header::after{
    content:""; position:absolute; top:0; left:0;
    width:100%; height:100%; background:rgba(0,0,0,0.1);
}

/* ===== AVATAR ===== */
.avatar-wrapper{ position:relative; width:110px; margin:0 auto 15px; z-index:1; }
.avatar{
    width:110px; height:110px; border-radius:50%;
    border:4px solid white; object-fit:cover; transition:0.3s;
}
.edit-avatar{
    position:absolute; bottom:0; right:0;
    background:#FFC533; padding:8px; border-radius:50%;
    cursor:pointer; transition:0.3s; z-index:10;
}
.edit-avatar:hover{ transform:scale(1.1); }
.profile-header h2{ margin:10px 0 5px; position:relative; z-index:1; }
.profile-header p{ position:relative; z-index:1; opacity:0.9; font-size:14px; }

/* ===== STATS ===== */
.stats{ display:flex; justify-content:center; gap:15px; margin-top:10px; flex-wrap:wrap; position:relative; z-index:1; }
.stat{
    background:rgba(255,255,255,0.2); padding:8px 12px;
    border-radius:10px; font-size:13px;
}

/* ===== TABS ===== */
.profile-tabs{ display:flex; flex-wrap:wrap; gap:10px; margin-top:20px; }
.tab{
    flex:1; padding:12px; border:none; border-radius:12px;
    background:white; cursor:pointer; font-weight:600; transition:0.3s;
    box-shadow:0 4px 12px rgba(0,0,0,0.05);
}
.tab:hover{ transform:translateY(-2px); }
.tab.active{ background:#FFC533; }

/* ===== TAB CONTENT ===== */
.tab-content{ display:none; margin-top:20px; animation:fade 0.3s ease; }
.tab-content.active{ display:block; }
@keyframes fade{ from{ opacity:0; transform:translateY(10px); } to{ opacity:1; transform:translateY(0); } }

/* ===== CARD ===== */
.card{
    background:white; padding:20px; border-radius:16px;
    box-shadow:0 10px 30px rgba(0,0,0,0.05); margin-top:15px; transition:0.3s;
}
.card h3{ font-size:16px; font-weight:600; margin-bottom:15px; }
.card:hover{ transform:translateY(-3px); }

/* ===== INPUT ===== */
.card input, .card select, .card textarea{
    width:100%; padding:12px; border-radius:10px;
    border:1px solid #ddd; margin-bottom:10px; font-size:14px;
}
.card input:focus, .card select:focus{
    border-color:#FFC533; outline:none;
    box-shadow:0 0 0 2px rgba(255,197,51,0.2);
}

/* ===== BUTTON ===== */
.btn-save{
    background:#FFC533; border:none; padding:12px;
    border-radius:12px; font-weight:600; cursor:pointer;
    transition:0.3s; width:100%; font-size:15px;
}
.btn-save:hover{ background:#009543; color:white; }

/* ===== SCROLLABLE ===== */
.scrollable{ max-height:450px; overflow-y:auto; }

/* ===== ANNONCE LINE ===== */
.annonce-line{
    display:flex; align-items:center; gap:15px;
    padding:15px; border-bottom:1px solid #eee;
    border-radius:12px; transition:0.3s; background:white;
    cursor:pointer;
}
.annonce-line:hover{ box-shadow:0 10px 25px rgba(0,0,0,0.08); }

.annonce-img img{
    width:110px; height:80px; object-fit:cover; border-radius:10px; display:block;
}
.annonce-body{ flex:1; }
.annonce-body h3{ margin:0 0 4px; font-size:15px; }
.annonce-body .price{ color:#009543; font-weight:bold; font-size:14px; }
.annonce-body .meta{ font-size:12px; color:#888; margin-top:3px; }

/* ===== STATUS BADGE ===== */
.status-badge{
    display:inline-block; padding:3px 8px; border-radius:6px;
    font-size:11px; font-weight:600; margin-top:4px;
}
.status-validee{ background:#d4edda; color:#155724; }
.status-en_attente{ background:#fff3cd; color:#856404; }
.status-suspendue{ background:#f8d7da; color:#721c24; }

/* ===== ACTIONS ===== */
.annonce-actions{ display:flex; gap:8px; flex-shrink:0; }
.btn-action{
    padding:8px 14px; border-radius:8px;
    border:none; cursor:pointer; font-size:13px; font-weight:600;
}
.btn-edit{ background:#f0f9ff; color:#0066cc; }
.btn-delete{ background:#DC241F; color:white; }

/* ===== RESPONSIVE ===== */
@media(max-width:768px){
    .profile-header{ padding:20px; }
    .avatar{ width:90px; height:90px; }
    .avatar-wrapper{ width:90px; }
    .profile-tabs{ flex-direction:column; }
    .annonce-line{ flex-direction:column; align-items:flex-start; }
    .annonce-img img{ width:100%; height:160px; }
    .annonce-actions{ width:100%; }
    .btn-action{ flex:1; text-align:center; }
}

</style>

<div class="profile-page">

    <!-- HEADER -->
    <div class="profile-header">
        <div class="avatar-wrapper">
            <img id="previewAvatar"
                 src="{{ Auth::user()->photo_profil ? asset('storage/'.Auth::user()->photo_profil) : 'https://ui-avatars.com/api/?name='.urlencode(Auth::user()->nom).'&background=FFC533&color=fff&size=110' }}"
                 class="avatar">
            <input type="file" id="photoInput" hidden accept="image/*">
            <div class="edit-avatar" id="btnCamera">
                <i class="fa-solid fa-camera" style="color:white;"></i>
            </div>
        </div>

        <h2>{{ Auth::user()->nom }}</h2>
        <p>{{ Auth::user()->email }}</p>

        <div class="stats">
            <div class="stat"><i class="fa-solid fa-box"></i> <span id="stat-annonces">0</span> annonces</div>
            <div class="stat"><i class="fa-solid fa-heart"></i> <span id="stat-favoris">0</span> favoris</div>
            <div class="stat"><i class="fa-solid fa-eye"></i> <span id="stat-vues">0</span> vues totales</div>
        </div>
    </div>

    <!-- TABS -->
    <div class="profile-tabs">
        <button class="tab active" data-tab="infos"><i class="fa-solid fa-user"></i> Profil</button>
        <button class="tab" data-tab="annonces"><i class="fa-solid fa-box"></i> Mes annonces</button>
        <button class="tab" data-tab="favoris"><i class="fa-solid fa-heart"></i> Favoris</button>
        <button class="tab" data-tab="security"><i class="fa-solid fa-lock"></i> Sécurité</button>
    </div>

    <!-- TAB : INFOS -->
    <div class="tab-content active" id="infos">
        <div class="card">
            <h3><i class="fa-solid fa-id-card"></i> Informations personnelles</h3>
            <form id="infoForm">
                <input type="text"  id="edit-nom"   value="{{ Auth::user()->nom }}"   placeholder="Nom complet">
                <input type="email" id="edit-email" value="{{ Auth::user()->email }}" placeholder="Email">
                <input type="tel"   id="edit-tel"   value="{{ Auth::user()->telephone ?? '' }}" placeholder="Téléphone">
                <button type="button" class="btn-save" onclick="updateProfil()">
                    <i class="fa-solid fa-floppy-disk"></i> Mettre à jour
                </button>
            </form>
        </div>
    </div>

    <!-- TAB : ANNONCES -->
    <div class="tab-content" id="annonces">
        <div class="card scrollable" id="annonces-container">
            <div style="text-align:center; padding:30px; color:#888;">
                <i class="fa-solid fa-spinner fa-spin"></i> Chargement...
            </div>
        </div>
    </div>

    <!-- TAB : FAVORIS -->
    <div class="tab-content" id="favoris">
        <div class="card scrollable" id="favoris-container">
            <div style="text-align:center; padding:30px; color:#888;">
                <i class="fa-solid fa-spinner fa-spin"></i> Chargement...
            </div>
        </div>
    </div>

    <!-- TAB : SECURITE -->
    <div class="tab-content" id="security">
        <div class="card">
            <h3><i class="fa-solid fa-shield-halved"></i> Modifier le mot de passe</h3>
            <input type="password" id="current_password" placeholder="Mot de passe actuel">
            <input type="password" id="new_password"     placeholder="Nouveau mot de passe">
            <input type="password" id="confirm_password" placeholder="Confirmer le nouveau mot de passe">
            <button class="btn-save" onclick="changePassword()">
                <i class="fa-solid fa-lock"></i> Modifier le mot de passe
            </button>
        </div>
    </div>

</div>

<script>
// ===== TABS =====
document.querySelectorAll('.tab').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    };
});

// ===== LOAD PROFIL =====
loadProfil();

async function loadProfil(){
    try {
        // Annonces
        let annonces = await apiFetch('/api/annonces/user');
        document.getElementById('stat-annonces').innerText = annonces.length;

        let totalVues = annonces.reduce((s, a) => s + (a.nb_vues||0), 0);
        document.getElementById('stat-vues').innerText = totalVues;

        let ac = document.getElementById('annonces-container');
        ac.innerHTML = !annonces.length ? '<p style="text-align:center; color:#888; padding:20px;">Aucune annonce publiée.</p>' : '';

        annonces.forEach(a => {
            let image  = a.photos?.[0]?.chemin ? '/storage/' + a.photos[0].chemin : 'https://via.placeholder.com/110x80?text=Photo';
            let status = `<span class="status-badge status-${a.statut}">${a.statut.replace('_',' ')}</span>`;
            ac.innerHTML += `
            <div class="annonce-line" onclick="window.location='/annonces/${a.id}'">
                <div class="annonce-img"><img src="${image}" loading="lazy"></div>
                <div class="annonce-body">
                    <h3>${a.titre}</h3>
                    <p class="price">${Number(a.prix).toLocaleString()} FCFA</p>
                    <p class="meta">${a.ville?.nom ?? ''} · ${new Date(a.created_at).toLocaleDateString('fr-FR')}</p>
                    ${status}
                </div>
                <div class="annonce-actions">
                    <button class="btn-action btn-edit" onclick="event.stopPropagation(); window.location='/annonces/${a.id}/edit'">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="event.stopPropagation(); deleteAnnonce(${a.id}, this)">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>`;
        });

        // Favoris
        let favoris = await apiFetch('/api/favoris');
        document.getElementById('stat-favoris').innerText = favoris.length;

        let fc = document.getElementById('favoris-container');
        fc.innerHTML = !favoris.length ? '<p style="text-align:center; color:#888; padding:20px;">Aucun favori.</p>' : '';

        favoris.forEach(a => {
            let image = a.photos?.[0]?.chemin ? '/storage/' + a.photos[0].chemin : 'https://via.placeholder.com/110x80?text=Photo';
            fc.innerHTML += `
            <div class="annonce-line" onclick="window.location='/annonces/${a.id}'">
                <div class="annonce-img"><img src="${image}" loading="lazy"></div>
                <div class="annonce-body">
                    <h3>${a.titre}</h3>
                    <p class="price">${Number(a.prix).toLocaleString()} FCFA</p>
                    <p class="meta">${a.ville?.nom ?? ''}</p>
                </div>
            </div>`;
        });

    } catch(err){ console.error(err); }
}

// ===== DELETE =====
async function deleteAnnonce(id, btn){
    if(!confirm('Supprimer cette annonce définitivement ?')) return;
    await apiFetch('/api/annonces/' + id, { method:'DELETE' });
    btn.closest('.annonce-line').remove();
}

// ===== UPDATE PROFIL =====
async function updateProfil(){
    try {
        await apiFetch('/api/auth/me', {
            method:'PUT',
            body: JSON.stringify({
                nom:       document.getElementById('edit-nom').value,
                email:     document.getElementById('edit-email').value,
                telephone: document.getElementById('edit-tel').value,
            })
        });
        alert('Profil mis à jour !');
    } catch(e){ alert('Erreur mise à jour.'); }
}

// ===== CHANGE PASSWORD =====
async function changePassword(){
    let pwd  = document.getElementById('new_password').value;
    let conf = document.getElementById('confirm_password').value;
    if(pwd !== conf){ alert('Les mots de passe ne correspondent pas.'); return; }
    try {
        await apiFetch('/api/auth/password', {
            method:'PUT',
            body: JSON.stringify({
                current_password:      document.getElementById('current_password').value,
                password:              pwd,
                password_confirmation: conf,
            })
        });
        alert('Mot de passe modifié !');
    } catch(e){ alert('Erreur modification mot de passe.'); }
}

// ===== PHOTO AVATAR =====
document.getElementById('btnCamera').onclick = () => document.getElementById('photoInput').click();
document.getElementById('photoInput').onchange = async function(){
    let file = this.files[0];
    if(!file) return;
    let reader = new FileReader();
    reader.onload = e => document.getElementById('previewAvatar').src = e.target.result;
    reader.readAsDataURL(file);

    let fd = new FormData();
    fd.append('photo', file);
    const token = localStorage.getItem('sanctum_token');
    let res  = await fetch(window.baseUrl + '/api/profile/photo', {
        method:'POST',
        headers:{ 'Authorization':'Bearer '+token },
        body: fd
    });
    let data = await res.json();
    if(data.url) document.getElementById('previewAvatar').src = data.url;
};
</script>

@endsection
```

---

## 8. `auth/login.blade.php` — Connexion

```html
@extends('layouts.app')
@section('title', 'Connexion — Axioplace')
@section('content')

<div class="auth-page">
    <div class="auth-overlay"></div>
    <div class="auth-card">

        <h2>👋 Connexion</h2>
        <p class="auth-subtitle">Accédez à votre espace Axioplace</p>

        @if(session('status'))
            <div style="background:#d4edda; color:#155724; padding:10px; border-radius:8px; margin-bottom:15px;">
                {{ session('status') }}
            </div>
        @endif

        <div class="input-group">
            <label>Adresse e-mail</label>
            <input type="email" id="email" placeholder="votre@email.com">
        </div>
        <div class="input-group">
            <label>Mot de passe</label>
            <input type="password" id="password" placeholder="••••••••">
        </div>

        <div style="text-align:right; margin-bottom:15px;">
            <a href="{{ route('password.request') }}" class="forgot-link">Mot de passe oublié ?</a>
        </div>

        <div id="error-msg" style="background:#f8d7da; color:#721c24; padding:10px; border-radius:8px; margin-bottom:15px; display:none;"></div>

        <button class="btn-auth" onclick="doLogin()">Se connecter</button>

        <div class="auth-footer">
            Pas encore de compte ? <a href="{{ route('register') }}">Créer un compte</a>
        </div>

    </div>
</div>

<script>
async function doLogin(){
    let email    = document.getElementById('email').value;
    let password = document.getElementById('password').value;
    let errBox   = document.getElementById('error-msg');
    errBox.style.display = 'none';

    if(!email || !password){ errBox.innerText = 'Veuillez remplir tous les champs.'; errBox.style.display='block'; return; }

    try {
        let data = await apiFetch('/api/auth/login', {
            method:'POST',
            body: JSON.stringify({ email, password })
        });
        localStorage.setItem('sanctum_token', data.token);
        window.location.href = '/';
    } catch(err){
        errBox.innerText = 'Identifiants incorrects. Veuillez réessayer.';
        errBox.style.display = 'block';
    }
}

document.getElementById('password').addEventListener('keypress', e => { if(e.key==='Enter') doLogin(); });
</script>

@endsection
```

---

## 9. `auth/register.blade.php` — Inscription

```html
@extends('layouts.app')
@section('title', 'Inscription — Axioplace')
@section('content')

<div class="auth-page">
    <div class="auth-overlay"></div>
    <div class="auth-card">

        <h2>🚀 Créer un compte</h2>
        <p class="auth-subtitle">Rejoignez Axioplace gratuitement</p>

        <div id="error-msg" style="background:#f8d7da; color:#721c24; padding:10px; border-radius:8px; margin-bottom:15px; display:none;"></div>

        <div class="input-group">
            <label>Nom complet</label>
            <input type="text" id="nom" placeholder="Jean Makoumbou">
        </div>
        <div class="input-group">
            <label>Adresse e-mail</label>
            <input type="email" id="email" placeholder="votre@email.com">
        </div>
        <div class="input-group">
            <label>Téléphone</label>
            <input type="tel" id="telephone" placeholder="+242 06 000 00 00">
        </div>
        <div class="input-group">
            <label>Mot de passe</label>
            <input type="password" id="password" placeholder="Minimum 8 caractères">
        </div>
        <div class="input-group">
            <label>Confirmer le mot de passe</label>
            <input type="password" id="password_confirmation" placeholder="••••••••">
        </div>

        <button class="btn-auth" onclick="doRegister()">Créer mon compte</button>

        <div class="auth-footer">
            Déjà un compte ? <a href="{{ route('login') }}">Se connecter</a>
        </div>

    </div>
</div>

<script>
async function doRegister(){
    let nom       = document.getElementById('nom').value;
    let email     = document.getElementById('email').value;
    let telephone = document.getElementById('telephone').value;
    let password  = document.getElementById('password').value;
    let password_confirmation = document.getElementById('password_confirmation').value;
    let errBox = document.getElementById('error-msg');
    errBox.style.display = 'none';

    if(!nom || !email || !password){ errBox.innerText='Veuillez remplir tous les champs obligatoires.'; errBox.style.display='block'; return; }
    if(password !== password_confirmation){ errBox.innerText='Les mots de passe ne correspondent pas.'; errBox.style.display='block'; return; }
    if(password.length < 8){ errBox.innerText='Le mot de passe doit contenir au moins 8 caractères.'; errBox.style.display='block'; return; }

    try {
        let data = await apiFetch('/api/auth/register', {
            method:'POST',
            body: JSON.stringify({ nom, email, telephone, password, password_confirmation })
        });
        localStorage.setItem('sanctum_token', data.token);
        window.location.href = '/';
    } catch(err){
        errBox.innerText = 'Erreur lors de l\'inscription. Cet email est peut-être déjà utilisé.';
        errBox.style.display = 'block';
    }
}
</script>

@endsection
```

---

## Récapitulatif des fichiers et leur emplacement

```
resources/views/
├── layouts/
│   └── app.blade.php              ← Layout principal (navbar + footer + JS global)
├── pages/
│   ├── home.blade.php             ← Page d'accueil (hero + catégories + slider)
│   └── annonces/
│       ├── index.blade.php        ← Liste des annonces (filtres + grid)
│       ├── show.blade.php         ← Détail d'une annonce (slider + sidebar)
│       └── create.blade.php       ← Formulaire multi-étapes publication
├── pages/favoris/
│   └── index.blade.php            ← Mes favoris (grid + toggle)
├── profil/
│   └── index.blade.php            ← Profil utilisateur (tabs + annonces + sécurité)
└── auth/
    ├── login.blade.php            ← Page de connexion
    └── register.blade.php         ← Page d'inscription
```

---

*Axioplace v1.0 — Design System intégré — Orman Boudimbou — Scholia Institut 2026*  
*Couleurs : `#FFC533` · `#009543` · `#DC241F` — Police : Inter*