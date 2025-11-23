<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Testing\Fluent\Concerns\Has;

class ProfileController extends Controller
{
    /**
     * Update authenticated user's profile
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = Validator::make($request->all(),[
            'name' => 'sometimes|required|string|max:255',
            'nickname' => 'sometimes|required|string|max:50|unique:users,nickname,'.$user->id,
            'email' => 'sometimes|required|email|unique:users,email,'.$user->id,
            'password' => 'nullable|string|min:3',
            'photo_avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if($validated->fails()){
            return response()->json(['errors' => $validated->errors()],422);
        }

        if($request->has('name')) $user->name = $request->name;
        if($request->has('email')) $user->email = $request->email;
        if($request->has('nickname')) $user->nickname = $request->nickname;
        if($request->filled('password')){
            $user->password = Hash::make($request->password);
        } 


        if($request->hasFile('photo_avatar')){
            if($user->photo_avatar_filename){
                Storage::delete('public/avatars/' . $user->photo_avatar_filename);
            }

            $photo = $request->file('photo_avatar');
            $photo_filename = time().'_'.$photo->getClientOriginalName();
            $photo->storeAs('public/avatars', $photo_filename);
            $user->photo_avatar_filename = $photo_filename;
        }

        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user,
        ],200);
    }

    /**
     * Delete or soft delete user account
     */
    public function destroy(Request $request)
    {
        $user = $request->user();

        if($user->type === 'A'){
            return response()->json(['message' => 'Admins can not delete their own account'],403); 
        }

        $validated = Validator::make($request->all(),['confirmation' => 'required|string']);
        if($validated->fails()){
            return response()->json(['errors' => $validated->errors()],422);
        }

        $confirmation = Hash::check($request->confirmation,$user->password);
        if(!$confirmation){
            return response()->json(['message' => 'Invalid confirmation'],401);
        }

        $hasActivity = $user->transactions()->exists() || $user->games()->exists();

        if ($hasActivity) {
            $user->delete();
            $user->update(['deleted_at' => now()]);
            $message = 'Account soft-deleted successfully';
        } else {
            //$user->delete();
            if($user->photo_avatar_filename){
                Storage::delete('public/avatars/' . $user->photo_avatar_filename );
            }
            $user->forceDelete();
            $message = 'Account permanently deleted';
        }

        $user->tokens()->delete();

        return response()->json([
            'message' => $message,
        ],200);
    }
}
