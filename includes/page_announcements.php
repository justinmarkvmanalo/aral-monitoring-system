<!-- ═══════════════════════════════════
     PAGE: ANNOUNCEMENTS (Teacher View)
════════════════════════════════════ -->
<div id="page-announcements" style="display:none;">
  <div class="page-header">
    <h1>📢 Announcements</h1>
    <p>School-wide announcements from the administrator</p>
  </div>

  <?php
  // Fetch announcements — open a fresh connection since $conn may be closed
  $ann_conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
  $ann_list = [];
  if (!$ann_conn->connect_error) {
      $ann_q = $ann_conn->query(
          "SELECT title, message, created_at FROM announcements ORDER BY created_at DESC LIMIT 30"
      );
      if ($ann_q) while ($row = $ann_q->fetch_assoc()) $ann_list[] = $row;
      $ann_conn->close();
  }
  ?>

  <?php if (empty($ann_list)): ?>
    <div class="ann-empty">
      <div style="font-size:48px;margin-bottom:12px;">📭</div>
      <div style="font-weight:600;color:var(--text);margin-bottom:4px;">No announcements yet</div>
      <div style="font-size:13px;color:var(--muted);">Check back later for updates from your administrator.</div>
    </div>
  <?php else: ?>
    <div class="ann-list">
      <?php foreach ($ann_list as $i => $ann): ?>
      <div class="ann-card <?= $i === 0 ? 'ann-card--latest' : '' ?>">
        <?php if ($i === 0): ?>
          <span class="ann-badge">Latest</span>
        <?php endif; ?>
        <div class="ann-card-title">📢 <?= htmlspecialchars($ann['title']) ?></div>
        <div class="ann-card-msg"><?= nl2br(htmlspecialchars($ann['message'])) ?></div>
        <div class="ann-card-date">
          🕐 <?= date('F j, Y · g:i A', strtotime($ann['created_at'])) ?>
        </div>
      </div>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</div>

<style>
/* ── Announcement page styles ── */
#page-announcements .ann-empty {
  text-align: center;
  padding: 60px 24px;
  background: var(--card);
  border-radius: 14px;
  border: 1px solid var(--border);
  color: var(--muted);
}
#page-announcements .ann-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
#page-announcements .ann-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 22px 24px;
  position: relative;
  transition: box-shadow 0.18s;
}
#page-announcements .ann-card:hover {
  box-shadow: 0 4px 18px rgba(0,0,0,0.08);
}
#page-announcements .ann-card--latest {
  border-color: #1D9E75;
  border-left: 4px solid #1D9E75;
}
#page-announcements .ann-badge {
  position: absolute;
  top: 14px; right: 16px;
  background: #E1F5EE;
  color: #0F6E56;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
#page-announcements .ann-card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 10px;
  padding-right: 70px;
}
#page-announcements .ann-card-msg {
  font-size: 14px;
  color: var(--text);
  line-height: 1.65;
  margin-bottom: 14px;
  white-space: pre-wrap;
}
#page-announcements .ann-card-date {
  font-size: 12px;
  color: var(--muted);
}
</style>
