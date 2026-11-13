<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantExceptionalClosure extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'restaurant_id',
        'closure_date',
        'reason',
        'all_day',
        'opens_at',
        'closes_at',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'closure_date' => 'date',
            'all_day' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
