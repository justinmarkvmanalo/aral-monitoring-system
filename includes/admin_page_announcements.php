<!-- ═══════════════════════════════════
     PAGE: ANNOUNCEMENTS
════════════════════════════════════ -->
<div id="page-announcements" style="display:none;">
  <div class="page-header">
    <h1>Announcements</h1>
    <p>Post school-wide announcements for teachers</p>
  </div>

  <?php if (!empty($success_msg)): ?>
    <div class="flash-ok">✓ <?= htmlspecialchars($success_msg) ?></div>
  <?php endif; ?>

  <div class="card">
    <div class="card-header">
      <h2>All Announcements (<?= count($announcements) ?>)</h2>
      <button class="card-action primary" onclick="openModal('modal-add-announcement')">➕ New Announcement</button>
    </div>

    <?php if (empty($announcements)): ?>
      <div style="text-align:center;padding:32px;color:#9CA3A0;font-size:13px;">
        No announcements yet. Click <strong>New Announcement</strong> to post one.
      </div>
    <?php else: ?>
      <?php foreach ($announcements as $ann): ?>
      <div class="ann-item">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
          <div>
            <div class="ann-title">📢 <?= htmlspecialchars($ann['title']) ?></div>
            <div class="ann-msg"><?= nl2br(htmlspecialchars($ann['message'])) ?></div>
            <div class="ann-date"><?= date('F j, Y · g:i A', strtotime($ann['created_at'])) ?></div>
          </div>
          <button class="card-action danger" style="font-size:11px;padding:3px 10px;flex-shrink:0;"
            onclick="deleteAnnouncement(<?= $ann['id'] ?>, this)">
            🗑
          </button>
        </div>
      </div>
      <?php endforeach; ?>
    <?php endif; ?>
  </div>
</div>
