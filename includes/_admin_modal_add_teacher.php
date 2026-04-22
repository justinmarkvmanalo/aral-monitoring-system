<!-- ADD TEACHER MODAL -->
<div class="modal-overlay" id="modal-add-teacher" onclick="closeModalOutside(event,'modal-add-teacher')">
  <div class="modal">
    <div class="modal-header">
      <h2>👩‍🏫 Add New Teacher</h2>
      <button class="modal-close" onclick="closeModal('modal-add-teacher')">✕</button>
    </div>

    <?php if (!empty($error_msg) && $open_modal === 'add_teacher'): ?>
      <div class="modal-alert err">⚠️ <?= htmlspecialchars($error_msg) ?></div>
    <?php endif; ?>

    <form method="POST" action="admin_dashboard.php">
      <input type="hidden" name="action" value="add_teacher"/>

      <div class="mrow2">
        <div class="mfield">
          <label>First Name <span class="req">*</span></label>
          <input type="text" name="first_name" placeholder="Maria" maxlength="60" required/>
        </div>
        <div class="mfield">
          <label>Last Name <span class="req">*</span></label>
          <input type="text" name="last_name" placeholder="Santos" maxlength="60" required/>
        </div>
      </div>

      <div class="mfield">
        <label>Email Address <span class="req">*</span></label>
        <input type="email" name="email" placeholder="teacher@school.edu.ph" required/>
      </div>

      <div class="mfield">
        <label>Password <span class="req">*</span></label>
        <input type="password" name="password" placeholder="Min. 8 characters" minlength="8" required/>
        <div class="hint">Teacher will use this to log in. Advise them to change it after first login.</div>
      </div>

      <div class="mfield">
        <label>Grade Level <span style="color:#9CA3A0;font-weight:400;text-transform:none;">(optional)</span></label>
        <select name="grade_level">
          <option value="">— Select Grade —</option>
          <?php for ($g = 1; $g <= 6; $g++): ?>
            <option value="<?= $g ?>">Grade <?= $g ?></option>
          <?php endfor; ?>
        </select>
      </div>

      <div style="display:flex;gap:10px;margin-top:6px;">
        <button type="submit" class="card-action primary" style="flex:1;height:42px;font-size:13.5px;">
          Save Teacher
        </button>
        <button type="button" class="card-action" style="height:42px;" onclick="closeModal('modal-add-teacher')">
          Cancel
        </button>
      </div>
    </form>
  </div>
</div>
