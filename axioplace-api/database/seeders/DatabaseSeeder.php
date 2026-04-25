<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Catégories
        foreach (['Immobilier', 'Véhicules', 'Services', 'Emploi'] as $nom) {
            \App\Models\Categorie::create([
                'nom'  => $nom,
                'slug' => \Illuminate\Support\Str::slug($nom),
            ]);
        }

        // Villes du Congo
        $villes = ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi', 'Impfondo', 'Ouesso', 'Madingou'];
        foreach ($villes as $nom) {
            \App\Models\Ville::create([
                'nom'  => $nom,
                'slug' => \Illuminate\Support\Str::slug($nom),
            ]);
        }

        // Admin
        \App\Models\User::create([
            'nom'      => 'Administrateur',
            'email'    => 'admin@axioplace.cg',
            'password' => \Illuminate\Support\Facades\Hash::make('Admin@2026!'),
            'role'     => 'admin',
        ]);
    }
}
