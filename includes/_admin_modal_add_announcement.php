<!-- ADD ANNOUNCEMENT MODAL -->
<div class="modal-overlay" id="modal-add-announcement" onclick="closeModalOutside(event,'modal-add-announcement')">
  <div class="modal">
    <div class="modal-header">
      <h2>📢 New Announcement</h2>
      <button class="modal-close" onclick="closeModal('modal-add-announcement')">✕</button>
    </div>

    <?php if (!empty($error_msg) && $open_modal === 'add_announcement'): ?>
      <div class="modal-alert err">⚠️ <?= htmlspecialchars($error_msg) ?></div>
    <?php endif; ?>

    <form method="POST" action="admin_dashboard.php">
      <input type="hidden" name="action" value="add_announcement"/>

      <div class="mfield">
        <label>Title <span class="req">*</span></label>
        <input type="text" name="title" placeholder="e.g. ARAL Session Schedule Update" maxlength="120" required/>
      </div>

      <div class="mfield">
        <label>Message <span class="req">*</span></label>
        <textarea name="message" rows="5" placeholder="Write your announcement here..." required></textarea>
      </div>

      <div style="display:flex;gap:10px;margin-top:6px;">
        <button type="submit" class="card-action primary" style="flex:1;height:42px;font-size:13.5px;">
          Post Announcement
        </button>
        <button type="button" class="card-action" style="height:42px;" onclick="closeModal('modal-add-announcement')">
          Cancel
        </button>
      </div>
    </form>
  </div>
</div>
