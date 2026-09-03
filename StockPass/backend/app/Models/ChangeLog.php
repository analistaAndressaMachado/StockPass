<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class ChangeLog extends Model {
    public $timestamps=false;
    protected $fillable=['user_id','entity','entity_id','action','old_data','new_data','changed_at'];
    protected function casts(): array {return ['old_data'=>'array','new_data'=>'array','changed_at'=>'datetime'];}
    public function user(){return $this->belongsTo(User::class);}
}
