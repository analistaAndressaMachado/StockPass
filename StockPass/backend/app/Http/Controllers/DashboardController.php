<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => [
                'total_produtos' => Product::count(),
                'total_itens' => (int) Product::sum('quantity'),
                'produtos_estoque_baixo' => Product::whereColumn('quantity', '<=', 'minimum_stock')->count(),
                'alertas_ativos' => Alert::where('status', 'ativo')->count(),
                'movimentacoes' => StockMovement::count(),
            ],
        ]);
    }
}
