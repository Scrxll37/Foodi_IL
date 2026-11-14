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
     * Get saved addresses for current customer from MySQL.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()?->id ?? User::where('role', 'customer')->value('id') ?? 1;

        $addresses = CustomerAddress::where('user_id', $userId)
            ->orderByDesc('is_default')
            ->latest('updated_at')
            ->get()
            ->map(function (CustomerAddress $a) {
                return $this->formatAddress($a);
            });

        return response()->json([
            'status' => 'success',
            'data' => $addresses,
        ]);
    }

    /**
     * Store or update a customer delivery address in MySQL.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => 'nullable',
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

        $isDefault = !empty($validated['isDefault']) || $request->input('isDefault') === true;

        if ($isDefault) {
            CustomerAddress::where('user_id', $userId)->update(['is_default' => false]);
        }

        $id = $request->input('id');
        $address = null;

        if (!empty($id) && is_numeric($id)) {
            $address = CustomerAddress::where('id', (int) $id)->where('user_id', $userId)->first();
        }

        if (!$address && $isDefault) {
            // Find existing default address to update
            $address = CustomerAddress::where('user_id', $userId)->where('is_default', true)->first();
        }

        $rawType = $request->input('type');
        $validType = in_array($rawType, ['apartment', 'house', 'office', 'other']) ? $rawType : 'apartment';

        $addressData = [
            'user_id' => $userId,
            'label' => $request->input('label') ?: 'Maison',
            'type' => $validType,
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
            'is_default' => $isDefault,
        ];

        if ($address) {
            $address->update($addressData);
        } else {
            $address = CustomerAddress::create($addressData);
        }

        $formatted = $this->formatAddress($address);

        return response()->json([
            'status' => 'success',
            'message' => 'Adresse enregistrée avec succès dans MySQL',
            'address' => $formatted,
            'data' => $formatted,
        ], 200);
    }

    private function formatAddress(CustomerAddress $a): array
    {
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
    }
}

