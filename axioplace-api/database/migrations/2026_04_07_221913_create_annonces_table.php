<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
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
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('annonces');
    }
};
