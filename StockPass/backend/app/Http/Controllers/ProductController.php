<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Product::with(['category:id,name', 'supplier:id,name'])
                ->orderBy('name')->paginate(15)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:60', 'unique:products,code'],
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'quantity' => ['required', 'integer', 'min:0'],
            'minimum_stock' => ['required', 'integer', 'min:0'],
            'expiration_date' => ['nullable', 'date'],
            'category_id' => ['required', 'exists:categories,id'],
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('products', 'public');
        }

        $product = Product::create($data);
        $this->updateAlert($product);

        return response()->json([
            'message' => 'Produto cadastrado com sucesso.',
            'data' => $product->load(['category:id,name', 'supplier:id,name']),
        ], 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json(['data' => $product->load(['category', 'supplier', 'alerts'])]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:60', Rule::unique('products', 'code')->ignore($product->id)],
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'quantity' => ['required', 'integer', 'min:0'],
            'minimum_stock' => ['required', 'integer', 'min:0'],
            'expiration_date' => ['nullable', 'date'],
            'category_id' => ['required', 'exists:categories,id'],
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        if ($request->hasFile('photo')) {
            if ($product->photo) Storage::disk('public')->delete($product->photo);
            $data['photo'] = $request->file('photo')->store('products', 'public');
        }

        $product->update($data);
        $product = $product->fresh();
        $this->updateAlert($product);

        return response()->json(['message' => 'Produto atualizado com sucesso.', 'data' => $product]);
    }

    public function destroy(Product $product): JsonResponse
    {
        if ($product->stockMovements()->exists()) {
            return response()->json(['message' => 'Produto possui movimentações e não pode ser excluído.'], 422);
        }

        if ($product->photo) Storage::disk('public')->delete($product->photo);
        $product->alerts()->delete();
        $product->delete();

        return response()->json(['message' => 'Produto excluído com sucesso.']);
    }

    public function search(string $term): JsonResponse
    {
        $data = Product::with(['category:id,name', 'supplier:id,name'])
            ->where('name', 'like', "%{$term}%")
            ->orWhere('code', 'like', "%{$term}%")
            ->orderBy('name')->get();

        return response()->json(['data' => $data]);
    }

    private function updateAlert(Product $product): void
    {
        $active = Alert::where('product_id', $product->id)
            ->where('type', 'estoque_minimo')
            ->where('status', 'ativo');

        if ($product->quantity <= $product->minimum_stock) {
            Alert::updateOrCreate(
                ['product_id' => $product->id, 'type' => 'estoque_minimo', 'status' => 'ativo'],
                ['message' => "Estoque baixo: {$product->name} possui {$product->quantity} item(ns)."]
            );
        } else {
            $active->update(['status' => 'resolvido']);
        }
    }
}
