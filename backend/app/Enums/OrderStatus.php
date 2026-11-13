<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Preparing = 'preparing';
    case ReadyForPickup = 'ready_for_pickup';
    case PickedUp = 'picked_up';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending Confirmation',
            self::Confirmed => 'Confirmed by Restaurant',
            self::Preparing => 'Preparing in Kitchen',
            self::ReadyForPickup => 'Ready for Driver Pickup',
            self::PickedUp => 'Out for Delivery',
            self::Delivered => 'Delivered Successfully',
            self::Cancelled => 'Order Cancelled',
            self::Rejected => 'Order Rejected',
        };
    }

    public function isFinal(): bool
    {
        return in_array($this, [self::Delivered, self::Cancelled, self::Rejected], true);
    }
}
