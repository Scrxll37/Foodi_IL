<?php

namespace App\Models;

use App\Enums\OrderPaymentStatus;
use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'token',
        'customer_id',
        'restaurant_id',
        'branch_id',
        'driver_id',
        'target_driver_id',
        'offer_created_at',
        'declined_driver_ids',
        'customer_address_id',
        'status',
        'payment_status',
        'items_subtotal',
        'delivery_fee',
        'small_order_fee',
        'tip_amount',
        'tax_amount',
        'discount_amount',
        'total_amount',
        'currency',
        'commission_amount',
        'restaurant_payout_amount',
        'delivery_recipient_name',
        'delivery_recipient_phone',
        'delivery_street_address',
        'delivery_neighborhood',
        'delivery_building_or_apartment',
        'delivery_floor',
        'delivery_door',
        'delivery_city',
        'delivery_latitude',
        'delivery_longitude',
        'delivery_notes',
        'pickup_verification_code',
        'cooking_time_minutes',
        'travel_time_minutes',
        'estimated_delivery_at',
        'confirmed_at',
        'preparing_at',
        'ready_at',
        'picked_up_at',
        'delivered_at',
        'cancelled_at',
        'cancellation_reason',
        'cancelled_by',
        'restaurant_notes',
        'idempotency_key',
    ];

    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'payment_status' => OrderPaymentStatus::class,
            'items_subtotal' => 'decimal:2',
            'delivery_fee' => 'decimal:2',
            'small_order_fee' => 'decimal:2',
            'tip_amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'commission_amount' => 'decimal:2',
            'restaurant_payout_amount' => 'decimal:2',
            'delivery_latitude' => 'decimal:7',
            'delivery_longitude' => 'decimal:7',
            'declined_driver_ids' => 'array',
            'cooking_time_minutes' => 'integer',
            'travel_time_minutes' => 'integer',
            'offer_created_at' => 'datetime',
            'estimated_delivery_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'preparing_at' => 'datetime',
            'ready_at' => 'datetime',
            'picked_up_at' => 'datetime',
            'delivered_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function user(): BelongsTo
    {
        return $this->customer();
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class, 'branch_id');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function targetDriver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'target_driver_id');
    }

    public function address(): BelongsTo
    {
        return $this->belongsTo(CustomerAddress::class, 'customer_address_id');
    }

    public function cancelledByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(OrderStatusLog::class)->latest();
    }

    public function delivery(): HasOne
    {
        return $this->hasOne(Delivery::class);
    }

    public function deliveryOffers(): HasMany
    {
        return $this->hasMany(DeliveryOffer::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class);
    }

    public function promotionRedemption(): HasOne
    {
        return $this->hasOne(PromotionRedemption::class);
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, [OrderStatus::Pending, OrderStatus::Confirmed], true);
    }
}
