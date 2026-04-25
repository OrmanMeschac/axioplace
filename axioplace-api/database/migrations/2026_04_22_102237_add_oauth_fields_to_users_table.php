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
        Schema::table('users', function (Blueprint $table) {
            // Provider OAuth (google, facebook)
            $table->string('oauth_provider')->nullable()->after('email');
            // ID unique du compte chez le provider
            $table->string('oauth_id')->nullable()->after('oauth_provider');
            // Le mot de passe devient nullable pour les comptes OAuth
            $table->string('password')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['oauth_provider', 'oauth_id']);
            $table->string('password')->nullable(false)->change();
        });
    }
};
