<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
class Product extends Model {
    protected $fillable=['code','name','description','quantity','minimum_stock','expiration_date','photo','category_id','supplier_id'];
    protected $appends=['photo_url'];
    protected function casts(): array {return ['quantity'=>'integer','minimum_stock'=>'integer','expiration_date'=>'date'];}
    public function category(){return $this->belongsTo(Category::class);}
    public function supplier(){return $this->belongsTo(Supplier::class);}
    public function stockMovements(){return $this->hasMany(StockMovement::class);}
    public function alerts(){return $this->hasMany(Alert::class);}
    public function getPhotoUrlAttribute(){return $this->photo ? Storage::disk('public')->url($this->photo) : null;}
}
