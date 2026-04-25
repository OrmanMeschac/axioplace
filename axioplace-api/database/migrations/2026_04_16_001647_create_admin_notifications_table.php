<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('titre');
            $table->text('corps');
            $table->enum('type', ['info', 'warning', 'alert', 'update'])->default('info');
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('target_user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->boolean('lu')->default(false);
            $table->timestamps();

            $table->index(['target_user_id', 'lu']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_notifications');
    }
};
