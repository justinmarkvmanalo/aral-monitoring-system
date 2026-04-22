<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>ARAL Monitor</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&display=swap" rel="stylesheet"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'DM Sans', sans-serif;
      background: #F4F6F3;
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
    }
    .wrap { width: 100%; max-width: 420px; text-align: center; }

    /* Brand */
    .brand { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px; }
    .brand-dot {
      width: 44px; height: 44px; background: #1D9E75; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-family: 'DM Serif Display', serif; font-size: 22px; color: #fff;
    }
    .brand-name { font-family: 'DM Serif Display', serif; font-size: 24px; color: #1A1F1C; }
    .brand-name span { color: #1D9E75; }
    .tagline { font-size: 12px; color: #6B7570; margin-bottom: 36px; }

    /* Card */
    .card {
      background: #fff; border-radius: 16px; padding: 36px 32px;
      border: 1px solid #DDE3DF; box-shadow: 0 2px 24px rgba(0,0,0,0.07);
      margin-bottom: 20px;
    }
    .card h2 { font-size: 17px; font-weight: 600; color: #1A1F1C; margin-bottom: 6px; }
    .card p  { font-size: 13px; color: #6B7570; margin-bottom: 28px; }

    /* Buttons */
    .btn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

    .btn {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 10px;
      padding: 24px 12px 20px; border-radius: 12px;
      text-decoration: none; font-family: 'DM Sans', sans-serif;
      border: 2px solid #DDE3DF; background: #FAFBFA;
      transition: all 0.15s ease; cursor: pointer;
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.10); }

    .btn-icon  { font-size: 30px; }
    .btn-label { font-size: 14px; font-weight: 600; color: #1A1F1C; }
    .btn-sub   { font-size: 11px; color: #6B7570; text-align: center; line-height: 1.4; }
    .btn-tag   { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }

    .btn.teacher { border-color: rgba(29,158,117,0.3); }
    .btn.teacher:hover { border-color: #1D9E75; background: #E1F5EE; }
    .btn.teacher .btn-tag { background: #E1F5EE; color: #0F6E56; }

    .btn.admin { border-color: rgba(29,78,216,0.2); }
    .btn.admin:hover { border-color: #1D4ED8; background: #EEF2FF; }
    .btn.admin .btn-tag { background: #EEF2FF; color: #1E40AF; }

    .footer { font-size: 11px; color: #B0B9B4; }
  </style>
</head>
<body>
<div class="wrap">

  <div class="brand">
    <div class="brand-dot">A</div>
    <div class="brand-name">ARAL <span>Monitor</span></div>
  </div>
  <div class="tagline">Attendance &amp; Reading Assessment Learning System · SY 2025–2026</div>

  <div class="card">
    <h2>Who are you signing in as?</h2>
    <p>Select your role to continue.</p>

    <div class="btn-grid">

      <a href="login.php" class="btn teacher">
        <div class="btn-icon">👩‍🏫</div>
        <div class="btn-label">Teacher</div>
        <div class="btn-sub">Manage your class &amp; learners</div>
        <div class="btn-tag">Sign In →</div>
      </a>

      <a href="admin_login.php" class="btn admin">
        <div class="btn-icon">🏫</div>
        <div class="btn-label">Admin</div>
        <div class="btn-sub">Manage teachers &amp; reports</div>
        <div class="btn-tag">Sign In →</div>
      </a>

    </div>
  </div>

  <div class="footer">For authorized school personnel only.</div>

</div>
</body>
</html>
