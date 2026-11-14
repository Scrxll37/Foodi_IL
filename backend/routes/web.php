<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'service' => 'Foodi Delivery API Backend',
        'status' => 'online',
        'version' => '1.0.0',
        'database' => 'MySQL (food_delivery_db)',
        'endpoints' => [
            'health_check' => url('/api/health'),
        ],
        'message' => 'Backend is running. Use http://localhost:3000 to interact with the Foodi frontend.',
    ], 200, [], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
});
