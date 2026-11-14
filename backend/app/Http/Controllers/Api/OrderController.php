<?php

namespace App\Http\Controllers\Api;

use App\Enums\DeliveryStatus;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemOption;
use App\Models\OrderStatusLog;
use App\Models\PlatformSetting;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Order::with([
            'restaurant',
            'branch',
            'customer',
            'items.options',
            'delivery.driver.driverProfile',
        ])->latest();

        if ($customerId = $request->query('customer_id')) {
            $query->where('customer_id', $customerId);
        }

        if ($phone = $request->query('phone')) {
            $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
            $query->where(function ($q) use ($phone, $cleanPhone) {
                $q->where('delivery_recipient_phone', $phone)
                  ->orWhere('delivery_recipient_phone', 'like', "%{$cleanPhone}%");
            });
        }

        if ($restaurantId = $request->query('restaurant_id')) {
            $query->where('restaurant_id', $restaurantId);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $orders = $query->take(50)->get()->map(function (Order $order) {
            return $this->formatOrderRecord($order);
        });

        return response()->json($orders);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->json()->all();
        if (empty($data)) {
            $data = $request->all();
        }
        if (empty($data)) {
            $raw = $request->getContent();
            $data = json_decode($raw, true) ?: [];
        }

        $restaurant = null;
        if (!empty($data['restaurantId'])) {
            $restaurant = Restaurant::find($data['restaurantId'])
                ?? Restaurant::where('slug', $data['restaurantId'])->first();
        }
        if (!$restaurant && !empty($data['restaurantName'])) {
            $restaurant = Restaurant::where('name', 'like', "%{$data['restaurantName']}%")->first();
        }
        if (!$restaurant) {
            $restaurant = Restaurant::first();
        }

        $branchId = $data['branchId'] ?? null;
        $setting = PlatformSetting::current();

        $itemsData = $data['items'] ?? [];
        if (is_string($itemsData)) {
            $itemsData = json_decode($itemsData, true) ?: [];
        }
        $itemsSubtotal = 0;
        foreach ($itemsData as $item) {
            $price = (float) ($item['price'] ?? 0);
            $qty = (int) ($item['quantity'] ?? 1);
            $itemsSubtotal += ($price * $qty);
        }
        if ($itemsSubtotal <= 0 && isset($data['subtotal'])) {
            $itemsSubtotal = (float) $data['subtotal'];
        }

        $smallOrderThreshold = $setting ? (float) $setting->small_order_threshold : 50.0;
        $smallOrderFeeRate = $setting ? (float) $setting->small_order_fee : 5.0;
        $smallOrderFee = ($itemsSubtotal < $smallOrderThreshold) ? $smallOrderFeeRate : 0.0;

        $deliveryFee = isset($data['deliveryFee'])
            ? (float) $data['deliveryFee']
            : (float) ($restaurant->base_delivery_fee ?? 10.0);
        $tipAmount = isset($data['tipAmount']) ? (float) $data['tipAmount'] : 0.0;
        $totalAmount = isset($data['total']) ? (float) $data['total'] : ($itemsSubtotal + $deliveryFee + $smallOrderFee + $tipAmount);

        $customerId = $data['customerId'] ?? $request->user()?->id;
        if (!$customerId && !empty($data['customerPhone'])) {
            $cleanP = preg_replace('/[^0-9]/', '', $data['customerPhone']);
            $customerId = User::where('phone_number', $data['customerPhone'])
                ->orWhere('phone_number', 'like', "%{$cleanP}%")
                ->value('id');
        }
        if (!$customerId && !empty($data['customerEmail'])) {
            $customerId = User::where('email', strtolower($data['customerEmail']))->value('id');
        }
        if (!$customerId) {
            $customerId = User::where('role', 'customer')->value('id') ?? 9;
        }
        $customerUser = User::find($customerId);

        $addressData = $data['address'] ?? [];
        $neighborhood = is_array($addressData)
            ? ($addressData['neighborhood'] ?? ($data['neighborhood'] ?? 'Talborjt'))
            : ($data['neighborhood'] ?? 'Talborjt');
        $street = is_array($addressData)
            ? ($addressData['street'] ?? ($data['street'] ?? ''))
            : ($data['street'] ?? '');
        $building = is_array($addressData)
            ? ($addressData['buildingNameNumber'] ?? ($data['buildingNameNumber'] ?? ''))
            : ($data['buildingNameNumber'] ?? '');
        $floor = is_array($addressData)
            ? ($addressData['floorNumber'] ?? ($data['floorNumber'] ?? ''))
            : ($data['floorNumber'] ?? '');
        $door = is_array($addressData)
            ? ($addressData['doorNumber'] ?? ($data['doorNumber'] ?? ''))
            : ($data['doorNumber'] ?? '');
        $instructions = is_array($addressData)
            ? ($addressData['instructions'] ?? ($data['instructions'] ?? ''))
            : ($data['instructions'] ?? '');
        $lat = is_array($addressData)
            ? ($addressData['lat'] ?? ($data['lat'] ?? 30.4278))
            : ($data['lat'] ?? 30.4278);
        $lng = is_array($addressData)
            ? ($addressData['lng'] ?? ($data['lng'] ?? -9.5981))
            : ($data['lng'] ?? -9.5981);

        $orderNumber = !empty($data['id']) ? $data['id'] : ('CMD-AGD-' . mt_rand(1000, 9999));
        $token = !empty($data['token']) ? $data['token'] : ('trk_' . Str::random(32));
        $pickupPin = str_pad((string) mt_rand(0, 9999), 4, '0', STR_PAD_LEFT);

        $isAutoAccept = $restaurant->auto_accept_orders ?? true;
        $initialStatus = $isAutoAccept ? OrderStatus::Preparing : OrderStatus::Pending;

        $order = Order::create([
            'order_number' => $orderNumber,
            'token' => $token,
            'customer_id' => $customerId,
            'restaurant_id' => $restaurant->id,
            'branch_id' => $branchId,
            'status' => $initialStatus,
            'items_subtotal' => $itemsSubtotal,
            'delivery_fee' => $deliveryFee,
            'small_order_fee' => $smallOrderFee,
            'tip_amount' => $tipAmount,
            'total_amount' => $totalAmount,
            'currency' => 'MAD',
            'delivery_recipient_name' => $data['customerName'] ?? ($customerUser?->name ?? 'Client Foodi'),
            'delivery_recipient_phone' => $data['customerPhone'] ?? ($customerUser?->phone_number ?? '+212 6 71 82 93 04'),
            'delivery_neighborhood' => $neighborhood,
            'delivery_street_address' => $street,
            'delivery_building_or_apartment' => $building,
            'delivery_floor' => $floor,
            'delivery_door' => $door,
            'delivery_city' => 'Agadir',
            'delivery_latitude' => $lat,
            'delivery_longitude' => $lng,
            'delivery_notes' => $instructions ?: null,
            'pickup_verification_code' => $pickupPin,
            'cooking_time_minutes' => (int) ($data['cookingTime'] ?? ($restaurant->estimated_prep_time_minutes ?? 15)),
            'travel_time_minutes' => (int) ($data['travelTime'] ?? 10),
            'confirmed_at' => $isAutoAccept ? now() : null,
            'preparing_at' => $isAutoAccept ? now() : null,
        ]);

        foreach ($itemsData as $item) {
            $dishId = $item['dishId'] ?? null;
            $orderItem = OrderItem::create([
                'order_id' => $order->id,
                'menu_item_id' => is_numeric($dishId) ? (int) $dishId : null,
                'item_name' => $item['name'] ?? 'Plat Foodi',
                'unit_price' => (float) ($item['price'] ?? 0),
                'quantity' => (int) ($item['quantity'] ?? 1),
                'subtotal' => ((float) ($item['price'] ?? 0)) * ((int) ($item['quantity'] ?? 1)),
                'created_at' => now(),
            ]);

            if (!empty($item['selectedOptions']) && is_array($item['selectedOptions'])) {
                foreach ($item['selectedOptions'] as $optionName => $optionVal) {
                    OrderItemOption::create([
                        'order_item_id' => $orderItem->id,
                        'option_name' => $optionName,
                        'value_name' => (string) $optionVal,
                        'price_modifier' => 0.0,
                    ]);
                }
            } elseif (!empty($item['options']) && is_string($item['options'])) {
                OrderItemOption::create([
                    'order_item_id' => $orderItem->id,
                    'option_name' => 'Choix',
                    'value_name' => $item['options'],
                    'price_modifier' => 0.0,
                ]);
            }
        }

        OrderStatusLog::create([
            'order_id' => $order->id,
            'from_status' => null,
            'to_status' => $initialStatus->value,
            'changed_by' => $customerId,
            'notes' => 'Commande enregistrée dans MySQL',
            'created_at' => now(),
        ]);

        Delivery::create([
            'order_id' => $order->id,
            'status' => DeliveryStatus::PendingAssignment,
            'verification_code' => $pickupPin,
            'driver_payout_amount' => $deliveryFee,
        ]);

        try {
            \Illuminate\Support\Facades\DB::table('notifications')->insert([
                'id' => (string) Str::uuid(),
                'type' => 'App\Notifications\OrderPlacedNotification',
                'notifiable_type' => 'App\Models\User',
                'notifiable_id' => $customerId,
                'data' => json_encode([
                    'title' => 'Commande confirmée !',
                    'message' => "Votre commande #{$order->order_number} chez {$restaurant->name} a été enregistrée avec succès.",
                    'type' => 'order',
                ]),
                'read_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Throwable $e) {}

        $order->load(['restaurant', 'branch', 'customer', 'items.options', 'delivery.driver.driverProfile']);
        $formatted = $this->formatOrderRecord($order);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Commande créée avec succès dans MySQL',
            'order' => $formatted,
            'data' => $formatted,
        ], 201);
    }

    public function updateStatus(Request $request): JsonResponse
    {
        $token = $request->input('token');
        $id = $request->input('id');
        $newStatus = $request->input('status');

        $order = Order::where(function ($q) use ($token, $id) {
            if ($token) $q->where('token', $token);
            if ($id) $q->orWhere('order_number', $id);
        })->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Commande introuvable',
            ], 404);
        }

        if ($newStatus) {
            $mappedStatus = match ($newStatus) {
                'pending_confirmation' => OrderStatus::Pending,
                'accepted', 'preparing', 'in_prep' => OrderStatus::Preparing,
                'searching_driver', 'ready' => OrderStatus::ReadyForPickup,
                'heading_to_restaurant', 'in_delivery' => OrderStatus::PickedUp,
                'delivered' => OrderStatus::Delivered,
                'cancelled' => OrderStatus::Cancelled,
                default => null,
            };

            if ($mappedStatus) {
                $order->status = $mappedStatus;
                if ($mappedStatus === OrderStatus::Delivered) {
                    $order->delivered_at = now();
                } elseif ($mappedStatus === OrderStatus::PickedUp) {
                    $order->picked_up_at = now();
                } elseif ($mappedStatus === OrderStatus::ReadyForPickup) {
                    $order->ready_at = now();
                }
                $order->save();
            }
        }

        if ($courierId = $request->input('courierId')) {
            $driverUser = User::find($courierId);
            if ($driverUser) {
                $order->driver_id = $driverUser->id;
                $order->save();

                if ($order->delivery) {
                    $order->delivery->driver_id = $driverUser->id;
                    $order->delivery->status = DeliveryStatus::Assigned;
                    $order->delivery->save();
                }
            }
        }

        $order->load(['restaurant', 'branch', 'customer', 'items.options', 'delivery.driver.driverProfile']);
        $formatted = $this->formatOrderRecord($order);

        return response()->json([
            'success' => true,
            'order' => $formatted,
            'data' => $formatted,
        ]);
    }

    public function track(string $token): JsonResponse
    {
        $order = Order::where('token', $token)
            ->orWhere('order_number', $token)
            ->with([
                'restaurant',
                'branch',
                'customer',
                'items.options',
                'delivery.driver.driverProfile',
            ])
            ->first();

        if (!$order) {
            return response()->json([
                'status' => 'error',
                'message' => 'Commande introuvable',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $this->formatOrderRecord($order),
            'order' => $this->formatOrderRecord($order),
        ]);
    }

    private function formatOrderRecord(Order $order): array
    {
        $branch = $order->branch ?? $order->restaurant;
        $delivery = $order->delivery;
        $driver = $delivery?->driver ?? $order->driver;
        $driverProfile = $driver?->driverProfile;

        $frontendStatus = match ($order->status) {
            OrderStatus::Pending => 'pending_confirmation',
            OrderStatus::Confirmed, OrderStatus::Preparing => 'preparing',
            OrderStatus::ReadyForPickup => 'searching_driver',
            OrderStatus::PickedUp => 'in_delivery',
            OrderStatus::Delivered => 'delivered',
            OrderStatus::Cancelled => 'cancelled',
            default => 'pending_confirmation',
        };

        $statusLabels = [
            'pending_confirmation' => 'Commande envoyée, en attente de confirmation',
            'preparing' => 'Le restaurant prépare votre commande',
            'searching_driver' => 'Recherche d\'un livreur Foodi à proximité',
            'heading_to_restaurant' => 'Livreur en route vers le restaurant',
            'in_delivery' => 'Commande en cours de livraison',
            'delivered' => 'Commande livrée avec succès',
            'cancelled' => 'Commande annulée',
        ];

        $now = $order->created_at ?? now();
        $dateFormatted = $now->format('d/m/Y à H:i');

        return [
            'id' => $order->order_number,
            'token' => $order->token,
            'restaurantName' => $order->restaurant?->name ?? 'Restaurant Foodi',
            'restaurantLogo' => $order->restaurant?->logo_path ?? '/images/restaurants/McDonalds.png',
            'neighborhood' => $order->delivery_neighborhood ?? 'Talborjt',
            'street' => $order->delivery_street_address ?? '',
            'buildingNameNumber' => $order->delivery_building_or_apartment ?? '',
            'floorNumber' => $order->delivery_floor ?? '',
            'doorNumber' => $order->delivery_door ?? '',
            'date' => $dateFormatted,
            'deliveredAt' => $order->delivered_at?->format('d/m/Y à H:i'),
            'status' => $frontendStatus,
            'statusLabel' => $statusLabels[$frontendStatus] ?? 'En traitement',
            'cookingTime' => (int) ($order->cooking_time_minutes ?? 15),
            'travelTime' => (int) ($order->travel_time_minutes ?? 10),
            'totalTime' => (int) (($order->cooking_time_minutes ?? 15) + ($order->travel_time_minutes ?? 10)),
            'customerName' => $order->delivery_recipient_name ?? $order->customer?->name ?? 'Client Foodi',
            'customerPhone' => $order->delivery_recipient_phone ?? $order->customer?->phone_number ?? '+212 6 71 82 93 04',
            'courierName' => $driver?->name ?? ($frontendStatus === 'in_delivery' ? 'Amine Tazi' : null),
            'courierPhone' => $driver?->phone_number ?? ($frontendStatus === 'in_delivery' ? '+212 6 62 10 20 30' : null),
            'courierVehicle' => $driverProfile ? "{$driverProfile->vehicle_brand} {$driverProfile->vehicle_model}" : 'Moto Yamaha NMAX',
            'courierPhoto' => $driverProfile?->avatar_path ?? '/images/auth/fe.jpg',
            'courierLat' => (float) ($driverProfile?->current_latitude ?? ($branch ? $branch->latitude - 0.005 : 30.4180)),
            'courierLng' => (float) ($driverProfile?->current_longitude ?? ($branch ? $branch->longitude + 0.004 : -9.5580)),
            'shopLat' => (float) ($branch?->latitude ?? 30.4278),
            'shopLng' => (float) ($branch?->longitude ?? -9.5981),
            'shopNeighborhood' => $branch?->neighborhood ?? 'Agadir',
            'lat' => (float) ($order->delivery_latitude ?? 30.4210),
            'lng' => (float) ($order->delivery_longitude ?? -9.5850),
            'instructions' => $order->delivery_notes ?? 'Sonner à l\'interphone',
            'pickupVerificationCode' => $order->pickup_verification_code,
            'paymentMethod' => 'card',
            'paymentLabel' => 'Paiement sécurisé Foodi',
            'subtotal' => (float) $order->items_subtotal,
            'deliveryFee' => (float) $order->delivery_fee,
            'smallOrderFee' => (float) $order->small_order_fee,
            'total' => (float) $order->total_amount,
            'address' => "{$order->delivery_neighborhood}, {$order->delivery_street_address} " . ($order->delivery_floor ? "Étage {$order->delivery_floor}" : ''),
            'items' => $order->items->map(function ($item) {
                $optionsStr = $item->options->pluck('value_name')->join(', ');
                return [
                    'name' => $item->item_name,
                    'quantity' => (int) $item->quantity,
                    'price' => (float) $item->unit_price,
                    'options' => $optionsStr ?: '',
                    'image' => $item->menuItem?->image_path ?? '/images/cuisines/bigmac.png',
                ];
            })->all(),
            'createdAt' => $order->created_at?->timestamp ? $order->created_at->timestamp * 1000 : null,
        ];
    }
}
