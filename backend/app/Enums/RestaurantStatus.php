<?php

namespace App\Enums;

enum RestaurantStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case TemporarilyClosed = 'temporarily_closed';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active & Open',
            self::Inactive => 'Inactive',
            self::TemporarilyClosed => 'Temporarily Closed',
        };
    }
}
