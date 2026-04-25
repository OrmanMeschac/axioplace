<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$user = User::first();
echo "Before cast/forceFill test:\n";
echo "Hash: " . $user->password . "\n";

$raw = 'password123';
$hashed = Hash::make($raw);

echo "Manually hashed: " . $hashed . "\n";

$user->forceFill(['password' => $hashed])->save();
$user->refresh();

echo "After forceFill:\n";
echo "Hash in DB: " . $user->password . "\n";

if (Hash::check($raw, $user->password)) {
    echo "Check MATCHES.\n";
} else {
    echo "Check FAILS. (Double hash occurred!)\n";
}

// Let's test non-hashed assignment:
$user->forceFill(['password' => $raw])->save();
$user->refresh();

echo "After forceFill raw:\n";
echo "Hash in DB: " . $user->password . "\n";

if (Hash::check($raw, $user->password)) {
    echo "Check MATCHES.\n";
} else {
    echo "Check FAILS.\n";
}
