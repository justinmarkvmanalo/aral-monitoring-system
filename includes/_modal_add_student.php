<!-- ADD STUDENT MODAL -->
<div class="modal-overlay" id="modal-overlay" onclick="closeModalOutside(event)">
  <div class="modal">
    <div class="modal-header">
      <h2>➕ Add New Student</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>

    <div id="modal-alert" style="display:none;"></div>

    <form method="POST" action="dashboard.php#page-attendance" id="add-student-form">
      <input type="hidden" name="action" value="add_student"/>

      <div class="mrow2">
        <div class="mfield">
          <label>Last Name <span class="req">*</span></label>
          <input type="text" name="last_name" placeholder="Dela Cruz" maxlength="60" required/>
        </div>
        <div class="mfield">
          <label>First Name <span class="req">*</span></label>
          <input type="text" name="first_name" placeholder="Pedro" maxlength="60" required/>
        </div>
      </div>

      <div class="mfield">
        <label>Middle Name <span style="color:#9CA3A0;font-weight:400;text-transform:none;">(optional)</span></label>
        <input type="text" name="middle_name" placeholder="Santos" maxlength="60"/>
      </div>

      <div class="mfield">
        <label>LRN – Learner Reference Number <span class="req">*</span></label>
        <input type="text" name="lrn" placeholder="123456789012" maxlength="12" pattern="\d{12}"
          oninput="this.value=this.value.replace(/\D/g,'')" required/>
        <div class="hint">12-digit DepEd ID — found on the student's Form 1</div>
      </div>

      <div class="mrow2">
        <div class="mfield">
          <label>Gender <span class="req">*</span></label>
          <select name="gender" required>
            <option value="">— Select —</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="mfield">
          <label>Birth Date <span style="color:#9CA3A0;font-weight:400;text-transform:none;">(optional)</span></label>
          <input type="date" name="birth_date"/>
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-top:6px;">
        <button type="submit" class="card-action primary" style="flex:1;height:42px;font-size:13.5px;">
          Save Student
        </button>
        <button type="button" class="card-action" style="height:42px;" onclick="closeModal()">
          Cancel
        </button>
      </div>
    </form>
  </div>
</div>
