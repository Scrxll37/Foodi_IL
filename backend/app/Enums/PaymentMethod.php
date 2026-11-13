<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case CashOnDelivery = 'cash_on_delivery';
    case CreditCard = 'credit_card';
    case Stripe = 'stripe';
    case Paypal = 'paypal';

    public function label(): string
    {
        return match ($this) {
            self::CashOnDelivery => 'Cash on Delivery (COD)',
            self::CreditCard => 'Credit Card',
            self::Stripe => 'Stripe',
            self::Paypal => 'PayPal',
        };
    }
}
