<!-- ═══════════════════════════════════
     PAGE: DASHBOARD OVERVIEW
════════════════════════════════════ -->
<div id="page-dashboard">
  <div class="page-header">
    <h1>Teacher Dashboard</h1>
    <p><?= date('F j, Y') ?> · Grade <?= $grade_level ?> – <?= htmlspecialchars($section_name ?? 'No section assigned') ?> · Welcome, <?= htmlspecialchars($teacher_name) ?>!</p>
  </div>

  <div class="stat-grid">
    <div class="stat-card">
      <div class="label">Total Learners</div>
      <div class="value"><?= $total_students ?></div>
      <div class="sub">enrolled this SY</div>
    </div>
    <div class="stat-card">
      <div class="label">Present Today</div>
      <div class="value"><?= $present_today ?></div>
      <span class="badge badge-green">out of <?= $total_students ?></span>
    </div>
    <div class="stat-card">
      <div class="label">Absent Today</div>
      <div class="value"><?= $absent_today ?></div>
      <?php if ($absent_today > 0): ?>
        <span class="badge badge-red">needs follow-up</span>
      <?php else: ?>
        <span class="badge badge-green">All present</span>
      <?php endif; ?>
    </div>
    <div class="stat-card">
      <div class="label">Late Today</div>
      <div class="value"><?= $late_today ?></div>
      <div class="sub">this session</div>
    </div>
  </div>

  <div class="card">
    <div class="card-header"><h2>Quick Actions</h2></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <button class="card-action primary" onclick="navigate('attendance',document.querySelector('[onclick*=attendance]'))">📋 Mark Attendance</button>
      <button class="card-action primary" onclick="openAddStudent()">➕ Add New Student</button>
      <button class="card-action" onclick="navigate('reading',document.querySelector('[onclick*=reading]'))">📖 Reading Tracker</button>
      <button class="card-action" onclick="navigate('intervention',document.querySelector('[onclick*=intervention]'))">⚠️ View Interventions</button>
    </div>
  </div>

  <?php if ($total_students === 0): ?>
  <div class="card" style="text-align:center;padding:40px;border:1.5px dashed #DDE3DF;">
    <div style="font-size:32px;margin-bottom:12px;">🎒</div>
    <div style="font-size:15px;font-weight:500;color:#1A1F1C;margin-bottom:6px;">No students yet</div>
    <div style="font-size:13px;color:#6B7570;margin-bottom:16px;">Go to Attendance to add your first student.</div>
    <button class="card-action primary" onclick="openAddStudent()">➕ Add First Student</button>
  </div>
  <?php endif; ?>
</div>
