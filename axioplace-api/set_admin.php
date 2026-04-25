<?php
$user = App\Models\User::where('email', 'meschacboudimbou040@gmail.com')->first();
if ($user) {
    $user->role = 'admin';
    $user->save();
    echo "OK: " . $user->email . " is now " . $user->role . "\n";
} else {
    echo "User not found\n";
}
