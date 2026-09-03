<?php
namespace App\Models;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
class User extends Authenticatable {
    use Notifiable;
    protected $fillable=['name','email','password','role'];
    protected $hidden=['password','remember_token'];
    protected function casts(): array { return ['email_verified_at'=>'datetime','password'=>'hashed']; }
    public function stockMovements(){return $this->hasMany(StockMovement::class);}
    public function reports(){return $this->hasMany(Report::class);}
    public function backups(){return $this->hasMany(Backup::class);}
    public function changeLogs(){return $this->hasMany(ChangeLog::class);}
}
