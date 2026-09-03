<?php
namespace Database\Factories;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name'=>fake()->name(),
            'email'=>fake()->unique()->safeEmail(),
            'password'=>Hash::make('123456'),
            'role'=>fake()->randomElement(['Administrador','Gestor','Funcionário','Operador']),
            'remember_token'=>Str::random(10)
        ];
    }
}
