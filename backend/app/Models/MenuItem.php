<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MenuItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'restaurant_id',
        'menu_category_id',
        'name',
        'description',
        'image_path',
        'price',
        'original_price',
        'preparation_time_minutes',
        'is_available',
        'is_featured',
        'is_popular',
        'sort_order',
    ];

    protected $appends = [
        'discount_percentage',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'original_price' => 'decimal:2',
            'preparation_time_minutes' => 'integer',
            'is_available' => 'boolean',
            'is_featured' => 'boolean',
            'is_popular' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function getDiscountPercentageAttribute(): ?int
    {
        if ($this->original_price && (float) $this->original_price > (float) $this->price) {
            return (int) round((((float) $this->original_price - (float) $this->price) / (float) $this->original_price) * 100);
        }
        return null;
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(MenuCategory::class, 'menu_category_id');
    }

    public function options(): HasMany
    {
        return $this->hasMany(ItemOption::class)->orderBy('sort_order');
    }
}
