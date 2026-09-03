<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AlertController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Alert::with('product:id,name,code,quantity');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return response()->json(['data' => $query->latest()->get()]);
    }

    public function show(Alert $alert): JsonResponse
    {
        return response()->json(['data' => $alert->load('product')]);
    }

    public function update(Request $request, Alert $alert): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['ativo', 'resolvido'])],
        ]);

        $alert->update($data);
        return response()->json(['message' => 'Alerta atualizado.', 'data' => $alert->fresh()]);
    }
}
