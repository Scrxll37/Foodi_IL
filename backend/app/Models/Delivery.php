<?php

namespace App\Models;

use App\Enums\DeliveryStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Delivery extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'driver_id',
        'status',
        'verification_code',
        'assigned_at',
        'accepted_at',
        'arrived_restaurant_at',
        'picked_up_at',
        'arrived_customer_at',
        'delivered_at',
        'failed_at',
        'failure_reason',
        'proof_image_path',
        'actual_distance_km',
        'actual_duration_minutes',
        'driver_payout_amount',
    ];

    protected function casts(): array
    {
        return [
            'status' => DeliveryStatus::class,
            'assigned_at' => 'datetime',
            'accepted_at' => 'datetime',
            'arrived_restaurant_at' => 'datetime',
            'picked_up_at' => 'datetime',
            'arrived_customer_at' => 'datetime',
            'delivered_at' => 'datetime',
            'failed_at' => 'datetime',
            'actual_distance_km' => 'decimal:2',
            'actual_duration_minutes' => 'integer',
            'driver_payout_amount' => 'decimal:2',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function offers(): HasMany
    {
        return $this->hasMany(DeliveryOffer::class);
    }

    public function locationLogs(): HasMany
    {
        return $this->hasMany(DriverLocationLog::class);
    }
}
