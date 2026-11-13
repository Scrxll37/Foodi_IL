<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\PlatformSetting;
use App\Models\Restaurant;
use App\Models\Order;
use App\Models\DriverProfile;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group.
|
*/

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
