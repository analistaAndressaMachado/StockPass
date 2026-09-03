<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json([
    'system' => 'StockPass',
    'message' => 'API REST funcionando',
]));
