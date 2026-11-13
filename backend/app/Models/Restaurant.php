<?php

namespace App\Models;

use App\Enums\RestaurantStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Restaurant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'branch_name',
        'parent_restaurant_id',
        'slug',
        'description',
        'phone_number',
        'email',
        'address',
        'neighborhood',
        'city',
        'latitude',
        'longitude',
        'logo_path',
        'cover_image_path',
        'theme_color',
        'theme_accent_color',
        'customization_options',
        'status',
        'is_accepting_orders',
        'auto_accept_orders',
        'minimum_order_amount',
        'base_delivery_fee',
        'delivery_pricing_mode',
        'custom_delivery_fee',
        'commission_percentage',
        'estimated_prep_time_minutes',
        'rating_cache',
        'total_ratings',
        'rc_number',
        'ice_number',
        'manager_name',
        'approval_status',
        'rejection_reason',
        'applied_at',
        'approved_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => RestaurantStatus::class,
            'is_accepting_orders' => 'boolean',
            'auto_accept_orders' => 'boolean',
            'customization_options' => 'array',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'minimum_order_amount' => 'decimal:2',
            'base_delivery_fee' => 'decimal:2',
            'custom_delivery_fee' => 'decimal:2',
            'commission_percentage' => 'decimal:2',
            'rating_cache' => 'decimal:2',
            'estimated_prep_time_minutes' => 'integer',
            'total_ratings' => 'integer',
            'applied_at' => 'datetime',
            'approved_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function parentRestaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class, 'parent_restaurant_id');
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Restaurant::class, 'parent_restaurant_id');
    }

    public function cuisineTypes(): BelongsToMany
    {
        return $this->belongsToMany(CuisineType::class, 'restaurant_cuisine');
    }

    public function categories(): HasMany
    {
        return $this->hasMany(MenuCategory::class)->orderBy('sort_order');
    }

    public function menuItems(): HasMany
    {
        return $this->hasMany(MenuItem::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(RestaurantSchedule::class);
    }

    public function exceptionalClosures(): HasMany
    {
        return $this->hasMany(RestaurantExceptionalClosure::class);
    }

    public function managers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'restaurant_managers')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function dailyMetrics(): HasMany
    {
        return $this->hasMany(DailyRestaurantMetric::class);
    }
}
