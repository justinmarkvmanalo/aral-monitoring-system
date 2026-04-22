<?php
include __DIR__ . '/conn.php';

$name     = 'School Admin';
$initials = 'SA';
$email    = 'admin@school.edu.ph';
$password = 'Admin@1234';

$hash = password_hash($password, PASSWORD_BCRYPT);

$del = $conn->prepare("DELETE FROM admins WHERE email = :email");
$del->execute(['email' => $email]);

$ins = $conn->prepare(
    "INSERT INTO admins (name, initials, email, password, is_active, created_at)
     VALUES (:name, :initials, :email, :password, true, CURRENT_TIMESTAMP)"
);

if ($ins->execute([
    'name' => $name,
    'initials' => $initials,
    'email' => $email,
    'password' => $hash,
])) {
    echo "<h2 style='font-family:sans-serif;color:green;padding:20px;'>
            Admin account created successfully.<br><br>
            <span style='font-size:15px;color:#333;'>
              Email: <strong>{$email}</strong><br>
              Password: <strong>{$password}</strong><br><br>
              <span style='color:red;'>Delete this file from your server after using it.</span><br><br>
              <a href='admin_login.php'>Go to Admin Login</a>
            </span>
          </h2>";
} else {
    echo "<h2 style='font-family:sans-serif;color:red;padding:20px;'>Admin creation failed.</h2>";
}
