<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class HelloWorldController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'message' => 'Hello World',
            'system' => 'StockPass',
            'status' => 'API funcionando',
        ]);
    }
}
