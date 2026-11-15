<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PlatformSettingController;
use App\Http\Controllers\Api\RestaurantController;
use App\Http\Controllers\Api\CustomerAddressController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PartnerApplicationController;
use App\Models\PlatformSetting;
use App\Models\Restaurant;
use App\Models\Order;
use App\Models\DriverProfile;

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

Route::get('/settings/tarifs', [PlatformSettingController::class, 'index']);

Route::get('/cuisines', [RestaurantController::class, 'cuisines']);
Route::get('/meals/budget', [RestaurantController::class, 'budgetMeals']);
Route::get('/restaurants', [RestaurantController::class, 'index']);
Route::get('/restaurants/{idOrSlug}', [RestaurantController::class, 'show']);
Route::post('/restaurants/update', [RestaurantController::class, 'update']);

Route::get('/customer/addresses', [CustomerAddressController::class, 'index']);
Route::post('/customer/addresses', [CustomerAddressController::class, 'store']);

Route::get('/orders', [OrderController::class, 'index']);
Route::post('/orders', [OrderController::class, 'store']);
Route::post('/orders/update', [OrderController::class, 'updateStatus']);
Route::get('/orders/track/{token}', [OrderController::class, 'track']);

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::get('/auth/me', [AuthController::class, 'me']);
Route::post('/auth/profile', [AuthController::class, 'updateProfile']);

Route::get('/notifications', [NotificationController::class, 'index']);
Route::post('/notifications/read', [NotificationController::class, 'markRead']);
Route::post('/notifications', [NotificationController::class, 'store']);

Route::post('/partners/driver-apply', [PartnerApplicationController::class, 'applyDriver']);
Route::post('/partners/restaurant-apply', [PartnerApplicationController::class, 'applyRestaurant']);
