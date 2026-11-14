<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use Illuminate\Http\JsonResponse;

class PlatformSettingController extends Controller
{
    public function index(): JsonResponse
    {
        $setting = PlatformSetting::current();

        if (!$setting) {
            return response()->json([
                'pricePerKm' => 4.0,
                'minDeliveryFee' => 8.0,
                'smallOrderThreshold' => 50.0,
                'smallOrderFee' => 5.0,
                'defaultCommissionRate' => 15.0,
                'serviceStatus' => 'active',
                'currency' => 'MAD',
                'supportPhone' => '+212 5 28 84 92 10',
                'supportEmail' => 'supervision@foodi.ma',
            ]);
        }

        return response()->json([
            'pricePerKm' => (float) $setting->price_per_km,
            'minDeliveryFee' => (float) $setting->min_delivery_fee,
            'smallOrderThreshold' => (float) $setting->small_order_threshold,
            'smallOrderFee' => (float) $setting->small_order_fee,
            'defaultCommissionRate' => (float) $setting->default_commission_rate,
            'serviceStatus' => $setting->service_status,
            'currency' => $setting->currency ?? 'MAD',
            'supportPhone' => $setting->support_phone ?? '+212 5 28 84 92 10',
            'supportEmail' => $setting->support_email ?? 'supervision@foodi.ma',
        ]);
    }
}
