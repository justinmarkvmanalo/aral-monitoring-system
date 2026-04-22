<!-- ═══════════════════════════════════
     PAGE: OVERVIEW
════════════════════════════════════ -->
<div id="page-overview">
  <div class="page-header">
    <h1>Admin Dashboard</h1>
    <p><?= date('F j, Y') ?> · Welcome back, <?= htmlspecialchars($admin_name) ?>!</p>
  </div>

  <?php if (!empty($success_msg)): ?>
    <div class="flash-ok">✓ <?= htmlspecialchars($success_msg) ?></div>
  <?php endif; ?>
  <?php if (!empty($error_msg)): ?>
    <div class="flash-err">⚠️ <?= htmlspecialchars($error_msg) ?></div>
  <?php endif; ?>

  <!-- Stat Cards -->
  <div class="stat-grid">
    <div class="stat-card">
      <div class="label">Total Teachers</div>
      <div class="value"><?= $total_teachers ?></div>
      <div class="sub">active accounts</div>
    </div>
    <div class="stat-card">
      <div class="label">Total Sections</div>
      <div class="value"><?= $total_sections ?></div>
      <div class="sub">this school year</div>
    </div>
    <div class="stat-card">
      <div class="label">Total Students</div>
      <div class="value"><?= $total_students ?></div>
      <div class="sub">enrolled & active</div>
    </div>
    <div class="stat-card">
      <div class="label">Present Today</div>
      <div class="value"><?= $att_present ?></div>
      <span class="badge badge-green">school-wide</span>
    </div>
    <div class="stat-card">
      <div class="label">Absent Today</div>
      <div class="value"><?= $att_absent ?></div>
      <?php if ($att_absent > 0): ?>
        <span class="badge badge-red">needs follow-up</span>
      <?php else: ?>
        <span class="badge badge-green">none</span>
      <?php endif; ?>
    </div>
    <div class="stat-card">
      <div class="label">Interventions</div>
      <div class="value"><?= count($interventions) ?></div>
      <span class="badge badge-amber">flagged this month</span>
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="card">
    <div class="card-header"><h2>Quick Actions</h2></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <button class="card-action primary" onclick="openModal('modal-add-teacher')">👩‍🏫 Add Teacher</button>
      <button class="card-action primary" onclick="openModal('modal-add-announcement')">📢 Post Announcement</button>
      <button class="card-action" onclick="navigate('attendance',document.querySelector('[onclick*=attendance]'))">📋 View Attendance</button>
      <button class="card-action" onclick="navigate('interventions',document.querySelector('[onclick*=interventions]'))">⚠️ View Interventions</button>
      <button class="card-action" onclick="navigate('reports',document.querySelector('[onclick*=reports]'))">📊 Generate Report</button>
    </div>
  </div>

  <!-- Today's Attendance by Section -->
  <div class="card">
    <div class="card-header">
      <h2>Today's Attendance by Section</h2>
      <span style="font-size:12px;color:#9CA3A0;"><?= date('F j, Y') ?></span>
    </div>
    <?php if (empty($section_att)): ?>
      <div style="text-align:center;padding:24px;color:#9CA3A0;font-size:13px;">No sections found.</div>
    <?php else: ?>
    <table>
      <thead>
        <tr><th>Section</th><th>Grade</th><th>Present</th><th>Absent</th><th>Late</th><th>Total</th><th>Rate</th></tr>
      </thead>
      <tbody>
        <?php foreach ($section_att as $sa):
          $rate = $sa['total'] > 0 ? round($sa['present'] / $sa['total'] * 100) : 0;
          $rate_cls = $rate >= 90 ? 'green' : ($rate >= 75 ? 'amber' : 'red');
        ?>
        <tr>
          <td style="font-weight:500;"><?= htmlspecialchars($sa['section_name']) ?></td>
          <td><span class="badge badge-blue">Gr. <?= htmlspecialchars($sa['grade_level']) ?></span></td>
          <td><span class="badge badge-green"><?= $sa['present'] ?></span></td>
          <td><span class="badge badge-red"><?= $sa['absent'] ?></span></td>
          <td><span class="badge badge-amber"><?= $sa['late'] ?></span></td>
          <td style="color:#9CA3A0;"><?= $sa['total'] ?></td>
          <td>
            <div style="display:flex;align-items:center;gap:8px;">
              <div class="prog-bar"><div class="prog-fill <?= $rate_cls ?>" style="width:<?= $rate ?>%"></div></div>
              <span style="font-size:12px;font-weight:500;"><?= $sa['total'] > 0 ? $rate.'%' : '—' ?></span>
            </div>
          </td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
    <?php endif; ?>
  </div>

  <!-- Recent Announcements Preview -->
  <?php if (!empty($announcements)): ?>
  <div class="card">
    <div class="card-header">
      <h2>Recent Announcements</h2>
      <button class="card-action" onclick="navigate('announcements',document.querySelector('[onclick*=announcements]'))">View All</button>
    </div>
    <?php foreach (array_slice($announcements, 0, 3) as $ann): ?>
    <div class="ann-item">
      <div class="ann-title">📢 <?= htmlspecialchars($ann['title']) ?></div>
      <div class="ann-msg"><?= htmlspecialchars(substr($ann['message'], 0, 100)) ?><?= strlen($ann['message']) > 100 ? '…' : '' ?></div>
      <div class="ann-date"><?= date('M j, Y · g:i A', strtotime($ann['created_at'])) ?></div>
    </div>
    <?php endforeach; ?>
  </div>
  <?php endif; ?>
</div>
