<!-- ═══════════════════════════════════
     PAGE: SECTIONS
════════════════════════════════════ -->
<div id="page-sections" style="display:none;">
  <div class="page-header">
    <h1>Sections Overview</h1>
    <p>All class sections for this school year</p>
  </div>

  <div class="card">
    <div class="card-header">
      <h2>All Sections (<?= count($sections) ?>)</h2>
    </div>

    <?php if (empty($sections)): ?>
      <div style="text-align:center;padding:32px;color:#9CA3A0;font-size:13px;">
        No sections found. Teachers create their own section via Class Setup.
      </div>
    <?php else: ?>
    <div style="overflow-x:auto;">
      <table>
        <thead>
          <tr><th>#</th><th>Section Name</th><th>Grade Level</th><th>Assigned Teacher</th><th>Students</th></tr>
        </thead>
        <tbody>
          <?php foreach ($sections as $idx => $sec): ?>
          <tr>
            <td style="color:#9CA3A0;font-size:12px;"><?= $idx + 1 ?></td>
            <td style="font-weight:500;"><?= htmlspecialchars($sec['section_name']) ?></td>
            <td><span class="badge badge-blue">Grade <?= htmlspecialchars($sec['grade_level']) ?></span></td>
            <td style="font-size:13px;"><?= htmlspecialchars($sec['teacher_name'] ?? '— Unassigned') ?></td>
            <td>
              <span style="font-weight:500;font-size:13px;"><?= $sec['student_count'] ?></span>
              <span style="font-size:11px;color:#9CA3A0;"> students</span>
            </td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
    <?php endif; ?>
  </div>
</div>
