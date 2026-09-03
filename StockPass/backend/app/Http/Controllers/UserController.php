<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => User::select('id','name','email','role','created_at')->orderBy('name')->get()
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required','string','max:120'],
            'email' => ['required','email','max:150','unique:users,email'],
            'password' => ['required','string','min:6'],
            'role' => ['required',Rule::in(['Administrador','Gestor','Funcionário','Operador'])],
        ]);

        $data['password'] = Hash::make($data['password']);
        $user = User::create($data);

        return response()->json([
            'message' => 'Usuário cadastrado com sucesso.',
            'data' => $user->only('id','name','email','role')
        ], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required','string','max:120'],
            'email' => ['required','email','max:150',Rule::unique('users','email')->ignore($user->id)],
            'password' => ['nullable','string','min:6'],
            'role' => ['required',Rule::in(['Administrador','Gestor','Funcionário','Operador'])],
        ]);

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);
        return response()->json(['message' => 'Usuário atualizado.', 'data' => $user->fresh()->only('id','name','email','role')]);
    }

    public function destroy(User $user): JsonResponse
    {
        if ($user->stockMovements()->exists()) {
            return response()->json(['message' => 'Usuário possui movimentações registradas.'], 422);
        }

        $user->delete();
        return response()->json(['message' => 'Usuário excluído com sucesso.']);
    }
}
