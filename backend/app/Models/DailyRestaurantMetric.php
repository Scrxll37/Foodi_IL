<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyRestaurantMetric extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'date',
        'gross_sales',
        'commission_owed',
        'net_payout',
        'orders_count',
        'completed_count',
        'cancelled_count',
        'average_rating',
        'ratings_count',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'gross_sales' => 'decimal:2',
            'commission_owed' => 'decimal:2',
            'net_payout' => 'decimal:2',
            'average_rating' => 'decimal:2',
            'orders_count' => 'integer',
            'completed_count' => 'integer',
            'cancelled_count' => 'integer',
            'ratings_count' => 'integer',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
