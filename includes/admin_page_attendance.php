<!-- ═══════════════════════════════════
     PAGE: ATTENDANCE (SCHOOL-WIDE)
════════════════════════════════════ -->
<div id="page-attendance" style="display:none;">
  <div class="page-header">
    <h1>School-Wide Attendance</h1>
    <p>Today's attendance summary across all sections · <?= date('F j, Y') ?></p>
  </div>

  <!-- Summary Stats -->
  <div class="stat-grid">
    <div class="stat-card">
      <div class="label">Present</div>
      <div class="value"><?= $att_present ?></div>
      <span class="badge badge-green">today</span>
    </div>
    <div class="stat-card">
      <div class="label">Absent</div>
      <div class="value"><?= $att_absent ?></div>
      <?php if ($att_absent > 0): ?>
        <span class="badge badge-red">needs follow-up</span>
      <?php else: ?>
        <span class="badge badge-green">none</span>
      <?php endif; ?>
    </div>
    <div class="stat-card">
      <div class="label">Late</div>
      <div class="value"><?= $att_late ?></div>
      <span class="badge badge-amber">today</span>
    </div>
    <div class="stat-card">
      <div class="label">Not Marked</div>
      <div class="value"><?= $att_unmarked ?></div>
      <div class="sub">out of <?= $total_students ?></div>
    </div>
  </div>

  <!-- Per-Section Breakdown -->
  <div class="card">
    <div class="card-header">
      <h2>Per-Section Breakdown</h2>
      <span style="font-size:12px;color:#9CA3A0;"><?= date('l, F j, Y') ?></span>
    </div>
    <?php if (empty($section_att)): ?>
      <div style="text-align:center;padding:24px;color:#9CA3A0;font-size:13px;">No attendance data yet.</div>
    <?php else: ?>
    <table>
      <thead>
        <tr><th>Section</th><th>Grade</th><th>Present</th><th>Absent</th><th>Late</th><th>Not Marked</th><th>Total</th><th>Attendance Rate</th></tr>
      </thead>
      <tbody>
        <?php foreach ($section_att as $sa):
          $marked    = $sa['present'] + $sa['absent'] + $sa['late'];
          $unmarked  = max(0, $sa['total'] - $marked);
          $rate      = $sa['total'] > 0 ? round($sa['present'] / $sa['total'] * 100) : 0;
          $rate_cls  = $rate >= 90 ? 'green' : ($rate >= 75 ? 'amber' : 'red');
          $badge_cls = $rate >= 90 ? 'badge-green' : ($rate >= 75 ? 'badge-amber' : 'badge-red');
        ?>
        <tr>
          <td style="font-weight:500;"><?= htmlspecialchars($sa['section_name']) ?></td>
          <td><span class="badge badge-blue">Gr. <?= htmlspecialchars($sa['grade_level']) ?></span></td>
          <td><span class="badge badge-green"><?= $sa['present'] ?></span></td>
          <td><span class="badge badge-red"><?= $sa['absent'] ?></span></td>
          <td><span class="badge badge-amber"><?= $sa['late'] ?></span></td>
          <td style="color:#9CA3A0;font-size:12px;"><?= $unmarked ?></td>
          <td style="color:#9CA3A0;font-size:12px;"><?= $sa['total'] ?></td>
          <td>
            <div style="display:flex;align-items:center;gap:8px;">
              <div class="prog-bar"><div class="prog-fill <?= $rate_cls ?>" style="width:<?= $rate ?>%"></div></div>
              <span class="badge <?= $badge_cls ?>" style="margin-top:0;"><?= $sa['total'] > 0 ? $rate.'%' : '—' ?></span>
            </div>
          </td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
    <?php endif; ?>
  </div>
</div>
