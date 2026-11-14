<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerAddress;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerAddressController extends Controller
{
    /**
     * Get saved addresses for current customer.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()?->id ?? User::where('role', 'customer')->value('id') ?? 1;

        $addresses = CustomerAddress::where('user_id', $userId)
            ->latest('is_default')
            ->get()
            ->map(function (CustomerAddress $a) {
                return [
                    'id' => (string) $a->id,
                    'type' => $a->type ?? 'apartment',
                    'neighborhood' => $a->neighborhood ?? 'Talborjt',
                    'street' => $a->street_address ?? '',
                    'city' => $a->city ?? 'Agadir',
                    'lat' => (float) ($a->latitude ?? 30.4278),
                    'lng' => (float) ($a->longitude ?? -9.5981),
                    'buildingNameNumber' => $a->building_or_apartment ?? '',
                    'floorNumber' => (string) ($a->floor ?? ''),
                    'doorNumber' => (string) ($a->door_number ?? ''),
                    'instructions' => $a->delivery_instructions ?? '',
                    'isDefault' => (bool) $a->is_default,
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $addresses,
        ]);
    }

    /**
     * Store a new delivery address.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'nullable|string',
            'neighborhood' => 'nullable|string',
            'street' => 'nullable|string',
            'city' => 'nullable|string',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'buildingNameNumber' => 'nullable|string',
            'floorNumber' => 'nullable|string',
            'doorNumber' => 'nullable|string',
            'instructions' => 'nullable|string',
            'isDefault' => 'nullable|boolean',
        ]);

        $userId = $request->user()?->id ?? User::where('role', 'customer')->value('id') ?? 1;
        $user = User::find($userId);

        if (!empty($validated['isDefault'])) {
            CustomerAddress::where('user_id', $userId)->update(['is_default' => false]);
        }

        $address = CustomerAddress::create([
            'user_id' => $userId,
            'label' => $request->input('label') ?: 'Maison',
            'type' => in_array($request->input('type', 'apartment'), ['apartment', 'house', 'office', 'other']) ? $request->input('type') : 'apartment',
            'recipient_name' => $request->input('recipientName') ?: ($user?->name ?: 'Client Foodi'),
            'recipient_phone' => $request->input('recipientPhone') ?: ($user?->phone_number ?: '+212 6 71 82 93 04'),
            'neighborhood' => $request->input('neighborhood') ?: 'Talborjt',
            'street_address' => $request->input('street') ?: 'Agadir',
            'city' => $request->input('city') ?: 'Agadir',
            'latitude' => (float) ($request->input('lat') ?? 30.4278),
            'longitude' => (float) ($request->input('lng') ?? -9.5981),
            'building_or_apartment' => $request->input('buildingNameNumber') ?: '',
            'floor' => $request->input('floorNumber') ?: '',
            'door_number' => $request->input('doorNumber') ?: '',
            'delivery_instructions' => $request->input('instructions') ?: '',
            'is_default' => (bool) $request->input('isDefault', false),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Adresse enregistrée avec succès',
            'data' => $address,
        ], 201);
    }
}
