<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Backup extends Model {
    public $timestamps=false;
    protected $fillable=['user_id','file_path','created_at'];
    public function user(){return $this->belongsTo(User::class);}
}
