<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DriverProfile;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PartnerApplicationController extends Controller
{
    public function applyDriver(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cin_number' => 'required|string|max:30',
            'vehicle_type' => 'required|string|in:bicycle,motorcycle,scooter,car',
            'license_number' => 'nullable|string|max:50',
            'vehicle_brand' => 'nullable|string|max:100',
            'vehicle_model' => 'nullable|string|max:100',
            'license_plate' => 'nullable|string|max:50',
            'user_id' => 'nullable',
            'phone' => 'nullable|string|max:50',
            'full_name' => 'nullable|string|max:150',
            'avatar_path' => 'nullable|string',
            'license_photo_path' => 'nullable|string',
            'cin_photo_path' => 'nullable|string',
            'registration_card_path' => 'nullable|string',
        ]);

        $userId = $request->input('user_id');
        if (!$userId || !User::where('id', $userId)->exists()) {
            $user = User::where('role', 'driver')->first() ?: User::first();
            $userId = $user ? $user->id : 1;
        }

        if ($request->filled('phone') || $request->filled('full_name')) {
            $updateUser = [];
            if ($request->filled('phone')) $updateUser['phone_number'] = $request->input('phone');
            if ($request->filled('full_name')) $updateUser['name'] = $request->input('full_name');
            User::where('id', $userId)->update($updateUser);
        }

        $avatarPath = $request->input('avatar_path');
        if ($avatarPath && strlen($avatarPath) > 250) {
            $avatarPath = '/images/drivers/avatar-' . $userId . '.jpg';
        }

        $licensePhoto = $request->input('license_photo_path');
        if ($licensePhoto && strlen($licensePhoto) > 250) {
            $licensePhoto = '/images/drivers/license-' . $userId . '.jpg';
        }

        $cinPhoto = $request->input('cin_photo_path');
        if ($cinPhoto && strlen($cinPhoto) > 250) {
            $cinPhoto = '/images/drivers/cin-' . $userId . '.jpg';
        }

        $regCard = $request->input('registration_card_path');
        if ($regCard && strlen($regCard) > 250) {
            $regCard = '/images/drivers/reg-' . $userId . '.jpg';
        }

        $profile = DriverProfile::updateOrCreate(
            ['user_id' => $userId],
            [
                'cin_number' => $validated['cin_number'],
                'license_number' => $validated['license_number'] ?? null,
                'vehicle_type' => $validated['vehicle_type'],
                'vehicle_brand' => $validated['vehicle_brand'] ?? null,
                'vehicle_model' => $validated['vehicle_model'] ?? null,
                'license_plate' => $validated['license_plate'] ?? null,
                'avatar_path' => $avatarPath,
                'license_photo_path' => $licensePhoto,
                'cin_recto_path' => $cinPhoto,
                'registration_card_path' => $regCard,
                'approval_status' => 'pending',
                'applied_at' => now(),
                'is_online' => false,
                'is_available' => false,
                'current_latitude' => 30.4278,
                'current_longitude' => -9.5981,
            ]
        );

        DB::table('notifications')->insert([
            'id' => (string) Str::uuid(),
            'type' => 'App\Notifications\DriverApplicationSubmitted',
            'notifiable_type' => 'App\Models\User',
            'notifiable_id' => $userId,
            'data' => json_encode([
                'title' => 'Candidature livreur reçue',
                'message' => 'Votre dossier pour devenir coursier Foodi à Agadir a été reçu. Statut : En attente de validation.',
                'type' => 'driver',
            ]),
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Votre candidature a été envoyée avec succès. Notre équipe vous contactera.',
            'data' => $profile,
        ]);
    }

    public function applyRestaurant(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'manager_name' => 'required|string|max:150',
            'phone_number' => 'required|string|max:50',
            'address' => 'required|string|max:255',
            'neighborhood' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:255',
            'rc_number' => 'nullable|string|max:100',
            'ice_number' => 'nullable|string|max:100',
            'cuisine' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'user_id' => 'nullable',
            'logo_path' => 'nullable|string',
            'cover_image_path' => 'nullable|string',
        ]);

        $userId = $request->input('user_id');
        if (!$userId || !User::where('id', $userId)->exists()) {
            $user = User::where('role', 'restaurant')->first() ?: User::first();
            $userId = $user ? $user->id : 1;
        }

        $baseSlug = Str::slug($validated['name']);
        if (empty($baseSlug)) {
            $baseSlug = 'restaurant-' . time();
        }
        $slug = $baseSlug;
        $counter = 1;
        while (Restaurant::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        $logoPath = $request->input('logo_path');
        if ($logoPath && strlen($logoPath) > 250) {
            $logoPath = '/images/restaurants/' . $slug . '-logo.jpg';
        }

        $coverPath = $request->input('cover_image_path');
        if ($coverPath && strlen($coverPath) > 250) {
            $coverPath = '/images/restaurants/' . $slug . '-cover.jpg';
        }

        $restaurant = Restaurant::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'manager_name' => $validated['manager_name'],
            'phone_number' => $validated['phone_number'],
            'email' => $validated['email'] ?? null,
            'address' => $validated['address'],
            'neighborhood' => $validated['neighborhood'] ?? 'Centre-Ville',
            'city' => 'Agadir',
            'latitude' => 30.4278,
            'longitude' => -9.5981,
            'logo_path' => $logoPath,
            'cover_image_path' => $coverPath,
            'description' => $validated['description'] ?? null,
            'rc_number' => $validated['rc_number'] ?? null,
            'ice_number' => $validated['ice_number'] ?? null,
            'approval_status' => 'pending',
            'status' => 'inactive',
            'applied_at' => now(),
            'created_by' => $userId,
            'minimum_order_amount' => 0.00,
            'base_delivery_fee' => 0.00,
            'delivery_pricing_mode' => 'per_km',
            'commission_percentage' => 15.00,
            'estimated_prep_time_minutes' => 25,
        ]);

        DB::table('notifications')->insert([
            'id' => (string) Str::uuid(),
            'type' => 'App\Notifications\RestaurantPartnerApplied',
            'notifiable_type' => 'App\Models\User',
            'notifiable_id' => $userId,
            'data' => json_encode([
                'title' => 'Demande restaurant soumise',
                'message' => 'La demande d\'inscription pour "' . $validated['name'] . '" est en cours d\'examen par l\'équipe Foodi Agadir.',
                'type' => 'restaurant',
            ]),
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Demande de partenariat enregistrée avec succès.',
            'data' => $restaurant,
        ]);
    }
}
