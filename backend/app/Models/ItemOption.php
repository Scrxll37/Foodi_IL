<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ItemOption extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'menu_item_id',
        'name',
        'is_required',
        'max_selections',
        'sort_order',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'max_selections' => 'integer',
            'sort_order' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }

    public function values(): HasMany
    {
        return $this->hasMany(ItemOptionValue::class)->orderBy('sort_order');
    }
}
