<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PlatformSettingController;
use App\Http\Controllers\Api\RestaurantController;
use App\Http\Controllers\Api\CustomerAddressController;
use App\Http\Controllers\Api\OrderController;
use App\Models\PlatformSetting;
use App\Models\Restaurant;
use App\Models\Order;
use App\Models\DriverProfile;

/*
|--------------------------------------------------------------------------
| API Routes - Foodi Platform
|--------------------------------------------------------------------------
*/

// Health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app' => 'Foodi Backend API',
        'timestamp' => now()->toISOString(),
        'database' => [
            'connected' => true,
            'tables' => [
                'restaurants' => Restaurant::count(),
                'orders' => Order::count(),
                'drivers' => DriverProfile::count(),
            ],
            'settings' => PlatformSetting::current(),
        ],
    ]);
});

// 1. Tarifs & Platform Settings
Route::get('/settings/tarifs', [PlatformSettingController::class, 'index']);

// 2. Restaurants & Cuisines (Customer Home & Detail)
Route::get('/cuisines', [RestaurantController::class, 'cuisines']);
Route::get('/meals/budget', [RestaurantController::class, 'budgetMeals']);
Route::get('/restaurants', [RestaurantController::class, 'index']);
Route::get('/restaurants/{idOrSlug}', [RestaurantController::class, 'show']);
Route::post('/restaurants/update', [RestaurantController::class, 'update']);

// 3. Customer Saved Addresses
Route::get('/customer/addresses', [CustomerAddressController::class, 'index']);
Route::post('/customer/addresses', [CustomerAddressController::class, 'store']);

// 4. Customer Orders & Tracking
Route::get('/orders', [OrderController::class, 'index']);
Route::post('/orders', [OrderController::class, 'store']);
Route::post('/orders/update', [OrderController::class, 'updateStatus']);
Route::get('/orders/track/{token}', [OrderController::class, 'track']);
