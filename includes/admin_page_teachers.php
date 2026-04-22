<!-- ═══════════════════════════════════
     PAGE: TEACHERS
════════════════════════════════════ -->
<div id="page-teachers" style="display:none;">
  <div class="page-header">
    <h1>Teacher Management</h1>
    <p>Add, manage, and monitor teacher accounts</p>
  </div>

  <?php if (!empty($success_msg)): ?>
    <div class="flash-ok">✓ <?= htmlspecialchars($success_msg) ?></div>
  <?php endif; ?>
  <?php if (!empty($error_msg) && $open_modal === 'add_teacher'): ?>
    <div class="flash-err">⚠️ <?= htmlspecialchars($error_msg) ?></div>
  <?php endif; ?>

  <div class="card">
    <div class="card-header">
      <h2>All Teachers (<?= count($teachers) ?>)</h2>
      <button class="card-action primary" onclick="openModal('modal-add-teacher')">➕ Add Teacher</button>
    </div>

    <?php if (empty($teachers)): ?>
      <div style="text-align:center;padding:32px;color:#9CA3A0;font-size:13px;">
        No teachers yet. Click <strong>Add Teacher</strong> to get started.
      </div>
    <?php else: ?>
    <div style="overflow-x:auto;">
      <table>
        <thead>
          <tr>
            <th>#</th><th>Teacher</th><th>Email</th><th>Grade</th>
            <th>Section</th><th>Students</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <?php
          $bg_colors  = ['#EEF2FF','#E1F5EE','#FEF3C7','#FCE7F3','#F0FDF4'];
          $txt_colors = ['#1E40AF','#085041','#92400E','#9D174D','#166534'];
          foreach ($teachers as $idx => $t):
          ?>
          <tr id="teacher-row-<?= $t['id'] ?>">
            <td style="color:#9CA3A0;font-size:12px;"><?= $idx + 1 ?></td>
            <td>
              <div style="display:flex;align-items:center;gap:8px;">
                <div class="s-avatar" style="background:<?= $bg_colors[$idx%5] ?>;color:<?= $txt_colors[$idx%5] ?>;font-size:11px;">
                  <?= htmlspecialchars($t['initials']) ?>
                </div>
                <span style="font-weight:500;"><?= htmlspecialchars($t['name']) ?></span>
              </div>
            </td>
            <td style="font-size:12px;color:#6B7570;"><?= htmlspecialchars($t['email']) ?></td>
            <td><span class="badge badge-blue">Gr. <?= htmlspecialchars($t['grade_level'] ?: '—') ?></span></td>
            <td style="font-size:12px;"><?= htmlspecialchars($t['section_name'] ?: '—') ?></td>
            <td style="font-size:13px;font-weight:500;"><?= $t['student_count'] ?></td>
            <td>
              <label class="toggle" title="Toggle active/inactive">
                <input type="checkbox" <?= $t['is_active'] ? 'checked' : '' ?>
                  onchange="toggleTeacher(<?= $t['id'] ?>, this.checked)">
                <span class="toggle-slider"></span>
              </label>
              <span id="status-label-<?= $t['id'] ?>" style="font-size:11px;margin-left:6px;color:<?= $t['is_active'] ? '#3B6D11' : '#9CA3A0' ?>">
                <?= $t['is_active'] ? 'Active' : 'Inactive' ?>
              </span>
            </td>
            <td>
              <button class="card-action danger" style="font-size:11px;padding:3px 10px;"
                onclick="deleteTeacher(<?= $t['id'] ?>, '<?= addslashes(htmlspecialchars($t['name'])) ?>')">
                🗑 Delete
              </button>
            </td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
    <?php endif; ?>
  </div>
</div>
