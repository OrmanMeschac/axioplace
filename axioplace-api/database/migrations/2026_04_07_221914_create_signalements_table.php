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
        Schema::create('signalements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('signaleur_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('annonce_id')->nullable()->constrained('annonces')->onDelete('cascade');
            $table->foreignId('user_signale_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->string('motif', 300);
            $table->enum('statut', ['en_attente', 'traite', 'rejete'])->default('en_attente');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('signalements');
    }
};
