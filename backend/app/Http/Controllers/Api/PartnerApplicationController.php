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

    public function pendingApplications(): JsonResponse
    {
        $drivers = DriverProfile::with('user')
            ->where('approval_status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($dp) {
                return [
                    'id' => (string) $dp->id,
                    'userId' => (string) $dp->user_id,
                    'fullName' => $dp->user?->name ?? 'Candidat Livreur',
                    'phone' => $dp->user?->phone_number ?? '',
                    'email' => $dp->user?->email ?? '',
                    'cin' => $dp->cin_number,
                    'vehicleType' => $dp->vehicle_type ?? 'motorcycle',
                    'vehicleBrand' => $dp->vehicle_brand ?? 'Moto',
                    'vehicleModel' => $dp->vehicle_model ?? '',
                    'vehiclePlate' => $dp->license_plate ?? '',
                    'licenseNumber' => $dp->license_number ?? '',
                    'status' => 'pending',
                    'appliedDate' => $dp->applied_at ? date('d M Y', strtotime($dp->applied_at)) : 'Récemment',
                    'photoUrl' => $dp->avatar_path ?: '/images/ui/driver-reference.jpg',
                    'documents' => [
                        'cinPhotoUrl' => $dp->cin_recto_path ?: '/images/auth/phone-login.png',
                        'licensePhotoUrl' => $dp->license_photo_path ?: '/images/auth/phone-register.jpg',
                        'registrationCardUrl' => $dp->registration_card_path ?: '/images/auth/adphonee.jpg',
                    ],
                ];
            });

        $restaurants = Restaurant::where('approval_status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($r) {
                return [
                    'id' => (string) $r->id,
                    'slug' => $r->slug,
                    'name' => $r->name,
                    'managerName' => $r->manager_name ?? 'Gérant',
                    'phone' => $r->phone_number,
                    'email' => $r->email ?? '',
                    'cuisine' => $r->cuisine ?? 'Restauration',
                    'neighborhood' => $r->neighborhood ?? 'Agadir',
                    'address' => $r->address,
                    'rcNumber' => $r->rc_number ?? '',
                    'iceNumber' => $r->ice_number ?? '',
                    'status' => 'pending',
                    'appliedDate' => $r->applied_at ? date('d M Y', strtotime($r->applied_at)) : 'Récemment',
                    'logo' => $r->logo_path ?: '/images/restaurants/crusti.jpg',
                    'branches' => [],
                    'branchesCount' => 1,
                    'commissionRate' => 15,
                    'deliveryPricingMode' => 'km',
                    'customDeliveryFee' => (float) ($r->base_delivery_fee ?? 12),
                ];
            });

        return response()->json([
            'success' => true,
            'pendingDrivers' => $drivers,
            'pendingRestaurants' => $restaurants,
        ]);
    }

    public function updateApplicationStatus(Request $request): JsonResponse
    {
        $type = $request->input('type');
        $id = $request->input('id');
        $action = $request->input('status') ?? $request->input('action');

        $isApproved = ($action === 'active' || $action === 'approved');

        if ($type === 'driver') {
            $profile = DriverProfile::where('id', $id)
                ->orWhere('user_id', $id)
                ->first();

            if (!$profile) {
                return response()->json(['success' => false, 'message' => 'Profil coursier non trouvé'], 404);
            }

            $profile->approval_status = $isApproved ? 'approved' : 'rejected';
            $profile->is_available = $isApproved;
            $profile->save();

            if ($profile->user_id) {
                User::where('id', $profile->user_id)->update([
                    'role' => $isApproved ? \App\Enums\UserRole::Driver : \App\Enums\UserRole::Customer,
                ]);

                DB::table('notifications')->insert([
                    'id' => (string) Str::uuid(),
                    'type' => 'App\Notifications\DriverApplicationReviewed',
                    'notifiable_type' => 'App\Models\User',
                    'notifiable_id' => $profile->user_id,
                    'data' => json_encode([
                        'title' => $isApproved ? 'Candidature livreur acceptée !' : 'Candidature non retenue',
                        'message' => $isApproved
                            ? 'Félicitations ! Votre dossier a été validé par l\'administration. Vous pouvez maintenant vous connecter à votre espace coursier.'
                            : 'Votre candidature de livreur n\'a pas été retenue par l\'administration.',
                        'type' => 'driver',
                    ]),
                    'read_at' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => $isApproved ? 'Candidature coursier acceptée avec succès' : 'Candidature coursier refusée',
            ]);
        }

        if ($type === 'restaurant') {
            $restaurant = Restaurant::where('id', $id)
                ->orWhere('slug', $id)
                ->first();

            if (!$restaurant) {
                return response()->json(['success' => false, 'message' => 'Restaurant non trouvé'], 404);
            }

            $restaurant->approval_status = $isApproved ? 'approved' : 'rejected';
            $restaurant->status = $isApproved ? 'active' : 'inactive';
            $restaurant->save();

            if ($restaurant->created_by) {
                User::where('id', $restaurant->created_by)->update([
                    'role' => $isApproved ? \App\Enums\UserRole::RestaurantManager : \App\Enums\UserRole::Customer,
                ]);

                DB::table('notifications')->insert([
                    'id' => (string) Str::uuid(),
                    'type' => 'App\Notifications\RestaurantApplicationReviewed',
                    'notifiable_type' => 'App\Models\User',
                    'notifiable_id' => $restaurant->created_by,
                    'data' => json_encode([
                        'title' => $isApproved ? 'Demande restaurant acceptée !' : 'Demande restaurant refusée',
                        'message' => $isApproved
                            ? 'Félicitations ! Votre établissement "' . $restaurant->name . '" a été validé. Il est désormais actif sur Foodi et vous avez accès à votre espace restaurateur.'
                            : 'Votre demande d\'adhésion pour "' . $restaurant->name . '" a été refusée par l\'administration.',
                        'type' => 'restaurant',
                    ]),
                    'read_at' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => $isApproved ? 'Restaurant approuvé et activé avec succès' : 'Restaurant refusé',
            ]);
        }

        return response()->json(['success' => false, 'message' => 'Type invalide'], 422);
    }
}
