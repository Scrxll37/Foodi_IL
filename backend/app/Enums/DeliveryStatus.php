<?php

namespace App\Enums;

enum DeliveryStatus: string
{
    case PendingAssignment = 'pending_assignment';
    case Assigned = 'assigned';
    case Accepted = 'accepted';
    case Rejected = 'rejected';
    case AtRestaurant = 'at_restaurant';
    case PickedUp = 'picked_up';
    case Delivered = 'delivered';
    case Failed = 'failed';

    public function label(): string
    {
        return match ($this) {
            self::PendingAssignment => 'Waiting for Driver',
            self::Assigned => 'Assigned to Driver',
            self::Accepted => 'Accepted by Driver',
            self::Rejected => 'Rejected by Driver',
            self::AtRestaurant => 'Driver at Restaurant',
            self::PickedUp => 'Picked Up (On the Way)',
            self::Delivered => 'Delivered to Customer',
            self::Failed => 'Delivery Failed',
        };
    }
}
