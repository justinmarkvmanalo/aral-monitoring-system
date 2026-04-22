<?php
/**
 * create_admin.php
 * ─────────────────────────────────────────────────────────────
 * Run this file ONCE in your browser:
 *   https://summarize.xo.je/create_admin.php
 *
 * It will create the admin account with a fresh bcrypt hash.
 * DELETE THIS FILE immediately after running it!
 * ─────────────────────────────────────────────────────────────
 */

include __DIR__ . '/conn.php';

// ── Change these before running ───────────────────────────────
$name     = 'School Admin';
$initials = 'SA';
$email    = 'admin@school.edu.ph';
$password = 'Admin@1234';          // ← change to whatever you want
// ─────────────────────────────────────────────────────────────

$hash = password_hash($password, PASSWORD_BCRYPT);

// Delete existing admin with same email first (clean re-run)
$del = $conn->prepare("DELETE FROM admins WHERE email = ?");
$del->bind_param("s", $email);
$del->execute();
$del->close();

// Insert fresh
$ins = $conn->prepare(
    "INSERT INTO admins (name, initials, email, password, is_active, created_at)
     VALUES (?, ?, ?, ?, 1, NOW())"
);
$ins->bind_param("ssss", $name, $initials, $email, $hash);

if ($ins->execute()) {
    echo "<h2 style='font-family:sans-serif;color:green;padding:20px;'>
            ✅ Admin account created successfully!<br><br>
            <span style='font-size:15px;color:#333;'>
              Email: <strong>{$email}</strong><br>
              Password: <strong>{$password}</strong><br><br>
              <span style='color:red;'>⚠️ DELETE this file (create_admin.php) from your server now!</span><br><br>
              <a href='admin_login.php'>→ Go to Admin Login</a>
            </span>
          </h2>";
} else {
    echo "<h2 style='font-family:sans-serif;color:red;padding:20px;'>
            ❌ Failed: " . htmlspecialchars($ins->error) . "
          </h2>";
}

$ins->close();
$conn->close();
?>
