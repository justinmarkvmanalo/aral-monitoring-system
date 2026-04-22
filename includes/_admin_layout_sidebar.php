<!-- SIDEBAR -->
<aside class="sidebar">
  <div class="sidebar-section">Overview</div>
  <div class="nav-item active" onclick="navigate('overview',this)">
    <span class="icon">🏠</span> Dashboard
  </div>

  <div class="sidebar-section">Management</div>
  <div class="nav-item" onclick="navigate('teachers',this)">
    <span class="icon">👩‍🏫</span> Teachers
    <span class="nav-count"><?= count($teachers) ?></span>
  </div>
  <div class="nav-item" onclick="navigate('sections',this)">
    <span class="icon">🏫</span> Sections
    <span class="nav-count"><?= count($sections) ?></span>
  </div>

  <div class="sidebar-section">Monitoring</div>
  <div class="nav-item" onclick="navigate('attendance',this)">
    <span class="icon">📋</span> Attendance
  </div>
  <div class="nav-item" onclick="navigate('interventions',this)">
    <span class="icon">⚠️</span> Interventions
    <?php if (count($interventions) > 0): ?>
      <span class="nav-count alert"><?= count($interventions) ?></span>
    <?php endif; ?>
  </div>

  <div class="sidebar-section">Communication</div>
  <div class="nav-item" onclick="navigate('announcements',this)">
    <span class="icon">📢</span> Announcements
  </div>

  <div class="sidebar-section">Reports</div>
  <div class="nav-item" onclick="navigate('reports',this)">
    <span class="icon">📊</span> Reports
  </div>
</aside>
