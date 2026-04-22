<!-- ═══════════════════════════════════
     PAGE: REPORTS
════════════════════════════════════ -->
<div id="page-reports" style="display:none;">
  <div class="page-header">
    <h1>School Reports</h1>
    <p>Generate and export school-wide ARAL reports</p>
  </div>

  <div class="card">
    <div class="card-header"><h2>Export Options</h2></div>
    <div class="export-grid">
      <div class="export-btn" onclick="toast('School-wide attendance report generating...')">
        <div class="e-icon">📋</div>
        <div class="e-label">Attendance Report</div>
        <div class="e-sub">PDF · All sections</div>
      </div>
      <div class="export-btn" onclick="toast('Teacher performance report generating...')">
        <div class="e-icon">👩‍🏫</div>
        <div class="e-label">Teacher Summary</div>
        <div class="e-sub">PDF · Per teacher</div>
      </div>
      <div class="export-btn" onclick="toast('Intervention report generating...')">
        <div class="e-icon">⚠️</div>
        <div class="e-label">Intervention Report</div>
        <div class="e-sub">PDF · Flagged students</div>
      </div>
      <div class="export-btn" onclick="toast('Enrollment report generating...')">
        <div class="e-icon">🎒</div>
        <div class="e-label">Enrollment Summary</div>
        <div class="e-sub">PDF · By grade & section</div>
      </div>
      <div class="export-btn" onclick="toast('Monthly ARAL report generating...')">
        <div class="e-icon">📅</div>
        <div class="e-label">Monthly ARAL Report</div>
        <div class="e-sub">PDF · For DepEd</div>
      </div>
      <div class="export-btn" onclick="toast('Full data export generating...')">
        <div class="e-icon">📊</div>
        <div class="e-label">Full Data Export</div>
        <div class="e-sub">CSV · All records</div>
      </div>
    </div>
  </div>
</div>
