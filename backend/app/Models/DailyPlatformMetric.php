<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyPlatformMetric extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'gross_merchandise_value',
        'net_revenue',
        'total_orders',
        'completed_orders',
        'cancelled_orders',
        'unique_active_customers',
        'new_registrations',
        'average_order_value',
        'cancellation_rate',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'gross_merchandise_value' => 'decimal:2',
            'net_revenue' => 'decimal:2',
            'average_order_value' => 'decimal:2',
            'cancellation_rate' => 'decimal:2',
            'total_orders' => 'integer',
            'completed_orders' => 'integer',
            'cancelled_orders' => 'integer',
            'unique_active_customers' => 'integer',
            'new_registrations' => 'integer',
        ];
    }
}
