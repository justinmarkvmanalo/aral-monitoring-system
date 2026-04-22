<?php
include 'conn.php';

$success = "";
$error   = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $full_name = trim($_POST["full_name"] ?? "");
    $initials  = strtoupper(trim($_POST["initials"] ?? ""));
    $email     = trim($_POST["email"] ?? "");
    $password  = $_POST["password"] ?? "";
    $confirm   = $_POST["confirm"] ?? "";

    if (!$full_name || !$initials || !$email || !$password || !$confirm) {
        $error = "All fields are required.";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = "Please enter a valid email address.";
    } elseif (strlen($initials) > 3) {
        $error = "Initials must be 3 characters or fewer.";
    } elseif (strlen($password) < 8) {
        $error = "Password must be at least 8 characters.";
    } elseif ($password !== $confirm) {
        $error = "Passwords do not match.";
    } else {
        // $conn is already open from conn.php — use it directly
        $stmt = $conn->prepare("SELECT id FROM teachers WHERE email = :email LIMIT 1");
        $stmt->execute(['email' => $email]);

        if ($stmt->fetch()) {
            $error = "An account with that email already exists.";
        } else {
            $hash = password_hash($password, PASSWORD_BCRYPT);
            $ins  = $conn->prepare(
                "INSERT INTO teachers (full_name, initials, email, password_hash)
                 VALUES (:full_name, :initials, :email, :password_hash)"
            );
            if ($ins->execute([
                'full_name' => $full_name,
                'initials' => $initials,
                'email' => $email,
                'password_hash' => $hash,
            ])) {
                $success = "Account created successfully! You can now <a href='login.php'>log in</a>.";
            } else {
                $error = "Insert failed.";
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Create Teacher Account — ARAL Monitor</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --accent:      #1D9E75;
      --accent-mid:  #0F6E56;
      --bg:          #F4F6F3;
      --card:        #FFFFFF;
      --text:        #1A1F1C;
      --muted:       #6B7570;
      --border:      #DDE3DF;
      --danger:      #C0392B;
      --danger-bg:   #FCECEA;
      --success:     #0F6E56;
      --success-bg:  #E1F5EE;
      --radius:      14px;
    }
    body {
      font-family: 'DM Sans', sans-serif;
      background: var(--bg);
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      padding: 24px; position: relative; overflow: hidden;
    }
    body::before {
      content: ''; position: fixed; inset: 0;
      background-image:
        radial-gradient(circle at 20% 20%, rgba(29,158,117,0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(15,110,86,0.06) 0%, transparent 50%);
      pointer-events: none;
    }
    .wrap { width: 100%; max-width: 460px; position: relative; z-index: 1; }
    .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; justify-content: center; }
    .brand-dot {
      width: 40px; height: 40px; background: var(--accent); border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-family: 'DM Serif Display', serif; font-size: 20px; color: #fff;
      box-shadow: 0 4px 12px rgba(29,158,117,0.3);
    }
    .brand-name { font-family: 'DM Serif Display', serif; font-size: 22px; color: var(--text); letter-spacing: -0.3px; }
    .brand-name span { color: var(--accent); }
    .card {
      background: var(--card); border-radius: var(--radius);
      padding: 36px 36px 32px; border: 1px solid var(--border);
      box-shadow: 0 2px 24px rgba(0,0,0,0.06);
    }
    .card-title { font-size: 20px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
    .card-sub { font-size: 13.5px; color: var(--muted); margin-bottom: 28px; }
    .alert { padding: 11px 14px; border-radius: 8px; font-size: 13.5px; margin-bottom: 20px; line-height: 1.5; }
    .alert-error   { background: var(--danger-bg); color: var(--danger); border: 1px solid #f5c6c2; }
    .alert-success { background: var(--success-bg); color: var(--success); border: 1px solid #9FE1CB; }
    .alert-success a { color: var(--accent-mid); font-weight: 500; }
    .row-2 { display: grid; grid-template-columns: 1fr auto; gap: 12px; }
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
    .field input:focus { border-color: var(--accent); background: #fff; box-shadow: 0 0 0 3px rgba(29,158,117,0.12); }
    .field input::placeholder { color: #B0B9B4; }
    .field .hint { font-size: 11.5px; color: var(--muted); margin-top: 5px; }
    .field-initials input { text-transform: uppercase; letter-spacing: 2px; text-align: center; }
    .pw-bar-wrap { height: 3px; background: var(--border); border-radius: 2px; margin-top: 8px; overflow: hidden; }
    .pw-bar { height: 100%; border-radius: 2px; width: 0%; transition: width 0.3s, background 0.3s; }
    .btn {
      width: 100%; height: 48px; background: var(--accent); color: #fff;
      border: none; border-radius: 10px; font-size: 15px; font-weight: 600;
      font-family: 'DM Sans', sans-serif; cursor: pointer;
      transition: background 0.18s, transform 0.1s, box-shadow 0.18s;
      box-shadow: 0 3px 12px rgba(29,158,117,0.25); margin-top: 6px;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .btn:hover { background: var(--accent-mid); box-shadow: 0 4px 16px rgba(15,110,86,0.3); }
    .btn:active { transform: scale(0.98); }
    .divider { text-align: center; font-size: 12px; color: var(--muted); margin: 22px 0 0; }
    .divider a { color: var(--accent-mid); font-weight: 500; text-decoration: none; }
    .divider a:hover { text-decoration: underline; }
    @media (max-width: 480px) {
      .card { padding: 28px 20px 24px; }
      .row-2 { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
<div class="wrap">
  <div class="brand">
    <div class="brand-dot">A</div>
    <div class="brand-name">ARAL <span>Monitor</span></div>
  </div>

  <div class="card">
    <div class="card-title">Create Teacher Account</div>
    <div class="card-sub">Register to access the ARAL classroom tracker</div>

    <?php if (!empty($error)): ?>
      <div class="alert alert-error">⚠️ <?= htmlspecialchars($error) ?></div>
    <?php endif; ?>
    <?php if (!empty($success)): ?>
      <div class="alert alert-success">✓ <?= $success ?></div>
    <?php endif; ?>

    <form method="POST" action="" novalidate>
      <div class="row-2">
        <div class="field">
          <label for="full_name">Full Name</label>
          <input type="text" id="full_name" name="full_name"
            placeholder="e.g. Maria Santos"
            value="<?= htmlspecialchars($_POST['full_name'] ?? '') ?>"
            maxlength="100" required />
        </div>
        <div class="field field-initials">
          <label for="initials">Initials</label>
          <input type="text" id="initials" name="initials"
            placeholder="MS"
            value="<?= htmlspecialchars($_POST['initials'] ?? '') ?>"
            maxlength="3" style="width:72px;" required />
        </div>
      </div>

      <div class="field">
        <label for="email">Email Address</label>
        <input type="email" id="email" name="email"
          placeholder="teacher@school.edu.ph"
          value="<?= htmlspecialchars($_POST['email'] ?? '') ?>"
          required />
      </div>

      <div class="field">
        <label for="password">Password</label>
        <input type="password" id="password" name="password"
          placeholder="Minimum 8 characters"
          oninput="checkStrength(this.value)" required />
        <div class="pw-bar-wrap"><div class="pw-bar" id="pw-bar"></div></div>
        <div class="hint" id="pw-hint">Enter a password</div>
      </div>

      <div class="field">
        <label for="confirm">Confirm Password</label>
        <input type="password" id="confirm" name="confirm"
          placeholder="Re-enter your password" required />
      </div>

      <button type="submit" class="btn">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        Create Account
      </button>
    </form>

    <div class="divider">Already have an account? <a href="login.php">Log in here</a></div>
  </div>
</div>

<script>
function checkStrength(val) {
  const bar  = document.getElementById('pw-bar');
  const hint = document.getElementById('pw-hint');
  let score  = 0;
  if (val.length >= 8)           score++;
  if (/[A-Z]/.test(val))         score++;
  if (/[0-9]/.test(val))         score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const levels = [
    { w: '0%',   bg: 'transparent', label: 'Enter a password' },
    { w: '30%',  bg: '#E24B4A',     label: 'Weak' },
    { w: '55%',  bg: '#EF9F27',     label: 'Fair — add uppercase or numbers' },
    { w: '80%',  bg: '#1D9E75',     label: 'Good' },
    { w: '100%', bg: '#0F6E56',     label: 'Strong ✓' },
  ];
  const l = val.length === 0 ? levels[0] : levels[score] || levels[1];
  bar.style.width      = l.w;
  bar.style.background = l.bg;
  hint.textContent     = l.label;
  hint.style.color     = l.bg === 'transparent' ? '#6B7570' : l.bg;
}
</script>
</body>
</html>
