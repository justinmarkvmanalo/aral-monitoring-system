<!-- TOP NAV -->
<nav class="topnav">
  <div class="nav-logo">
    <div class="dot">A</div>
    ARAL Monitor
    <span class="admin-tag">Admin</span>
  </div>
  <div class="nav-right">
    <span class="nav-badge">SY 2025–2026</span>
    <div class="nav-avatar">
      <?= htmlspecialchars($admin_initials) ?>
      <div class="dropdown">
        <a href="#">👤 <?= htmlspecialchars($admin_name) ?></a>
        <a href="admin_logout.php" class="logout">🚪 Log out</a>
      </div>
    </div>
  </div>
</nav>
