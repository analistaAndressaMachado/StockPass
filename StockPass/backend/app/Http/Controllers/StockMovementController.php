<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StockMovementController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            StockMovement::with(['product:id,name,code,quantity', 'user:id,name,role'])
                ->latest('occurred_at')->paginate(20)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'user_id' => ['required', 'exists:users,id'],
            'type' => ['required', Rule::in(['entrada', 'saida', 'ajuste'])],
            'quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $result = DB::transaction(function () use ($data) {
            $product = Product::lockForUpdate()->findOrFail($data['product_id']);
            $before = $product->quantity;

            if ($data['type'] === 'entrada') {
                $product->quantity += $data['quantity'];
            } elseif ($data['type'] === 'saida') {
                if ($data['quantity'] > $product->quantity) {
                    abort(422, 'Quantidade de saída maior que o estoque disponível.');
                }
                $product->quantity -= $data['quantity'];
            } else {
                $product->quantity = $data['quantity'];
            }

            $product->save();
            $movement = StockMovement::create($data);

            if ($product->quantity <= $product->minimum_stock) {
                Alert::updateOrCreate(
                    ['product_id' => $product->id, 'type' => 'estoque_minimo', 'status' => 'ativo'],
                    ['message' => "Estoque baixo: {$product->name} possui {$product->quantity} item(ns)."]
                );
            } else {
                Alert::where('product_id', $product->id)
                    ->where('type', 'estoque_minimo')
                    ->where('status', 'ativo')
                    ->update(['status' => 'resolvido']);
            }

            return [
                'movimento' => $movement->load(['product:id,name,code,quantity', 'user:id,name,role']),
                'quantidade_anterior' => $before,
                'quantidade_atual' => $product->quantity,
            ];
        });

        return response()->json(['message' => 'Movimentação registrada com sucesso.', 'data' => $result], 201);
    }

    public function show(StockMovement $movement): JsonResponse
    {
        return response()->json(['data' => $movement->load(['product', 'user'])]);
    }
}
