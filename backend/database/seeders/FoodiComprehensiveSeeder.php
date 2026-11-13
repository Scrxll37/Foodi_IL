<?php

namespace Database\Seeders;

use App\Enums\DeliveryStatus;
use App\Enums\OrderPaymentStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\RestaurantStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VehicleType;
use App\Models\CuisineType;
use App\Models\CustomerAddress;
use App\Models\Delivery;
use App\Models\DeliveryOffer;
use App\Models\DriverProfile;
use App\Models\ItemOption;
use App\Models\ItemOptionValue;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusLog;
use App\Models\Payment;
use App\Models\PlatformSetting;
use App\Models\Restaurant;
use App\Models\RestaurantSchedule;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class FoodiComprehensiveSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Platform Settings
        PlatformSetting::query()->updateOrCreate(
            ['id' => 1],
            [
                'price_per_km' => 4.00,
                'min_delivery_fee' => 8.00,
                'small_order_threshold' => 50.00,
                'small_order_fee' => 5.00,
                'default_commission_rate' => 15.00,
                'service_status' => 'active',
                'support_phone' => '+212 5 28 84 92 10',
                'support_email' => 'supervision@foodi.ma',
                'currency' => 'MAD',
            ]
        );

        // 2. Cuisine Types
        $cuisinesData = [
            ['name' => 'Burgers', 'slug' => 'burgers', 'icon_path' => '/images/cuisines/burgers.png'],
            ['name' => 'Sandwichs', 'slug' => 'sandwiches', 'icon_path' => '/images/cuisines/sandwiches.png'],
            ['name' => 'Pizza', 'slug' => 'pizza', 'icon_path' => '/images/cuisines/pizza.png'],
            ['name' => 'Tacos', 'slug' => 'tacos', 'icon_path' => '/images/cuisines/tacos.png'],
            ['name' => 'Poulet Frit', 'slug' => 'poulet', 'icon_path' => '/images/cuisines/poulet.png'],
            ['name' => 'Italien', 'slug' => 'italien', 'icon_path' => '/images/cuisines/italien.png'],
            ['name' => 'Marocain', 'slug' => 'marocain', 'icon_path' => '/images/cuisines/marocain.png'],
            ['name' => 'Salades', 'slug' => 'salades', 'icon_path' => '/images/cuisines/salades.png'],
        ];

        $cuisineMap = [];
        foreach ($cuisinesData as $c) {
            $record = CuisineType::query()->updateOrCreate(
                ['slug' => $c['slug']],
                ['name' => $c['name'], 'icon_path' => $c['icon_path']]
            );
            $cuisineMap[$c['slug']] = $record->id;
        }

        // 3. Platform Administrator
        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@foodi.ma'],
            [
                'name' => 'Admin Foodi',
                'phone_number' => '+212 5 28 84 92 10',
                'password' => Hash::make('password'),
                'role' => UserRole::Admin,
                'status' => UserStatus::Active,
                'email_verified_at' => now(),
            ]
        );

        // 4. Restaurant Managers
        $managerCrusty = User::query()->updateOrCreate(
            ['email' => 'gerant.crusty@foodi.ma'],
            [
                'name' => 'Karim Benjelloun',
                'phone_number' => '+212 6 61 80 90 01',
                'password' => Hash::make('password'),
                'role' => UserRole::RestaurantManager,
                'status' => UserStatus::Active,
                'email_verified_at' => now(),
            ]
        );

        $managerMcdo = User::query()->updateOrCreate(
            ['email' => 'manager.mcdo@foodi.ma'],
            [
                'name' => 'Direction Régionale Souss',
                'phone_number' => '+212 5 28 84 92 11',
                'password' => Hash::make('password'),
                'role' => UserRole::RestaurantManager,
                'status' => UserStatus::Active,
                'email_verified_at' => now(),
            ]
        );

        $managerJardin = User::query()->updateOrCreate(
            ['email' => 'contact@lejardin.ma'],
            [
                'name' => 'Karim Alami',
                'phone_number' => '+212 5 28 22 44 55',
                'password' => Hash::make('password'),
                'role' => UserRole::RestaurantManager,
                'status' => UserStatus::Active,
                'email_verified_at' => now(),
            ]
        );

        $managerPoke = User::query()->updateOrCreate(
            ['email' => 'contact@pokebowl.ma'],
            [
                'name' => 'Imane Chraibi',
                'phone_number' => '+212 5 28 84 92 01',
                'password' => Hash::make('password'),
                'role' => UserRole::RestaurantManager,
                'status' => UserStatus::Active,
                'email_verified_at' => now(),
            ]
        );

        // 5. Delivery Drivers
        $driverAmine = User::query()->updateOrCreate(
            ['email' => 'amine.tazi@foodi.ma'],
            [
                'name' => 'Amine Tazi',
                'phone_number' => '+212 6 62 10 20 30',
                'password' => Hash::make('password'),
                'role' => UserRole::Driver,
                'status' => UserStatus::Active,
                'email_verified_at' => now(),
            ]
        );

        DriverProfile::query()->updateOrCreate(
            ['user_id' => $driverAmine->id],
            [
                'cin_number' => 'JA184920',
                'license_number' => 'PER-09281-A',
                'vehicle_type' => VehicleType::Motorcycle,
                'vehicle_brand' => 'Yamaha',
                'vehicle_model' => 'NMAX 155',
                'vehicle_engine' => '155 cc',
                'vehicle_color' => 'Noir Mat',
                'vehicle_year' => '2023',
                'license_plate' => '48291-A-33',
                'cin_recto_path' => '/data/drivers/drv-933cac00-0ef2-fac7-c05a-0698b53c68ad/cin_recto.png',
                'cin_verso_path' => '/data/drivers/drv-933cac00-0ef2-fac7-c05a-0698b53c68ad/cin_verso.png',
                'license_photo_path' => '/data/drivers/drv-933cac00-0ef2-fac7-c05a-0698b53c68ad/permis.jpg',
                'registration_card_path' => '/data/drivers/drv-933cac00-0ef2-fac7-c05a-0698b53c68ad/carte_grise.jpg',
                'insurance_path' => '/data/drivers/drv-933cac00-0ef2-fac7-c05a-0698b53c68ad/assurance.png',
                'avatar_path' => '/data/drivers/drv-933cac00-0ef2-fac7-c05a-0698b53c68ad/avatar.jpg',
                'approval_status' => 'active',
                'is_online' => true,
                'is_available' => true,
                'current_latitude' => 30.4180000,
                'current_longitude' => -9.5580000,
                'last_location_at' => now(),
                'rating_cache' => 4.90,
                'total_ratings' => 124,
                'total_completed_deliveries' => 428,
                'total_assigned_orders' => 435,
                'applied_at' => now()->subMonths(3),
                'approved_at' => now()->subMonths(3),
                'approved_by' => $admin->id,
            ]
        );

        $driverYoussef = User::query()->updateOrCreate(
            ['email' => 'youssef.amrani@foodi.ma'],
            [
                'name' => 'Youssef Amrani',
                'phone_number' => '+212 6 61 22 33 44',
                'password' => Hash::make('password'),
                'role' => UserRole::Driver,
                'status' => UserStatus::Active,
                'email_verified_at' => now(),
            ]
        );

        DriverProfile::query()->updateOrCreate(
            ['user_id' => $driverYoussef->id],
            [
                'cin_number' => 'JB492018',
                'license_number' => 'PER-33921-B',
                'vehicle_type' => VehicleType::Motorcycle,
                'vehicle_brand' => 'Honda',
                'vehicle_model' => 'PCX 125',
                'vehicle_engine' => '125 cc',
                'vehicle_color' => 'Gris Métallisé',
                'vehicle_year' => '2022',
                'license_plate' => '33819-B-33',
                'approval_status' => 'active',
                'is_online' => true,
                'is_available' => true,
                'current_latitude' => 30.4280000,
                'current_longitude' => -9.6050000,
                'last_location_at' => now(),
                'rating_cache' => 4.80,
                'total_ratings' => 88,
                'total_completed_deliveries' => 215,
                'total_assigned_orders' => 220,
                'applied_at' => now()->subMonths(2),
                'approved_at' => now()->subMonths(2),
                'approved_by' => $admin->id,
            ]
        );

        $driverKhalid = User::query()->updateOrCreate(
            ['email' => 'khalid.bennani@foodi.ma'],
            [
                'name' => 'Khalid Bennani',
                'phone_number' => '+212 6 70 88 99 00',
                'password' => Hash::make('password'),
                'role' => UserRole::Driver,
                'status' => UserStatus::Active,
                'email_verified_at' => now(),
            ]
        );

        DriverProfile::query()->updateOrCreate(
            ['user_id' => $driverKhalid->id],
            [
                'cin_number' => 'JC902811',
                'license_number' => 'PER-11204-A',
                'vehicle_type' => VehicleType::Scooter,
                'vehicle_brand' => 'Peugeot',
                'vehicle_model' => 'Kisbee 50',
                'license_plate' => '19204-D-33',
                'approval_status' => 'pending',
                'is_online' => false,
                'is_available' => false,
                'rating_cache' => 0.00,
                'total_ratings' => 0,
                'total_completed_deliveries' => 0,
                'total_assigned_orders' => 0,
                'applied_at' => now()->subDays(2),
            ]
        );

        // 6. Customers
        $clientFaycal = User::query()->updateOrCreate(
            ['email' => 'client.fayssal@foodi.ma'],
            [
                'name' => 'Fayçal Agadir',
                'phone_number' => '+212 6 71 82 93 04',
                'password' => Hash::make('password'),
                'role' => UserRole::Customer,
                'status' => UserStatus::Active,
                'email_verified_at' => now(),
            ]
        );

        $clientSara = User::query()->updateOrCreate(
            ['email' => 'sara.mansouri@foodi.ma'],
            [
                'name' => 'Sara Mansouri',
                'phone_number' => '+212 6 61 44 55 66',
                'password' => Hash::make('password'),
                'role' => UserRole::Customer,
                'status' => UserStatus::Active,
                'email_verified_at' => now(),
            ]
        );

        // 7. Customer Addresses
        CustomerAddress::query()->updateOrCreate(
            ['user_id' => $clientFaycal->id, 'label' => 'Maison Talborjt'],
            [
                'type' => 'apartment',
                'recipient_name' => 'Fayçal Agadir',
                'recipient_phone' => '+212 6 71 82 93 04',
                'street_address' => 'Avenue du 29 Fevrier',
                'neighborhood' => 'Talborjt',
                'building_or_apartment' => 'Résidence Fleurie, Bâtiment A',
                'floor' => '3ème étage',
                'door_number' => 'Appt 14',
                'city' => 'Agadir',
                'postal_code' => '80000',
                'delivery_instructions' => 'Laisser à la conciergerie si absent.',
                'latitude' => 30.4278000,
                'longitude' => -9.5981000,
                'is_default' => true,
            ]
        );

        CustomerAddress::query()->updateOrCreate(
            ['user_id' => $clientFaycal->id, 'label' => 'Bureau Dakhla'],
            [
                'type' => 'office',
                'recipient_name' => 'Fayçal Agadir',
                'recipient_phone' => '+212 6 71 82 93 04',
                'street_address' => 'Avenue des FAR',
                'neighborhood' => 'Dakhla',
                'building_or_apartment' => 'Centre d\'Affaires Agadir',
                'floor' => '2ème étage',
                'door_number' => 'Bureau 204',
                'city' => 'Agadir',
                'postal_code' => '80000',
                'delivery_instructions' => 'Remettre à l\'accueil du 2ème étage.',
                'latitude' => 30.4182000,
                'longitude' => -9.5634000,
                'is_default' => false,
            ]
        );

        CustomerAddress::query()->updateOrCreate(
            ['user_id' => $clientSara->id, 'label' => 'Villa Founty'],
            [
                'type' => 'house',
                'recipient_name' => 'Sara Mansouri',
                'recipient_phone' => '+212 6 61 44 55 66',
                'street_address' => 'Baie d\'Agadir, Rue des Palmiers',
                'neighborhood' => 'Founty',
                'building_or_apartment' => 'Villa 24',
                'floor' => null,
                'door_number' => null,
                'city' => 'Agadir',
                'postal_code' => '80000',
                'delivery_instructions' => 'Sonner au portail extérieur.',
                'latitude' => 30.4021000,
                'longitude' => -9.5892000,
                'is_default' => true,
            ]
        );

        // 8. Restaurants
        $crusty = Restaurant::query()->updateOrCreate(
            ['slug' => 'crusty'],
            [
                'name' => 'Crusty',
                'branch_name' => 'Siège Talborjt',
                'description' => 'Burgers smash gourmets, tenders marinés et sauces signatures à Agadir.',
                'phone_number' => '05 28 84 92 10',
                'email' => 'contact@crusty.ma',
                'address' => 'Avenue Hassan II, Talborjt',
                'neighborhood' => 'Talborjt',
                'city' => 'Agadir',
                'latitude' => 30.4215000,
                'longitude' => -9.5890000,
                'logo_path' => '/images/restaurants/crusti.jpg',
                'cover_image_path' => '/images/banners/1791902905_kfc1.png',
                'theme_color' => '#FF5A00',
                'theme_accent_color' => '#10B981',
                'status' => RestaurantStatus::Active,
                'is_accepting_orders' => true,
                'auto_accept_orders' => true,
                'minimum_order_amount' => 35.00,
                'base_delivery_fee' => 8.00,
                'delivery_pricing_mode' => 'per_km',
                'commission_percentage' => 15.00,
                'estimated_prep_time_minutes' => 12,
                'rating_cache' => 4.90,
                'total_ratings' => 312,
                'manager_name' => 'Karim Benjelloun',
                'rc_number' => 'RC-58291',
                'ice_number' => '001928471000032',
                'approval_status' => 'approved',
                'created_by' => $managerCrusty->id,
            ]
        );

        $crusty->cuisineTypes()->syncWithoutDetaching([
            $cuisineMap['burgers'],
            $cuisineMap['poulet'],
            $cuisineMap['sandwiches'],
        ]);

        $mcdoParent = Restaurant::query()->updateOrCreate(
            ['slug' => 'mcdonalds-agadir'],
            [
                'name' => 'McDonald\'s',
                'branch_name' => 'Direction Régionale Souss',
                'description' => 'Chaîne emblématique mondiale : Big Mac, McFlurry, frites dorées.',
                'phone_number' => '05 28 84 10 20',
                'email' => 'contact@mcdonalds.ma',
                'address' => 'Avenue Hassan II',
                'neighborhood' => 'Talborjt',
                'city' => 'Agadir',
                'latitude' => 30.4167000,
                'longitude' => -9.6000000,
                'logo_path' => '/images/restaurants/McDonalds.png',
                'cover_image_path' => '/images/meals/1791902884_mcdo2.png',
                'theme_color' => '#DA291C',
                'theme_accent_color' => '#FFC72C',
                'status' => RestaurantStatus::Active,
                'is_accepting_orders' => true,
                'auto_accept_orders' => true,
                'minimum_order_amount' => 40.00,
                'base_delivery_fee' => 8.00,
                'delivery_pricing_mode' => 'per_km',
                'commission_percentage' => 15.00,
                'estimated_prep_time_minutes' => 15,
                'rating_cache' => 4.80,
                'total_ratings' => 850,
                'manager_name' => 'Direction Régionale Souss',
                'approval_status' => 'approved',
                'created_by' => $managerMcdo->id,
            ]
        );

        $mcdoParent->cuisineTypes()->syncWithoutDetaching([
            $cuisineMap['burgers'],
            $cuisineMap['poulet'],
        ]);

        // McDonald's Branches
        $mcdoBranchTalborjt = Restaurant::query()->updateOrCreate(
            ['slug' => 'mcdonalds-talborjt'],
            [
                'parent_restaurant_id' => $mcdoParent->id,
                'name' => 'McDonald\'s',
                'branch_name' => 'Avenue Hassan II (Talborjt)',
                'description' => 'McDonald\'s Agadir Centre.',
                'phone_number' => '05 28 84 10 21',
                'email' => 'talborjt@mcdonalds.ma',
                'address' => 'Avenue Hassan II, Talborjt',
                'neighborhood' => 'Talborjt',
                'city' => 'Agadir',
                'latitude' => 30.4167000,
                'longitude' => -9.6000000,
                'logo_path' => '/images/restaurants/McDonalds.png',
                'status' => RestaurantStatus::Active,
                'is_accepting_orders' => true,
                'auto_accept_orders' => true,
                'minimum_order_amount' => 40.00,
                'base_delivery_fee' => 8.00,
                'delivery_pricing_mode' => 'per_km',
                'commission_percentage' => 15.00,
                'estimated_prep_time_minutes' => 15,
                'rating_cache' => 4.80,
                'total_ratings' => 420,
                'approval_status' => 'approved',
                'created_by' => $managerMcdo->id,
            ]
        );

        $mcdoBranchDakhla = Restaurant::query()->updateOrCreate(
            ['slug' => 'mcdonalds-dakhla'],
            [
                'parent_restaurant_id' => $mcdoParent->id,
                'name' => 'McDonald\'s',
                'branch_name' => 'Dakhla (Avenue des FAR)',
                'description' => 'McDonald\'s Quartier Dakhla.',
                'phone_number' => '05 28 84 10 22',
                'email' => 'dakhla@mcdonalds.ma',
                'address' => 'Avenue des FAR, Quartier Dakhla',
                'neighborhood' => 'Dakhla',
                'city' => 'Agadir',
                'latitude' => 30.4180000,
                'longitude' => -9.5620000,
                'logo_path' => '/images/restaurants/McDonalds.png',
                'status' => RestaurantStatus::Active,
                'is_accepting_orders' => true,
                'auto_accept_orders' => true,
                'minimum_order_amount' => 40.00,
                'base_delivery_fee' => 8.00,
                'delivery_pricing_mode' => 'per_km',
                'commission_percentage' => 15.00,
                'estimated_prep_time_minutes' => 15,
                'rating_cache' => 4.70,
                'total_ratings' => 310,
                'approval_status' => 'approved',
                'created_by' => $managerMcdo->id,
            ]
        );

        // Pending Restaurant Candidatures (Admin Dossiers)
        Restaurant::query()->updateOrCreate(
            ['slug' => 'le-jardin-dagadir'],
            [
                'name' => 'Le Jardin d\'Agadir',
                'branch_name' => 'Dakhla',
                'description' => 'Cuisine marocaine authentique, tajines traditionnels et pastillas fines.',
                'phone_number' => '+212 5 28 22 44 55',
                'email' => 'karim.alami@lejardin.ma',
                'address' => 'Avenue Hassan II, Dakhla',
                'neighborhood' => 'Dakhla',
                'city' => 'Agadir',
                'latitude' => 30.4180000,
                'longitude' => -9.5600000,
                'logo_path' => '/images/restaurants/crusti.jpg',
                'status' => RestaurantStatus::Inactive,
                'approval_status' => 'pending',
                'is_accepting_orders' => false,
                'auto_accept_orders' => false,
                'minimum_order_amount' => 50.00,
                'base_delivery_fee' => 12.00,
                'delivery_pricing_mode' => 'per_km',
                'commission_percentage' => 15.00,
                'estimated_prep_time_minutes' => 25,
                'rc_number' => 'RC-82910',
                'ice_number' => '002910291000084',
                'manager_name' => 'Karim Alami',
                'applied_at' => now()->subDay(),
                'created_by' => $managerJardin->id,
            ]
        );

        // 9. Restaurant Opening Hours Schedule
        $activeRestaurants = [$crusty, $mcdoParent, $mcdoBranchTalborjt, $mcdoBranchDakhla];
        foreach ($activeRestaurants as $r) {
            for ($day = 1; $day <= 7; $day++) {
                RestaurantSchedule::query()->updateOrCreate(
                    ['restaurant_id' => $r->id, 'day_of_week' => $day],
                    ['opens_at' => '10:30:00', 'closes_at' => '23:30:00', 'is_closed' => false]
                );
            }
        }

        // 10. Menu Categories & Dishes
        $catSmash = MenuCategory::query()->updateOrCreate(
            ['restaurant_id' => $crusty->id, 'name' => 'Burgers Smash'],
            ['description' => 'Viande hachée 100% bœuf smashée minute sur plaque brûlante.', 'sort_order' => 1, 'is_active' => true]
        );

        $catSides = MenuCategory::query()->updateOrCreate(
            ['restaurant_id' => $crusty->id, 'name' => 'Accompagnements'],
            ['description' => 'Frites dorées, frites épicées et finger food.', 'sort_order' => 2, 'is_active' => true]
        );

        $catDrinks = MenuCategory::query()->updateOrCreate(
            ['restaurant_id' => $crusty->id, 'name' => 'Boissons'],
            ['description' => 'Sodas frais et jus.', 'sort_order' => 3, 'is_active' => true]
        );

        $dishClassic = MenuItem::query()->updateOrCreate(
            ['restaurant_id' => $crusty->id, 'name' => 'Crusty Classic Smash'],
            [
                'menu_category_id' => $catSmash->id,
                'description' => 'Double steak smashé, double cheddar affiné, oignons caramélisés et sauce signature.',
                'price' => 55.00,
                'original_price' => 65.00,
                'image_path' => '/images/meals/1791902884_mcdo2.png',
                'preparation_time_minutes' => 10,
                'is_available' => true,
                'is_featured' => true,
                'is_popular' => true,
                'sort_order' => 1,
            ]
        );

        $dishFries = MenuItem::query()->updateOrCreate(
            ['restaurant_id' => $crusty->id, 'name' => 'Frites Maison Épicées'],
            [
                'menu_category_id' => $catSides->id,
                'description' => 'Frites fraîches coupées main avec assaisonnement cajun secret.',
                'price' => 18.00,
                'image_path' => '/images/cuisines/poulet.png',
                'preparation_time_minutes' => 5,
                'is_available' => true,
                'is_featured' => false,
                'is_popular' => true,
                'sort_order' => 2,
            ]
        );

        // McDonald's Menu
        $catMcdoBestOf = MenuCategory::query()->updateOrCreate(
            ['restaurant_id' => $mcdoParent->id, 'name' => 'Menus Maxi Best Of'],
            ['description' => 'Le burger avec grande frite et boisson maxi.', 'sort_order' => 1, 'is_active' => true]
        );

        $dishBigMac = MenuItem::query()->updateOrCreate(
            ['restaurant_id' => $mcdoParent->id, 'name' => 'Menu Maxi Best Of Big Mac'],
            [
                'menu_category_id' => $catMcdoBestOf->id,
                'description' => 'Le légendaire Big Mac accompagné d\'une grande frite et d\'une grande boisson.',
                'price' => 74.00,
                'image_path' => '/images/meals/1791902884_mcdo2.png',
                'preparation_time_minutes' => 8,
                'is_available' => true,
                'is_featured' => true,
                'is_popular' => true,
                'sort_order' => 1,
            ]
        );

        $dishMcFlurry = MenuItem::query()->updateOrCreate(
            ['restaurant_id' => $mcdoParent->id, 'name' => 'McFlurry Oreo'],
            [
                'menu_category_id' => $catMcdoBestOf->id,
                'description' => 'Glace fondante à la vanille garnie d\'éclats de biscuits Oreo.',
                'price' => 20.00,
                'image_path' => '/images/cuisines/desserts.png',
                'preparation_time_minutes' => 3,
                'is_available' => true,
                'is_featured' => false,
                'is_popular' => true,
                'sort_order' => 2,
            ]
        );

        // 11. Customization Options (Dish Options)
        $optionDrink = ItemOption::query()->updateOrCreate(
            ['menu_item_id' => $dishBigMac->id, 'name' => 'Choix de boisson'],
            ['is_required' => true, 'max_selections' => 1, 'sort_order' => 1]
        );

        ItemOptionValue::query()->updateOrCreate(
            ['item_option_id' => $optionDrink->id, 'name' => 'Coca-Cola 50cl'],
            ['price_modifier' => 0.00, 'is_default' => true, 'is_available' => true]
        );
        ItemOptionValue::query()->updateOrCreate(
            ['item_option_id' => $optionDrink->id, 'name' => 'Sprite 50cl'],
            ['price_modifier' => 0.00, 'is_default' => false, 'is_available' => true]
        );
        ItemOptionValue::query()->updateOrCreate(
            ['item_option_id' => $optionDrink->id, 'name' => 'Fanta Orange 50cl'],
            ['price_modifier' => 0.00, 'is_default' => false, 'is_available' => true]
        );

        // 12. Realistic Order Workflow Samples
        // Order 1: Active In-Transit Delivery assigned to Amine Tazi
        $order1 = Order::query()->updateOrCreate(
            ['order_number' => 'CMD-AGD-4921'],
            [
                'token' => 'trk_4921_agadir',
                'customer_id' => $clientFaycal->id,
                'restaurant_id' => $mcdoParent->id,
                'branch_id' => $mcdoBranchTalborjt->id,
                'driver_id' => $driverAmine->id,
                'status' => OrderStatus::PickedUp,
                'payment_status' => OrderPaymentStatus::Paid,
                'items_subtotal' => 94.00,
                'delivery_fee' => 12.00,
                'small_order_fee' => 0.00,
                'tip_amount' => 0.00,
                'discount_amount' => 0.00,
                'total_amount' => 106.00,
                'currency' => 'MAD',
                'commission_amount' => 14.10,
                'restaurant_payout_amount' => 79.90,
                'delivery_recipient_name' => 'Fayçal Agadir',
                'delivery_recipient_phone' => '+212 6 71 82 93 04',
                'delivery_street_address' => 'Avenue du 29 Fevrier',
                'delivery_neighborhood' => 'Talborjt',
                'delivery_building_or_apartment' => 'Résidence Fleurie, Bâtiment A',
                'delivery_floor' => '3ème étage',
                'delivery_door' => 'Appt 14',
                'delivery_city' => 'Agadir',
                'delivery_latitude' => 30.4278000,
                'delivery_longitude' => -9.5981000,
                'delivery_notes' => 'Sonner à l\'interphone et monter au 3ème.',
                'pickup_verification_code' => '4921',
                'cooking_time_minutes' => 8,
                'travel_time_minutes' => 6,
                'estimated_delivery_at' => now()->addMinutes(12),
                'confirmed_at' => now()->subMinutes(18),
                'preparing_at' => now()->subMinutes(16),
                'ready_at' => now()->subMinutes(8),
                'picked_up_at' => now()->subMinutes(3),
            ]
        );

        OrderItem::query()->updateOrCreate(
            ['order_id' => $order1->id, 'item_name' => 'Menu Maxi Best Of Big Mac'],
            [
                'menu_item_id' => $dishBigMac->id,
                'unit_price' => 74.00,
                'quantity' => 1,
                'options_total' => 0.00,
                'subtotal' => 74.00,
                'special_instructions' => 'Sauce supplémentaire s\'il vous plaît.',
            ]
        );

        OrderItem::query()->updateOrCreate(
            ['order_id' => $order1->id, 'item_name' => 'McFlurry Oreo'],
            [
                'menu_item_id' => $dishMcFlurry->id,
                'unit_price' => 20.00,
                'quantity' => 1,
                'options_total' => 0.00,
                'subtotal' => 20.00,
            ]
        );

        $delivery1 = Delivery::query()->updateOrCreate(
            ['order_id' => $order1->id],
            [
                'driver_id' => $driverAmine->id,
                'status' => DeliveryStatus::PickedUp,
                'verification_code' => '4921',
                'assigned_at' => now()->subMinutes(15),
                'accepted_at' => now()->subMinutes(14),
                'arrived_restaurant_at' => now()->subMinutes(7),
                'picked_up_at' => now()->subMinutes(3),
                'actual_distance_km' => 2.40,
                'actual_duration_minutes' => 9,
                'driver_payout_amount' => 12.00,
            ]
        );

        Payment::query()->updateOrCreate(
            ['order_id' => $order1->id],
            [
                'payment_method' => PaymentMethod::CreditCard,
                'amount' => 106.00,
                'currency' => 'MAD',
                'status' => PaymentStatus::Completed,
                'transaction_reference' => 'TXN-AGD-94821',
                'payment_gateway' => 'cmi',
                'paid_at' => now()->subMinutes(18),
            ]
        );

        OrderStatusLog::query()->create([
            'order_id' => $order1->id,
            'from_status' => 'pending_confirmation',
            'to_status' => 'confirmed',
            'notes' => 'Commande acceptée par le restaurant',
        ]);
        OrderStatusLog::query()->create([
            'order_id' => $order1->id,
            'from_status' => 'confirmed',
            'to_status' => 'picked_up',
            'notes' => 'Commande récupérée par le coursier Amine Tazi',
        ]);

        // Order 2: In-Kitchen Preparing with Sequential Dispatching
        $order2 = Order::query()->updateOrCreate(
            ['order_number' => 'CMD-AGD-3810'],
            [
                'token' => 'trk_3810_agadir',
                'customer_id' => $clientSara->id,
                'restaurant_id' => $crusty->id,
                'status' => OrderStatus::Preparing,
                'payment_status' => OrderPaymentStatus::Pending,
                'items_subtotal' => 73.00,
                'delivery_fee' => 14.00,
                'small_order_fee' => 0.00,
                'tip_amount' => 0.00,
                'discount_amount' => 0.00,
                'total_amount' => 87.00,
                'currency' => 'MAD',
                'commission_amount' => 10.95,
                'restaurant_payout_amount' => 62.05,
                'delivery_recipient_name' => 'Sara Mansouri',
                'delivery_recipient_phone' => '+212 6 61 44 55 66',
                'delivery_street_address' => 'Baie d\'Agadir, Rue des Palmiers',
                'delivery_neighborhood' => 'Founty',
                'delivery_building_or_apartment' => 'Villa 24',
                'delivery_city' => 'Agadir',
                'delivery_latitude' => 30.4021000,
                'delivery_longitude' => -9.5892000,
                'pickup_verification_code' => '3810',
                'target_driver_id' => $driverYoussef->id,
                'offer_created_at' => now(),
                'declined_driver_ids' => [],
                'cooking_time_minutes' => 12,
                'travel_time_minutes' => 10,
                'estimated_delivery_at' => now()->addMinutes(22),
                'confirmed_at' => now()->subMinutes(5),
                'preparing_at' => now()->subMinutes(4),
            ]
        );

        OrderItem::query()->updateOrCreate(
            ['order_id' => $order2->id, 'item_name' => 'Crusty Classic Smash'],
            [
                'menu_item_id' => $dishClassic->id,
                'unit_price' => 55.00,
                'quantity' => 1,
                'options_total' => 0.00,
                'subtotal' => 55.00,
            ]
        );
        OrderItem::query()->updateOrCreate(
            ['order_id' => $order2->id, 'item_name' => 'Frites Maison Épicées'],
            [
                'menu_item_id' => $dishFries->id,
                'unit_price' => 18.00,
                'quantity' => 1,
                'options_total' => 0.00,
                'subtotal' => 18.00,
            ]
        );

        $delivery2 = Delivery::query()->updateOrCreate(
            ['order_id' => $order2->id],
            [
                'driver_id' => $driverYoussef->id,
                'status' => DeliveryStatus::Assigned,
                'verification_code' => '3810',
                'assigned_at' => now(),
                'actual_distance_km' => 3.50,
                'driver_payout_amount' => 14.00,
            ]
        );

        DeliveryOffer::query()->updateOrCreate(
            ['delivery_id' => $delivery2->id, 'driver_id' => $driverYoussef->id],
            [
                'order_id' => $order2->id,
                'status' => 'pending',
                'distance_to_restaurant_km' => 1.20,
                'offered_at' => now(),
                'expires_at' => now()->addSeconds(25),
            ]
        );

        Payment::query()->updateOrCreate(
            ['order_id' => $order2->id],
            [
                'payment_method' => PaymentMethod::CashOnDelivery,
                'amount' => 87.00,
                'currency' => 'MAD',
                'status' => PaymentStatus::Pending,
                'payment_gateway' => 'cod',
            ]
        );

        // Order 3: Delivered Order with Customer Rating
        $order3 = Order::query()->updateOrCreate(
            ['order_number' => 'CMD-AGD-2104'],
            [
                'token' => 'trk_2104_agadir',
                'customer_id' => $clientFaycal->id,
                'restaurant_id' => $crusty->id,
                'driver_id' => $driverAmine->id,
                'status' => OrderStatus::Delivered,
                'payment_status' => OrderPaymentStatus::Paid,
                'items_subtotal' => 110.00,
                'delivery_fee' => 10.00,
                'small_order_fee' => 0.00,
                'tip_amount' => 5.00,
                'discount_amount' => 0.00,
                'total_amount' => 125.00,
                'currency' => 'MAD',
                'commission_amount' => 16.50,
                'restaurant_payout_amount' => 93.50,
                'delivery_recipient_name' => 'Fayçal Agadir',
                'delivery_recipient_phone' => '+212 6 71 82 93 04',
                'delivery_street_address' => 'Avenue du 29 Fevrier',
                'delivery_neighborhood' => 'Talborjt',
                'delivery_building_or_apartment' => 'Résidence Fleurie, Bâtiment A',
                'delivery_floor' => '3ème étage',
                'delivery_door' => 'Appt 14',
                'delivery_city' => 'Agadir',
                'delivery_latitude' => 30.4278000,
                'delivery_longitude' => -9.5981000,
                'pickup_verification_code' => '2104',
                'delivered_at' => now()->subHours(2),
            ]
        );

        Delivery::query()->updateOrCreate(
            ['order_id' => $order3->id],
            [
                'driver_id' => $driverAmine->id,
                'status' => DeliveryStatus::Delivered,
                'verification_code' => '2104',
                'assigned_at' => now()->subHours(3),
                'accepted_at' => now()->subHours(3)->addMinutes(1),
                'arrived_restaurant_at' => now()->subHours(3)->addMinutes(10),
                'picked_up_at' => now()->subHours(3)->addMinutes(15),
                'arrived_customer_at' => now()->subHours(2)->subMinutes(5),
                'delivered_at' => now()->subHours(2),
                'actual_distance_km' => 2.10,
                'actual_duration_minutes' => 14,
                'driver_payout_amount' => 15.00,
            ]
        );

        Review::query()->updateOrCreate(
            ['order_id' => $order3->id],
            [
                'customer_id' => $clientFaycal->id,
                'restaurant_id' => $crusty->id,
                'driver_id' => $driverAmine->id,
                'restaurant_rating' => 5,
                'restaurant_comment' => 'Smash burgers excellents, livraison rapide et soignée.',
                'driver_rating' => 5,
                'driver_comment' => 'Livreur très courtois et ponctuel.',
            ]
        );
    }
}
