<!-- ═══════════════════════════════════
     PAGE: INTERVENTIONS
════════════════════════════════════ -->
<div id="page-interventions" style="display:none;">
  <div class="page-header">
    <h1>Intervention Flags</h1>
    <p>Students with 3 or more absences this month · <?= date('F Y') ?></p>
  </div>

  <div class="card">
    <div class="card-header">
      <h2>Flagged Students (<?= count($interventions) ?>)</h2>
      <button class="card-action primary" onclick="toast('Intervention report sent to teachers!')">📤 Notify Teachers</button>
    </div>

    <?php if (empty($interventions)): ?>
      <div style="text-align:center;padding:40px;">
        <div style="font-size:32px;margin-bottom:12px;">✅</div>
        <div style="font-size:15px;font-weight:500;color:#1A1F1C;margin-bottom:6px;">No interventions this month</div>
        <div style="font-size:13px;color:#6B7570;">No student has 3 or more absences in <?= date('F') ?>.</div>
      </div>
    <?php else: ?>
    <table>
      <thead>
        <tr><th>#</th><th>Student</th><th>Section</th><th>Teacher</th><th>Absences</th><th>Priority</th></tr>
      </thead>
      <tbody>
        <?php foreach ($interventions as $idx => $int):
          $priority = $int['absence_count'] >= 7 ? 'High' : ($int['absence_count'] >= 5 ? 'Medium' : 'Low');
          $p_cls    = $priority === 'High' ? 'badge-red' : ($priority === 'Medium' ? 'badge-amber' : 'badge-blue');
        ?>
        <tr>
          <td style="color:#9CA3A0;font-size:12px;"><?= $idx + 1 ?></td>
          <td style="font-weight:500;"><?= htmlspecialchars($int['last_name'] . ', ' . $int['first_name']) ?></td>
          <td style="font-size:12px;"><?= htmlspecialchars($int['section_name']) ?></td>
          <td style="font-size:12px;color:#6B7570;"><?= htmlspecialchars($int['teacher_name'] ?? '—') ?></td>
          <td>
            <span style="font-weight:600;font-size:14px;color:#C0392B;"><?= $int['absence_count'] ?></span>
            <span style="font-size:11px;color:#9CA3A0;"> absences</span>
          </td>
          <td><span class="badge <?= $p_cls ?>"><?= $priority ?></span></td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
    <?php endif; ?>
  </div>
</div>
