<!-- ═══════════════════════════════════
     PAGE: INTERVENTION
════════════════════════════════════ -->
<div id="page-intervention" style="display:none;">
  <div class="page-header">
    <h1>Intervention List</h1>
    <p>Learners flagged for support</p>
  </div>

  <div class="card">
    <div class="card-header">
      <h2>Priority Interventions</h2>
      <button class="card-action primary" onclick="toast('Report sent to school head!')">Send to Principal</button>
    </div>
    <div class="student-row">
      <div class="s-avatar" style="background:#FCEBEB;color:#791F1F;">PD</div>
      <div>
        <div class="s-name">Pedro Dela Cruz</div>
        <div class="s-sub">Reading: Frustration · Numeracy below 50% · 4 absences</div>
      </div>
      <span class="badge badge-red" style="margin-left:auto;">High</span>
    </div>
    <div class="student-row">
      <div class="s-avatar" style="background:#FCEBEB;color:#791F1F;">RL</div>
      <div>
        <div class="s-name">Rosa Lopez</div>
        <div class="s-sub">Numeracy below 50% · Instructional reading</div>
      </div>
      <span class="badge badge-red" style="margin-left:auto;">High</span>
    </div>
    <div class="student-row">
      <div class="s-avatar" style="background:#FAEEDA;color:#633806;">BM</div>
      <div>
        <div class="s-name">Ben Mendoza</div>
        <div class="s-sub">3 absences this month · Science avg 55%</div>
      </div>
      <span class="badge badge-amber" style="margin-left:auto;">Medium</span>
    </div>
  </div>

  <div class="card">
    <div class="card-header"><h2>Add Intervention Note</h2></div>
    <div style="display:flex;flex-direction:column;gap:10px;">
      <select style="width:100%;">
        <?php foreach ($students as $s): ?>
          <option><?= htmlspecialchars($s['first_name'] . ' ' . $s['last_name']) ?></option>
        <?php endforeach; ?>
        <?php if (empty($students)): ?>
          <option>No students yet</option>
        <?php endif; ?>
      </select>
      <textarea rows="3" placeholder="Describe the intervention strategy or observation..." style="width:100%;resize:vertical;"></textarea>
      <button class="card-action primary" style="align-self:flex-start;" onclick="toast('Intervention note saved!')">Save Note</button>
    </div>
  </div>
</div>
