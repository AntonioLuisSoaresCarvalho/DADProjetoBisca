<?php

namespace App\Http\Controllers;


use App\Models\CoinTransaction;
use App\Models\CoinTransactionType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Registration of a new user
     */
    public function register(Request $request)
    {

        $validated = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'nickname' => 'required|string|max:50|unique:users,nickname',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:3',
            'photo_avatar' => 'nullable|image|mimes_jpeg,png,jpg,gif|max:2048',
        ]);

        if($validated->fails()){
            return response()->json([
                'message' => 'Validation Error',
                'errors' => $validated->errors()
            ], 422);
        }

        $photo_filename = null;
        if($request->hasFile('photo_avatar')){
            $photo = $request->file('photo_avatar');
            $photo_filename = time().'_'.$photo->getClientOriginalName();
            $photo->storeAs('public/avatars', $photo_filename);
        }

        $user = User::create([
            'name' => $request->name,
            'nickname' => $request->nickname,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'type' => 'P',
            'coins_balance' => 10, // bonus
            'photo_avatar_filename' => $photo_filename,
            'blocked' => false
        ]);

        $bonus = CoinTransactionType::where('name','Bonus')->first();
        if($bonus){
            CoinTransaction::create([
                'transaction_datetime' => now(),
                'user_id' => $user->id,
                'coin_transaction_type_id' => $bonus->id,
                'coins' => 10

            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully',
            'token' => $token,
            'user' => $user,
        ], 201);
    }

    /**
     * Login of user
     */
    public function login(Request $request)
    {

        $credentials = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:3',
        ]);

        if($credentials->fails()){
            return response()->json([
                'message' => 'Validation Error',
                'errors' => $credentials->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid Credentials'
            ],401);
        }

        if ($user->blocked) {
            return response()->json(['message' => 'User is blocked.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'user' => $user,
        ],200);
    }

    /**
     * Logout of user
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ],200);
    }

    /**
     * Show authenticated user
     */
    public function show(Request $request){
        return response()->json([
            'user' => $request->user()
        ],200);
    }

    public function getUserById($id)
    {
        $user = User::withTrashed()
            ->select('id', 'nickname', 'name', 'photo_avatar_filename', 'type')
            ->findOrFail($id);

        return response()->json(['data' => $user]);
    }
}
