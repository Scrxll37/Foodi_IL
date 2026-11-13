<?php

namespace App\Models;

use App\Enums\VehicleType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DriverProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'cin_number',
        'license_number',
        'vehicle_type',
        'vehicle_brand',
        'vehicle_model',
        'vehicle_engine',
        'vehicle_color',
        'vehicle_year',
        'license_plate',
        'cin_recto_path',
        'cin_verso_path',
        'license_photo_path',
        'registration_card_path',
        'insurance_path',
        'avatar_path',
        'approval_status',
        'rejection_reason',
        'applied_at',
        'approved_at',
        'approved_by',
        'is_online',
        'is_available',
        'current_latitude',
        'current_longitude',
        'last_location_at',
        'rating_cache',
        'total_ratings',
        'total_completed_deliveries',
        'total_assigned_orders',
    ];

    protected function casts(): array
    {
        return [
            'vehicle_type' => VehicleType::class,
            'is_online' => 'boolean',
            'is_available' => 'boolean',
            'current_latitude' => 'decimal:7',
            'current_longitude' => 'decimal:7',
            'last_location_at' => 'datetime',
            'applied_at' => 'datetime',
            'approved_at' => 'datetime',
            'rating_cache' => 'decimal:2',
            'total_ratings' => 'integer',
            'total_completed_deliveries' => 'integer',
            'total_assigned_orders' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(Delivery::class, 'driver_id', 'user_id');
    }

    public function deliveryOffers(): HasMany
    {
        return $this->hasMany(DeliveryOffer::class, 'driver_id', 'user_id');
    }

    public function locationLogs(): HasMany
    {
        return $this->hasMany(DriverLocationLog::class, 'driver_id', 'user_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class, 'driver_id', 'user_id');
    }
}
