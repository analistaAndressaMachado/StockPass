<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Report extends Model {
    public $timestamps=false;
    protected $fillable=['user_id','type','file_path','generated_at'];
    public function user(){return $this->belongsTo(User::class);}
}
