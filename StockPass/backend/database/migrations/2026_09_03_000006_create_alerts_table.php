<?php
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema;
return new class extends Migration { public function up(): void {Schema::create('alerts',function(Blueprint $table){$table->id();$table->foreignId('product_id')->constrained()->cascadeOnDelete();$table->enum('type',['estoque_minimo','vencimento','falta']);$table->string('message',255);$table->enum('status',['ativo','resolvido'])->default('ativo');$table->timestamp('created_at')->useCurrent();});} public function down(): void {Schema::dropIfExists('alerts');}};
