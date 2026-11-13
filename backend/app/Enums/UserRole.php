<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case RestaurantManager = 'restaurant_manager';
    case Driver = 'driver';
    case Customer = 'customer';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Platform Administrator',
            self::RestaurantManager => 'Restaurant Manager',
            self::Driver => 'Delivery Driver',
            self::Customer => 'Customer',
        };
    }
}
