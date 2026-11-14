<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->query('user_id') ?? $request->header('X-User-Id');

        $query = DB::table('notifications')->latest('created_at');

        if ($userId) {
            $query->where(function ($q) use ($userId) {
                $q->where('notifiable_id', $userId)
                  ->orWhereNull('notifiable_id')
                  ->orWhere('notifiable_id', 0);
            });
        }

        $records = $query->take(30)->get();

        if ($records->isEmpty()) {
            $newId = (string) Str::uuid();
            DB::table('notifications')->insert([
                'id' => $newId,
                'type' => 'App\Notifications\WelcomeNotification',
                'notifiable_type' => 'App\Models\User',
                'notifiable_id' => $userId ?? 9,
                'data' => json_encode([
                    'title' => 'Bienvenue sur Foodi !',
                    'message' => 'Découvrez les meilleures enseignes d\'Agadir livrées chez vous en quelques clics.',
                    'type' => 'system',
                ]),
                'read_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $records = DB::table('notifications')->where('id', $newId)->get();
        }

        $notifications = $records->map(function ($row) {
            $data = json_decode($row->data, true) ?: [];
            $createdAt = \Carbon\Carbon::parse($row->created_at);

            return [
                'id' => (string) $row->id,
                'title' => $data['title'] ?? 'Notification Foodi',
                'message' => $data['message'] ?? '',
                'time' => $createdAt->diffForHumans(),
                'isRead' => $row->read_at !== null,
                'type' => $data['type'] ?? 'system',
                'created_at' => $row->created_at,
            ];
        });

        return response()->json($notifications);
    }

    public function markRead(Request $request): JsonResponse
    {
        $id = $request->input('id');
        $all = (bool) $request->input('all', false);
        $userId = $request->input('user_id') ?? $request->header('X-User-Id');

        if ($all) {
            $q = DB::table('notifications');
            if ($userId) {
                $q->where('notifiable_id', $userId);
            }
            $q->whereNull('read_at')->update(['read_at' => now()]);
        } elseif ($id) {
            DB::table('notifications')->where('id', $id)->update(['read_at' => now()]);
        }

        return response()->json(['success' => true, 'message' => 'Notification marquée comme lue']);
    }

    public function store(Request $request): JsonResponse
    {
        $title = $request->input('title', 'Alerte Foodi');
        $message = $request->input('message', '');
        $type = $request->input('type', 'system');
        $userId = $request->input('user_id') ?? $request->header('X-User-Id') ?? 9;

        $id = (string) Str::uuid();

        DB::table('notifications')->insert([
            'id' => $id,
            'type' => 'App\Notifications\GenericNotification',
            'notifiable_type' => 'App\Models\User',
            'notifiable_id' => $userId,
            'data' => json_encode([
                'title' => $title,
                'message' => $message,
                'type' => $type,
            ]),
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'notification' => [
                'id' => $id,
                'title' => $title,
                'message' => $message,
                'time' => 'À l\'instant',
                'isRead' => false,
                'type' => $type,
            ],
        ], 201);
    }
}
