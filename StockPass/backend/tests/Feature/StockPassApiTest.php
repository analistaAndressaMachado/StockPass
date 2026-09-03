<?php
namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StockPassApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_hello_world(): void
    {
        $this->getJson('/api/hello-world')
            ->assertOk()
            ->assertJson(['system'=>'StockPass','status'=>'API funcionando']);
    }

    public function test_product_creation_validates_relationships(): void
    {
        $this->postJson('/api/products', [
            'code'=>'TEST-001',
            'name'=>'Produto Teste',
            'quantity'=>10,
            'minimum_stock'=>2,
            'category_id'=>999,
            'supplier_id'=>999,
        ])->assertStatus(422);
    }
}
