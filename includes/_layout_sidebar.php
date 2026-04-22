<!-- SIDEBAR -->
<aside class="sidebar">
  <div class="sidebar-section">Overview</div>
  <div class="nav-item active" onclick="navigate('dashboard',this)">
    <span class="icon">🏠</span> Dashboard
  </div>
  <div class="nav-item" onclick="navigate('attendance',this)">
    <span class="icon">📋</span> Attendance
    <span class="nav-count" id="nav-student-count"><?= $total_students ?></span>
  </div>

  <div class="sidebar-section">Trackers</div>
  <div class="nav-item" onclick="navigate('reading',this)">
    <span class="icon">📖</span> Reading Progress
  </div>
  <div class="nav-item" onclick="navigate('numeracy',this)">
    <span class="icon">🔢</span> Numeracy Practice
  </div>
  <div class="nav-item" onclick="navigate('science',this)">
    <span class="icon">🔬</span> Science Check
  </div>

  <div class="sidebar-section">Reports</div>
  <div class="nav-item" onclick="navigate('intervention',this)">
    <span class="icon">⚠️</span> Intervention
    <span class="nav-count alert">5</span>
  </div>
  <div class="nav-item" onclick="navigate('reports',this)">
    <span class="icon">📊</span> Auto Reports
  </div>

  <div class="sidebar-section">Settings</div>
  <div class="nav-item" onclick="navigate('announcements',this)">
    <span class="icon">📢</span> Announcements
  </div>
  <div class="nav-item" onclick="window.location='setup_section.php'">
    <span class="icon">⚙️</span> Class Setup
  </div>
</aside>
