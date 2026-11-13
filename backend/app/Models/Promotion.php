<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class Promotion extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'title',
        'discount_type',
        'discount_value',
        'min_order_amount',
        'max_discount_amount',
        'starts_at',
        'expires_at',
        'usage_limit_total',
        'usage_limit_per_user',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'discount_value' => 'decimal:2',
            'min_order_amount' => 'decimal:2',
            'max_discount_amount' => 'decimal:2',
            'is_active' => 'boolean',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
            'usage_limit_total' => 'integer',
            'usage_limit_per_user' => 'integer',
        ];
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(PromotionRedemption::class);
    }

    public function isValidForSubtotal(float $subtotal, ?int $userId = null): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $now = Carbon::now();
        if ($this->starts_at && $now->lt($this->starts_at)) {
            return false;
        }

        if ($this->expires_at && $now->gt($this->expires_at)) {
            return false;
        }

        if ($subtotal < (float) $this->min_order_amount) {
            return false;
        }

        if ($this->usage_limit_total !== null) {
            if ($this->redemptions()->count() >= $this->usage_limit_total) {
                return false;
            }
        }

        if ($userId && $this->usage_limit_per_user) {
            $userRedemptions = $this->redemptions()->where('user_id', $userId)->count();
            if ($userRedemptions >= $this->usage_limit_per_user) {
                return false;
            }
        }

        return true;
    }

    public function calculateDiscount(float $subtotal): float
    {
        if ($this->discount_type === 'percentage') {
            $rawDiscount = round($subtotal * ((float) $this->discount_value / 100), 2);
            if ($this->max_discount_amount !== null && (float) $this->max_discount_amount > 0) {
                return min($rawDiscount, (float) $this->max_discount_amount);
            }
            return min($rawDiscount, $subtotal);
        }

        return min((float) $this->discount_value, $subtotal);
    }
}
