<?php

use App\Http\Controllers\AlertController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HelloWorldController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/hello-world', [HelloWorldController::class, 'index']);
Route::get('/dashboard', [DashboardController::class, 'index']);

Route::apiResource('categories', CategoryController::class);
Route::apiResource('suppliers', SupplierController::class);
Route::apiResource('products', ProductController::class);
Route::apiResource('users', UserController::class)->except(['show']);
Route::apiResource('movements', StockMovementController::class)->only(['index', 'store', 'show']);
Route::apiResource('alerts', AlertController::class)->only(['index', 'show', 'update']);

Route::get('/products/search/{term}', [ProductController::class, 'search']);
