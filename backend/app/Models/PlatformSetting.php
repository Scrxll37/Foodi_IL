<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlatformSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'price_per_km',
        'min_delivery_fee',
        'small_order_threshold',
        'small_order_fee',
        'default_commission_rate',
        'service_status',
        'support_phone',
        'support_email',
        'currency',
    ];

    protected function casts(): array
    {
        return [
            'price_per_km' => 'decimal:2',
            'min_delivery_fee' => 'decimal:2',
            'small_order_threshold' => 'decimal:2',
            'small_order_fee' => 'decimal:2',
            'default_commission_rate' => 'decimal:2',
        ];
    }

    public static function current(): self
    {
        return static::query()->firstOrCreate(
            ['id' => 1],
            [
                'price_per_km' => 4.00,
                'min_delivery_fee' => 8.00,
                'small_order_threshold' => 50.00,
                'small_order_fee' => 5.00,
                'default_commission_rate' => 15.00,
                'service_status' => 'active',
                'support_phone' => '+212 5 28 84 92 10',
                'support_email' => 'supervision@foodi.ma',
                'currency' => 'MAD',
            ]
        );
    }
}
