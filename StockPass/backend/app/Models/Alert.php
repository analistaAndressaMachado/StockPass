<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Alert extends Model {
    public $timestamps=false;
    protected $fillable=['product_id','type','message','status','created_at'];
    protected function casts(): array {return ['created_at'=>'datetime'];}
    public function product(){return $this->belongsTo(Product::class);}
}
