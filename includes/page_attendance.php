<!-- ═══════════════════════════════════
     PAGE: ATTENDANCE
════════════════════════════════════ -->
<div id="page-attendance" style="display:none;">
  <div class="page-header">
    <h1>Attendance Monitoring</h1>
    <p>Week of <?= date('F j', strtotime($week_dates[0] ?? 'monday this week')) ?>–<?= date('j, Y', strtotime($week_dates[4] ?? 'friday this week')) ?> · Click a cell to cycle: <strong>– → P → A → L → –</strong></p>
  </div>

  <?php if (!empty($add_success)): ?>
    <div style="padding:11px 14px;border-radius:8px;font-size:13.5px;margin-bottom:14px;background:#E1F5EE;color:#0F6E56;border:1px solid #9FE1CB;">
      ✓ <?= htmlspecialchars($add_success) ?>
    </div>
  <?php endif; ?>
  <?php if (!empty($add_error)): ?>
    <div style="padding:11px 14px;border-radius:8px;font-size:13.5px;margin-bottom:14px;background:#FCECEA;color:#C0392B;border:1px solid #f5c6c2;">
      ⚠️ <?= htmlspecialchars($add_error) ?>
    </div>
  <?php endif; ?>

  <div class="card">
    <div class="card-header">
      <h2>Class List — <?= htmlspecialchars($section_name ?? '') ?> (<?= $total_students ?> students)</h2>
      <div style="display:flex;gap:8px;">
        <button class="card-action primary" onclick="openAddStudent()">➕ Add Student</button>
        <button class="card-action" onclick="toast('Attendance report generated!')">📄 Report</button>
      </div>
    </div>

    <?php if (empty($students)): ?>
      <div style="text-align:center;padding:32px;color:#9CA3A0;font-size:13px;">
        No students enrolled yet. Click <strong>Add Student</strong> to get started.
      </div>
    <?php else: ?>
    <div style="overflow-x:auto;">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Learner</th>
            <th>LRN</th>
            <th>Mon<br><small style="font-weight:400;text-transform:none;"><?= date('M j', strtotime($week_dates[0])) ?></small></th>
            <th>Tue<br><small style="font-weight:400;text-transform:none;"><?= date('M j', strtotime($week_dates[1])) ?></small></th>
            <th>Wed<br><small style="font-weight:400;text-transform:none;"><?= date('M j', strtotime($week_dates[2])) ?></small></th>
            <th>Thu<br><small style="font-weight:400;text-transform:none;"><?= date('M j', strtotime($week_dates[3])) ?></small></th>
            <th>Fri<br><small style="font-weight:400;text-transform:none;"><?= date('M j', strtotime($week_dates[4])) ?></small></th>
            <th>Rate</th>
          </tr>
        </thead>
        <tbody>
          <?php
          $bg_colors  = ['#E1F5EE','#EAF3DE','#E6F1FB','#FAEEDA','#FCEBEB'];
          $txt_colors = ['#085041','#3B6D11','#0C447C','#633806','#791F1F'];
          foreach ($students as $idx => $s):
            $att      = $s['attendance'];
            $present  = count(array_filter($att, fn($x) => $x === 'P'));
            $marked   = count(array_filter($att, fn($x) => $x !== ''));
            $rate     = $marked > 0 ? round($present / $marked * 100) : 0;
            $rate_cls = $rate >= 90 ? 'badge-green' : ($rate >= 75 ? 'badge-amber' : 'badge-red');
          ?>
          <tr>
            <td style="color:#9CA3A0;font-size:12px;"><?= $idx + 1 ?></td>
            <td>
              <div style="display:flex;align-items:center;gap:8px;">
                <div class="s-avatar" style="background:<?= $bg_colors[$idx % 5] ?>;color:<?= $txt_colors[$idx % 5] ?>;font-size:11px;">
                  <?= htmlspecialchars($s['initials']) ?>
                </div>
                <div style="font-weight:500;font-size:13px;"><?= htmlspecialchars($s['last_name'] . ', ' . $s['first_name']) ?></div>
              </div>
            </td>
            <td style="font-size:12px;color:#9CA3A0;"><?= htmlspecialchars($s['lrn'] ?? '—') ?></td>

            <?php foreach ($att as $di => $status):
              $date       = $s['week_dates'][$di];
              $safeStatus = htmlspecialchars($status, ENT_QUOTES);
              $lbl        = $status ?: '–';
            ?>
            <td>
              <span class="att-badge att-<?= $safeStatus ?>"
                data-student="<?= (int)$s['id'] ?>"
                data-date="<?= htmlspecialchars($date) ?>"
                data-status="<?= $safeStatus ?>"
                onclick="cycleAtt(event)">
                <?= htmlspecialchars($lbl) ?>
              </span>
            </td>
            <?php endforeach; ?>

            <td>
              <span class="badge <?= $marked > 0 ? $rate_cls : '' ?>" style="font-size:11px;">
                <?= $marked > 0 ? $rate . '%' : '—' ?>
              </span>
            </td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
    <?php endif; ?>
  </div>

  <!-- Legend -->
  <div class="card" style="padding:12px 18px;">
    <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;font-size:12px;color:#6B7570;">
      <span style="font-weight:500;">Legend:</span>
      <span><span class="att-badge att-P" style="cursor:default;">P</span> Present</span>
      <span><span class="att-badge att-A" style="cursor:default;">A</span> Absent</span>
      <span><span class="att-badge att-L" style="cursor:default;">L</span> Late</span>
      <span><span class="att-badge att-" style="cursor:default;">–</span> Not marked</span>
    </div>
  </div>

  <div class="stat-grid">
    <div class="stat-card"><div class="label">Present Today</div><div class="value"><?= $present_today ?></div><div class="sub">out of <?= $total_students ?></div></div>
    <div class="stat-card"><div class="label">Absent Today</div><div class="value"><?= $absent_today ?></div><?php if($absent_today>0): ?><span class="badge badge-red">needs follow-up</span><?php endif; ?></div>
    <div class="stat-card"><div class="label">Late Today</div><div class="value"><?= $late_today ?></div><div class="sub">this session</div></div>
    <div class="stat-card"><div class="label">Total Students</div><div class="value"><?= $total_students ?></div><div class="sub">enrolled</div></div>
  </div>
</div>
