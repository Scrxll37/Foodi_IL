<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryOffer extends Model
{
    use HasFactory;

    protected $fillable = [
        'delivery_id',
        'order_id',
        'driver_id',
        'status',
        'distance_to_restaurant_km',
        'offered_at',
        'responded_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'distance_to_restaurant_km' => 'decimal:2',
            'offered_at' => 'datetime',
            'responded_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function delivery(): BelongsTo
    {
        return $this->belongsTo(Delivery::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }
}
