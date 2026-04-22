<?php
session_start();
if (isset($_SESSION['admin_id'])) {
    header("Location: admin_dashboard.php");
    exit;
}
include 'conn.php';

$error = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $email    = trim($_POST["email"]    ?? "");
    $password = trim($_POST["password"] ?? "");

    if (!$email || !$password) {
        $error = "Please enter your email and password.";
    } else {
        $stmt = $conn->prepare("SELECT id, name, initials, password FROM admins WHERE email = ? LIMIT 1");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $stmt->store_result();
        $stmt->bind_result($id, $name, $initials, $hash);
        $stmt->fetch();

        if ($stmt->num_rows === 0 || !password_verify($password, $hash)) {
            $error = "Invalid email or password.";
        } else {
            $_SESSION['admin_id']       = $id;
            $_SESSION['admin_name']     = $name;
            $_SESSION['admin_initials'] = $initials ?? strtoupper(substr($name, 0, 2));
            $stmt->close();
            $conn->close();
            header("Location: admin_dashboard.php");
            exit;
        }
        $stmt->close();
        $conn->close();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Admin Login — ARAL Monitor</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --accent:     #1D4ED8;
      --accent-mid: #1E40AF;
      --bg:         #F4F6F3;
      --card:       #FFFFFF;
      --text:       #1A1F1C;
      --muted:      #6B7570;
      --border:     #DDE3DF;
      --danger:     #C0392B;
      --danger-bg:  #FCECEA;
      --radius:     14px;
    }
    body {
      font-family: 'DM Sans', sans-serif;
      background: var(--bg);
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      padding: 24px; position: relative; overflow: hidden;
    }
    body::before {
      content: ''; position: fixed; inset: 0; pointer-events: none;
      background-image:
        radial-gradient(circle at 20% 20%, rgba(29,78,216,0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(30,64,175,0.06) 0%, transparent 50%);
    }
    .wrap { width: 100%; max-width: 420px; position: relative; z-index: 1; }

    /* Back link */
    .back-link {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 13px; color: var(--muted); text-decoration: none;
      margin-bottom: 20px; transition: color 0.15s;
    }
    .back-link:hover { color: var(--text); }

    /* Brand */
    .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; justify-content: center; }
    .brand-dot {
      width: 40px; height: 40px; background: var(--accent); border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-family: 'DM Serif Display', serif; font-size: 20px; color: #fff;
      box-shadow: 0 4px 12px rgba(29,78,216,0.30);
    }
    .brand-name { font-family: 'DM Serif Display', serif; font-size: 22px; color: var(--text); }
    .brand-name span { color: var(--accent); }

    /* Admin tag */
    .admin-tag {
      display: flex; justify-content: center; margin-bottom: 28px;
    }
    .admin-tag span {
      font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px;
      background: #FEF3C7; color: #92400E;
      letter-spacing: 0.06em; text-transform: uppercase;
    }

    .card {
      background: var(--card); border-radius: var(--radius);
      padding: 36px 36px 32px; border: 1px solid var(--border);
      box-shadow: 0 2px 24px rgba(0,0,0,0.06);
    }
    .card-title { font-size: 20px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
    .card-sub   { font-size: 13.5px; color: var(--muted); margin-bottom: 28px; }
    .alert {
      padding: 11px 14px; border-radius: 8px; font-size: 13.5px;
      margin-bottom: 20px; line-height: 1.5;
      background: var(--danger-bg); color: var(--danger); border: 1px solid #f5c6c2;
    }
    .field { margin-bottom: 18px; }
    .field label {
      display: block; font-size: 12.5px; font-weight: 500; color: var(--text);
      margin-bottom: 6px; letter-spacing: 0.02em; text-transform: uppercase;
    }
    .field input {
      width: 100%; height: 44px; border: 1.5px solid var(--border); border-radius: 9px;
      padding: 0 14px; font-size: 14px; font-family: 'DM Sans', sans-serif;
      color: var(--text); background: #FAFBFA;
      transition: border-color 0.18s, box-shadow 0.18s; outline: none;
    }
    .field input:focus {
      border-color: var(--accent); background: #fff;
      box-shadow: 0 0 0 3px rgba(29,78,216,0.12);
    }
    .field input::placeholder { color: #B0B9B4; }
    .btn {
      width: 100%; height: 48px; background: var(--accent); color: #fff;
      border: none; border-radius: 10px; font-size: 15px; font-weight: 600;
      font-family: 'DM Sans', sans-serif; cursor: pointer;
      transition: background 0.18s, transform 0.1s, box-shadow 0.18s;
      box-shadow: 0 3px 12px rgba(29,78,216,0.25); margin-top: 6px;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .btn:hover  { background: var(--accent-mid); }
    .btn:active { transform: scale(0.98); }
    .divider { text-align: center; font-size: 12px; color: var(--muted); margin: 22px 0 0; }
    .divider a { color: var(--accent-mid); font-weight: 500; text-decoration: none; }
    .divider a:hover { text-decoration: underline; }
  </style>
</head>
<body>
<div class="wrap">

  <!-- Back to role selector -->
  <a href="index.php" class="back-link">
    ← Back to role selection
  </a>

  <!-- Brand -->
  <div class="brand">
    <div class="brand-dot">A</div>
    <div class="brand-name">ARAL <span>Monitor</span></div>
  </div>

  <!-- Admin badge -->
  <div class="admin-tag"><span>🏫 Admin Portal</span></div>

  <div class="card">
    <div class="card-title">Admin Sign In</div>
    <div class="card-sub">Sign in to your administrator account</div>

    <?php if (!empty($error)): ?>
      <div class="alert">⚠️ <?= htmlspecialchars($error) ?></div>
    <?php endif; ?>

    <form method="POST" action="" novalidate>
      <div class="field">
        <label for="email">Email Address</label>
        <input type="email" id="email" name="email"
          placeholder="admin@school.edu.ph"
          value="<?= htmlspecialchars($_POST['email'] ?? '') ?>" required/>
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input type="password" id="password" name="password"
          placeholder="Your password" required/>
      </div>
      <button type="submit" class="btn">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10 17 15 12 10 7"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
        Sign In as Admin
      </button>
    </form>

    <div class="divider"><a href="index.php">← Return to role selection</a></div>
  </div>

</div>
</body>
</html>
