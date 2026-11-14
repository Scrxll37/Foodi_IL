<?php

namespace Database\Seeders;

use App\Enums\DeliveryStatus;
use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\CuisineType;
use App\Models\CustomerAddress;
use App\Models\Delivery;
use App\Models\DriverProfile;
use App\Models\ItemOption;
use App\Models\ItemOptionValue;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PlatformSetting;
use App\Models\Restaurant;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ImportFrontendJsonSeeder extends Seeder
{
    /**
     * Run database seeds importing full frontend JSON datasets.
     */
    public function run(): void
    {
        $dataDir = base_path('../frontend/src/data');
        if (!is_dir($dataDir)) {
            $dataDir = 'C:/xampp/htdocs/restaus/myapp/frontend/src/data';
        }

        $this->command->info("Reading JSON files from: {$dataDir}");

        DB::beginTransaction();
        try {
            // 1. Tarifs / Pricing
            $this->importPricing("{$dataDir}/pricing.json");

            // 2. Cuisines
            $this->importCuisines("{$dataDir}/cuisines.json");

            // 3. Ensure Default Users Exist (Admin, Customer)
            $defaultCustomer = $this->ensureDefaultUsers();

            // 4. Drivers & Dossiers
            $this->importDrivers("{$dataDir}/drivers.json");

            // 5. Addresses
            $this->importAddresses("{$dataDir}/addresses.json", $defaultCustomer);

            // 6. Restaurants, Branches, Categories, Dishes & Options
            $this->importRestaurants("{$dataDir}/restaurants.json");

            // 7. Orders
            $this->importOrders("{$dataDir}/orders.json", $defaultCustomer);

            DB::commit();
            $this->command->info("✅ All JSON datasets successfully imported into MySQL!");
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->command->error("❌ Import failed: " . $e->getMessage() . " on line " . $e->getLine());
            throw $e;
        }
    }

    private function importPricing(string $filePath): void
    {
        if (!file_exists($filePath)) return;
        $data = json_decode(file_get_contents($filePath), true);
        if (!$data) return;

        PlatformSetting::updateOrCreate(
            ['id' => 1],
            [
                'price_per_km' => $data['pricePerKm'] ?? 4.0,
                'min_delivery_fee' => $data['minDeliveryFee'] ?? 8.0,
                'small_order_threshold' => $data['smallOrderThreshold'] ?? 50.0,
                'small_order_fee' => $data['smallOrderFee'] ?? 5.0,
                'default_commission_rate' => $data['defaultCommissionRate'] ?? 15.0,
                'service_status' => $data['serviceStatus'] ?? 'active',
                'support_phone' => $data['supportPhone'] ?? '+212 5 28 84 92 10',
                'support_email' => $data['supportEmail'] ?? 'supervision@foodi.ma',
                'currency' => 'MAD',
            ]
        );
        $this->command->info(" -> Platform settings updated.");
    }

    private function importCuisines(string $filePath): void
    {
        if (!file_exists($filePath)) return;
        $cuisines = json_decode(file_get_contents($filePath), true);
        if (!$cuisines) return;

        foreach ($cuisines as $c) {
            CuisineType::updateOrCreate(
                ['slug' => $c['slug']],
                [
                    'name' => $c['name'],
                    'description' => $c['description'] ?? null,
                    'image_path' => $c['image'] ?? null,
                    'icon_path' => $c['icon'] ?? null,
                ]
            );
        }
        $this->command->info(" -> " . count($cuisines) . " cuisines imported.");
    }

    private function ensureDefaultUsers(): User
    {
        // Admin
        User::updateOrCreate(
            ['email' => 'admin@foodi.ma'],
            [
                'name' => 'Admin Foodi',
                'phone_number' => '+212 5 28 84 92 10',
                'password' => Hash::make('password123'),
                'role' => UserRole::Admin,
                'status' => UserStatus::Active,
            ]
        );

        // Customer
        $customer = User::updateOrCreate(
            ['email' => 'client.fayssal@foodi.ma'],
            [
                'name' => 'Fayçal Agadir',
                'phone_number' => '+212 6 71 82 93 04',
                'password' => Hash::make('password123'),
                'role' => UserRole::Customer,
                'status' => UserStatus::Active,
            ]
        );

        return $customer;
    }

    private function importDrivers(string $filePath): void
    {
        if (!file_exists($filePath)) return;
        $drivers = json_decode(file_get_contents($filePath), true);
        if (!$drivers) return;

        foreach ($drivers as $d) {
            $email = $d['email'] ?? (Str::slug($d['fullName']) . '@foodi.ma');
            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $d['fullName'],
                    'phone_number' => $d['phone'] ?? '+212 6 00 00 00 00',
                    'password' => Hash::make('password123'),
                    'role' => UserRole::Driver,
                    'status' => UserStatus::Active,
                ]
            );

            DriverProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'cin_number' => $d['cin'] ?? null,
                    'license_number' => $d['licenseNumber'] ?? null,
                    'vehicle_type' => $d['vehicleType'] ?? 'motorcycle',
                    'vehicle_brand' => $d['vehicleBrand'] ?? 'Yamaha',
                    'vehicle_model' => $d['vehicleModel'] ?? 'NMAX',
                    'license_plate' => $d['vehiclePlate'] ?? '48291-A-33',
                    'is_online' => (bool) ($d['isOnline'] ?? true),
                    'current_latitude' => $d['lat'] ?? 30.4180,
                    'current_longitude' => $d['lng'] ?? -9.5580,
                    'rating_cache' => (float) ($d['rating'] ?? 4.9),
                    'total_completed_deliveries' => (int) ($d['totalDeliveries'] ?? 100),
                    'total_assigned_orders' => (int) ($d['assignedOrdersCount'] ?? 110),
                    'approval_status' => $d['status'] ?? 'active',
                    'avatar_path' => $d['photoUrl'] ?? null,
                    'cin_recto_path' => $d['documents']['cinPhotoUrl'] ?? null,
                    'cin_verso_path' => $d['documents']['cinBackUrl'] ?? null,
                    'license_photo_path' => $d['documents']['licensePhotoUrl'] ?? null,
                    'registration_card_path' => $d['documents']['registrationCardUrl'] ?? null,
                    'insurance_path' => $d['documents']['insuranceUrl'] ?? null,
                ]
            );
        }
        $this->command->info(" -> " . count($drivers) . " driver profiles imported.");
    }

    private function importAddresses(string $filePath, User $customer): void
    {
        if (!file_exists($filePath)) return;
        $addresses = json_decode(file_get_contents($filePath), true);
        if (!$addresses) return;

        foreach ($addresses as $a) {
            CustomerAddress::updateOrCreate(
                [
                    'user_id' => $customer->id,
                    'street_address' => $a['street'] ?? '',
                    'neighborhood' => $a['neighborhood'] ?? 'Talborjt',
                ],
                [
                    'label' => ucfirst($a['type'] ?? 'Home'),
                    'recipient_name' => $customer->name,
                    'recipient_phone' => $customer->phone_number,
                    'type' => $a['type'] ?? 'apartment',
                    'city' => $a['city'] ?? 'Agadir',
                    'latitude' => $a['lat'] ?? 30.4278,
                    'longitude' => $a['lng'] ?? -9.5981,
                    'building_or_apartment' => $a['buildingNameNumber'] ?? '',
                    'floor' => $a['floorNumber'] ?? '',
                    'door_number' => $a['doorNumber'] ?? '',
                    'delivery_instructions' => $a['instructions'] ?? '',
                    'is_default' => (bool) ($a['isDefault'] ?? false),
                ]
            );
        }
        $this->command->info(" -> " . count($addresses) . " customer addresses imported.");
    }

    private function importRestaurants(string $filePath): void
    {
        if (!file_exists($filePath)) return;
        $restaurants = json_decode(file_get_contents($filePath), true);
        if (!$restaurants) return;

        $restauCount = 0;
        $dishCount = 0;

        foreach ($restaurants as $r) {
            $slug = $r['slug'] ?? Str::slug($r['name']);

            // 1. Create / Update Main Restaurant
            $restaurant = Restaurant::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $r['name'],
                    'phone_number' => $r['phone'] ?? '+212 5 28 84 92 00',
                    'city' => 'Agadir',
                    'latitude' => $r['lat'] ?? 30.4278,
                    'longitude' => $r['lng'] ?? -9.5981,
                    'created_by' => 1,
                    'logo_path' => $r['logo'] ?? '/images/restaurants/McDonalds.png',
                    'cover_image_path' => $r['cover'] ?? '/images/banners/mcdo1.png',
                    'rating_cache' => (float) ($r['rating'] ?? 4.8),
                    'total_ratings' => (int) ($r['reviewCount'] ?? 100),
                    'base_delivery_fee' => (float) ($r['deliveryFee'] ?? 10.0),
                    'minimum_order_amount' => (float) ($r['minOrder'] ?? 30.0),
                    'neighborhood' => $r['neighborhood'] ?? 'Agadir',
                    'address' => $r['address'] ?? 'Agadir',
                    'status' => 'active',
                    'is_accepting_orders' => true,
                    'auto_accept_orders' => true,
                    'estimated_prep_time_minutes' => 20,
                    'parent_restaurant_id' => null,
                ]
            );

            // 2. Link Cuisine
            if (!empty($r['cuisineSlug'])) {
                $cuisine = CuisineType::where('slug', $r['cuisineSlug'])->first();
                if ($cuisine) {
                    $restaurant->cuisineTypes()->syncWithoutDetaching([$cuisine->id]);
                }
            }

            // 3. Branches
            if (!empty($r['branches']) && is_array($r['branches'])) {
                foreach ($r['branches'] as $b) {
                    $branchSlug = $slug . '-' . Str::slug($b['name']);
                    Restaurant::updateOrCreate(
                        ['slug' => $branchSlug],
                        [
                            'name' => $r['name'],
                            'branch_name' => $b['name'],
                            'parent_restaurant_id' => $restaurant->id,
                            'neighborhood' => $b['neighborhood'] ?? 'Agadir',
                            'address' => $b['address'] ?? 'Agadir',
                            'city' => 'Agadir',
                            'latitude' => $b['lat'] ?? 30.4278,
                            'longitude' => $b['lng'] ?? -9.5981,
                            'phone_number' => $b['phone'] ?? '+212 5 28 84 92 00',
                            'created_by' => 1,
                            'logo_path' => $restaurant->logo_path,
                            'cover_image_path' => $restaurant->cover_image_path,
                            'status' => 'active',
                            'is_accepting_orders' => true,
                            'auto_accept_orders' => true,
                            'base_delivery_fee' => $restaurant->base_delivery_fee,
                            'minimum_order_amount' => $restaurant->minimum_order_amount,
                        ]
                    );
                }
            }

            // 4. Categories & Dishes
            if (!empty($r['categories']) && is_array($r['categories'])) {
                foreach ($r['categories'] as $catIdx => $catData) {
                    $category = MenuCategory::updateOrCreate(
                        [
                            'restaurant_id' => $restaurant->id,
                            'name' => $catData['name'],
                        ],
                        [
                            'sort_order' => $catIdx,
                            'is_active' => true,
                        ]
                    );

                    if (!empty($catData['dishes']) && is_array($catData['dishes'])) {
                        foreach ($catData['dishes'] as $dishIdx => $d) {
                            $dish = MenuItem::updateOrCreate(
                                [
                                    'restaurant_id' => $restaurant->id,
                                    'menu_category_id' => $category->id,
                                    'name' => $d['name'],
                                ],
                                [
                                    'description' => $d['description'] ?? '',
                                    'price' => (float) ($d['price'] ?? 0),
                                    'original_price' => !empty($d['promoPrice']) ? (float) $d['price'] : null,
                                    'image_path' => $d['image'] ?? null,
                                    'is_popular' => (bool) ($d['isPopular'] ?? false),
                                    'is_available' => true,
                                    'preparation_time_minutes' => 15,
                                    'sort_order' => $dishIdx,
                                ]
                            );
                            $dishCount++;

                            // Dish Options (drinks, sauces, sizes, etc.)
                            if (!empty($d['options']) && is_array($d['options'])) {
                                foreach ($d['options'] as $optionName => $optionValues) {
                                    if (is_array($optionValues)) {
                                        $itemOption = ItemOption::updateOrCreate(
                                            [
                                                'menu_item_id' => $dish->id,
                                                'name' => ucfirst($optionName),
                                            ],
                                            [
                                                'is_required' => false,
                                                'max_selectable' => count($optionValues),
                                            ]
                                        );

                                        foreach ($optionValues as $valName) {
                                            ItemOptionValue::updateOrCreate(
                                                [
                                                    'item_option_id' => $itemOption->id,
                                                    'name' => $valName,
                                                ],
                                                [
                                                    'price_modifier' => 0.0,
                                                    'is_default' => false,
                                                ]
                                            );
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            $restauCount++;
        }

        $this->command->info(" -> {$restauCount} restaurants and {$dishCount} dishes imported.");
    }

    private function importOrders(string $filePath, User $customer): void
    {
        if (!file_exists($filePath)) return;
        $orders = json_decode(file_get_contents($filePath), true);
        if (!$orders) return;

        foreach ($orders as $ord) {
            $restaurant = Restaurant::where('name', 'like', "%{$ord['restaurantName']}%")->first()
                ?? Restaurant::first();

            if (!$restaurant) continue;

            $status = match ($ord['status'] ?? '') {
                'preparing' => OrderStatus::Preparing,
                'picked_up', 'in_delivery' => OrderStatus::PickedUp,
                'delivered' => OrderStatus::Delivered,
                'cancelled' => OrderStatus::Cancelled,
                default => OrderStatus::Confirmed,
            };

            $order = Order::updateOrCreate(
                ['order_number' => $ord['id']],
                [
                    'token' => $ord['token'] ?? Str::random(40),
                    'customer_id' => $customer->id,
                    'restaurant_id' => $restaurant->id,
                    'status' => $status,
                    'items_subtotal' => (float) ($ord['subtotal'] ?? 50.0),
                    'delivery_fee' => (float) ($ord['deliveryFee'] ?? 10.0),
                    'small_order_fee' => 0.0,
                    'tip_amount' => 0.0,
                    'total_amount' => (float) ($ord['total'] ?? 60.0),
                    'currency' => 'MAD',
                    'delivery_recipient_name' => $ord['customerName'] ?? $customer->name,
                    'delivery_recipient_phone' => $ord['customerPhone'] ?? $customer->phone_number,
                    'delivery_neighborhood' => $ord['neighborhood'] ?? 'Talborjt',
                    'delivery_street_address' => $ord['street'] ?? '',
                    'delivery_building_or_apartment' => $ord['buildingNameNumber'] ?? '',
                    'delivery_floor' => $ord['floorNumber'] ?? '',
                    'delivery_door' => $ord['doorNumber'] ?? '',
                    'delivery_city' => 'Agadir',
                    'delivery_latitude' => $ord['lat'] ?? 30.4278,
                    'delivery_longitude' => $ord['lng'] ?? -9.5981,
                    'delivery_notes' => $ord['instructions'] ?? null,
                    'pickup_verification_code' => str_pad((string) mt_rand(0, 9999), 4, '0', STR_PAD_LEFT),
                    'cooking_time_minutes' => (int) ($ord['cookingTime'] ?? 15),
                    'travel_time_minutes' => (int) ($ord['travelTime'] ?? 10),
                    'confirmed_at' => now()->subMinutes(30),
                    'preparing_at' => now()->subMinutes(20),
                ]
            );

            // Order Items
            if (!empty($ord['items']) && is_array($ord['items'])) {
                foreach ($ord['items'] as $item) {
                    OrderItem::firstOrCreate(
                        [
                            'order_id' => $order->id,
                            'item_name' => $item['name'],
                        ],
                        [
                            'unit_price' => (float) ($item['price'] ?? 0),
                            'quantity' => (int) ($item['quantity'] ?? 1),
                            'subtotal' => ((float) ($item['price'] ?? 0)) * ((int) ($item['quantity'] ?? 1)),
                            'created_at' => now(),
                        ]
                    );
                }
            }

            // Delivery
            $delStatus = match ($order->status) {
                OrderStatus::Delivered => DeliveryStatus::Delivered,
                OrderStatus::PickedUp => DeliveryStatus::PickedUp,
                default => DeliveryStatus::PendingAssignment,
            };

            $driverUser = User::where('role', 'driver')->first();

            Delivery::updateOrCreate(
                ['order_id' => $order->id],
                [
                    'driver_id' => $delStatus === DeliveryStatus::PendingAssignment ? null : $driverUser?->id,
                    'status' => $delStatus,
                    'verification_code' => $order->pickup_verification_code,
                    'driver_payout_amount' => $order->delivery_fee,
                    'delivered_at' => $order->status === OrderStatus::Delivered ? now() : null,
                ]
            );
        }

        $this->command->info(" -> " . count($orders) . " historical orders imported.");
    }
}
