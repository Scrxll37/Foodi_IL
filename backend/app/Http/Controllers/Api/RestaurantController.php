<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CuisineType;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RestaurantController extends Controller
{
    /**
     * Get all active restaurants with their branches and cuisines.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Restaurant::query()
            ->whereNull('parent_restaurant_id') // Only parent restaurants at top level
            ->with(['branches', 'cuisineTypes', 'schedules']);

        // Search query
        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('neighborhood', 'like', "%{$search}%");
            });
        }

        // Cuisine filter
        if ($cuisineSlug = $request->query('cuisine')) {
            $query->whereHas('cuisineTypes', function ($q) use ($cuisineSlug) {
                $q->where('slug', $cuisineSlug);
            });
        }

        // Neighborhood filter
        if ($neighborhood = $request->query('neighborhood')) {
            $query->where(function ($q) use ($neighborhood) {
                $q->where('neighborhood', $neighborhood)
                  ->orWhereHas('branches', fn($b) => $b->where('neighborhood', $neighborhood));
            });
        }

        $restaurants = $query->get()->map(function (Restaurant $r) {
            return $this->formatRestaurantListItem($r);
        })->values();

        // Compatible with both direct array and { data: [...] } consumers
        return response()->json($restaurants);
    }

    /**
     * Get single restaurant with branches, menu categories, dishes, and options.
     */
    public function show(string $idOrSlug): JsonResponse
    {
        $restaurant = Restaurant::where('id', $idOrSlug)
            ->orWhere('slug', $idOrSlug)
            ->with([
                'branches',
                'cuisineTypes',
                'schedules',
                'categories.menuItems.options.values',
            ])
            ->first();

        if (!$restaurant) {
            return response()->json([
                'status' => 'error',
                'message' => 'Restaurant non trouvé',
            ], 404);
        }

        $formatted = $this->formatRestaurantDetail($restaurant);

        return response()->json([
            'status' => 'success',
            'data' => $formatted,
            'restaurant' => $formatted,
        ]);
    }

    /**
     * Update restaurant parameters (auto-accept, delivery fee, etc.).
     */
    public function update(Request $request): JsonResponse
    {
        $id = $request->input('id');
        $slug = $request->input('slug');

        $restaurant = Restaurant::where(function ($q) use ($id, $slug) {
            if ($id) $q->where('id', $id);
            if ($slug) $q->orWhere('slug', $slug);
        })->first();

        if (!$restaurant) {
            return response()->json(['success' => false, 'message' => 'Restaurant non trouvé'], 404);
        }

        if ($request->has('autoAcceptOrders')) {
            $restaurant->auto_accept_orders = (bool) $request->input('autoAcceptOrders');
        }
        if ($request->has('isOpen')) {
            $restaurant->is_accepting_orders = (bool) $request->input('isOpen');
        }
        if ($request->has('deliveryFee')) {
            $restaurant->base_delivery_fee = (float) $request->input('deliveryFee');
        }
        if ($request->has('minOrder')) {
            $restaurant->minimum_order_amount = (float) $request->input('minOrder');
        }
        $restaurant->save();

        $restaurant->load(['branches', 'cuisineTypes', 'schedules', 'categories.menuItems.options.values']);
        $detail = $this->formatRestaurantDetail($restaurant);

        return response()->json([
            'success' => true,
            'restaurant' => $detail,
            'data' => $detail,
        ]);
    }

    /**
     * Get list of cuisines with images/icons.
     */
    public function cuisines(): JsonResponse
    {
        $cuisines = CuisineType::all()->map(function (CuisineType $c) {
            return [
                'id' => (string) $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'description' => $c->description,
                'image' => $c->image_path,
                'icon' => $c->icon_path,
            ];
        });

        return response()->json($cuisines);
    }

    /**
     * Format restaurant for listing cards.
     */
    private function formatRestaurantListItem(Restaurant $r): array
    {
        $primaryCuisine = $r->cuisineTypes->first();

        return [
            'id' => (string) $r->id,
            'name' => $r->name,
            'slug' => $r->slug ?? strtolower(str_replace(' ', '-', $r->name)),
            'logo' => $r->logo_path ?? '/images/restaurants/McDonalds.png',
            'cover' => $r->cover_image_path ?? '/images/banners/mcdo1.png',
            'rating' => (float) ($r->rating_cache ?? 4.8),
            'reviewCount' => (int) ($r->total_ratings ?? 120),
            'cuisine' => $primaryCuisine?->name ?? 'Fast Food',
            'cuisineSlug' => $primaryCuisine?->slug ?? 'fast-food',
            'deliveryTime' => ($r->estimated_prep_time_minutes ?? 20) . ' - ' . (($r->estimated_prep_time_minutes ?? 20) + 10) . ' min',
            'deliveryFee' => (float) ($r->base_delivery_fee ?? 10.0),
            'minOrder' => (float) ($r->minimum_order_amount ?? 30.0),
            'neighborhood' => $r->neighborhood ?? 'Agadir Centre',
            'address' => $r->address ?? 'Agadir',
            'phone' => $r->phone_number,
            'lat' => (float) $r->latitude,
            'lng' => (float) $r->longitude,
            'avgPrepMinutes' => (int) ($r->estimated_prep_time_minutes ?? 20),
            'autoAcceptOrders' => (bool) $r->auto_accept_orders,
            'isOpen' => (bool) $r->is_accepting_orders,
            'branches' => $r->branches->map(function (Restaurant $b) {
                return [
                    'id' => (string) $b->id,
                    'name' => $b->branch_name ?? $b->name,
                    'neighborhood' => $b->neighborhood ?? '',
                    'address' => $b->address ?? '',
                    'lat' => (float) $b->latitude,
                    'lng' => (float) $b->longitude,
                    'phone' => $b->phone_number,
                    'logo' => $b->logo_path,
                    'isOpen' => (bool) $b->is_accepting_orders,
                ];
            })->values()->all(),
        ];
    }

    /**
     * Format full restaurant details with categories, dishes, and options.
     */
    private function formatRestaurantDetail(Restaurant $r): array
    {
        $base = $this->formatRestaurantListItem($r);

        $base['categories'] = $r->categories->map(function ($cat) {
            return [
                'id' => (string) $cat->id,
                'name' => $cat->name,
                'description' => $cat->description,
                'dishes' => $cat->menuItems->map(function ($dish) {
                    $optionsMap = [];
                    foreach ($dish->options as $opt) {
                        $key = strtolower($opt->name);
                        $optionsMap[$key] = $opt->values->pluck('name')->all();
                    }

                    return [
                        'id' => (string) $dish->id,
                        'name' => $dish->name,
                        'description' => $dish->description ?? '',
                        'price' => (float) $dish->price,
                        'promoPrice' => $dish->original_price ? (float) $dish->original_price : null,
                        'image' => $dish->image_path ?? '/images/cuisines/bigmac.png',
                        'isPopular' => (bool) $dish->is_popular,
                        'isAvailable' => (bool) $dish->is_available,
                        'hasOptions' => !empty($optionsMap),
                        'options' => !empty($optionsMap) ? $optionsMap : null,
                    ];
                })->values()->all(),
            ];
        })->values()->all();

        return $base;
    }
}
