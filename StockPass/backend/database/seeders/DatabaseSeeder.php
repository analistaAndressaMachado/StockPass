<?php
namespace Database\Seeders;
use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::create(['name'=>'Administrador StockPass','email'=>'admin@stockpass.com','password'=>Hash::make('123456'),'role'=>'Administrador']);
        User::create(['name'=>'Gestor StockPass','email'=>'gestor@stockpass.com','password'=>Hash::make('123456'),'role'=>'Gestor']);

        $category = Category::create(['name'=>'Eletrônicos','description'=>'Produtos eletrônicos']);
        $supplier = Supplier::create([
            'name'=>'Fornecedor Exemplo',
            'document'=>'00.000.000/0001-00',
            'phone'=>'(13) 0000-0000',
            'email'=>'fornecedor@stockpass.com'
        ]);

        Product::create([
            'code'=>'SP-001',
            'name'=>'Produto Exemplo',
            'description'=>'Produto inicial para teste.',
            'quantity'=>25,
            'minimum_stock'=>5,
            'expiration_date'=>now()->addYear(),
            'category_id'=>$category->id,
            'supplier_id'=>$supplier->id
        ]);
    }
}
