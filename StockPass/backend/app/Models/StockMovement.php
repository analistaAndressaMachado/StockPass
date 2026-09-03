<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class StockMovement extends Model {
    protected $fillable=['product_id','user_id','type','quantity','occurred_at','notes'];
    protected function casts(): array {return ['quantity'=>'integer','occurred_at'=>'datetime'];}
    public function product(){return $this->belongsTo(Product::class);}
    public function user(){return $this->belongsTo(User::class);}
}
