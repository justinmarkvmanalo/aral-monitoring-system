<!-- ═══════════════════════════════════
     PAGE: SCIENCE CHECK
════════════════════════════════════ -->
<div id="page-science" style="display:none;">
  <div class="page-header">
    <h1>Science Understanding Check</h1>
    <p>Post-ARAL session concept quizzes</p>
  </div>

  <div class="card">
    <div class="card-header">
      <h2>Today's Quiz — Living Things</h2>
      <button class="card-action primary" onclick="gradeScienceQuiz()">Submit &amp; Grade</button>
    </div>
    <div id="science-quiz"></div>
    <div id="science-result" style="display:none;margin-top:12px;padding:12px;background:var(--accent-light);border-radius:8px;">
      <span style="font-size:13px;font-weight:500;color:var(--accent-mid);" id="science-score-text"></span>
    </div>
  </div>

  <div class="card">
    <div class="card-header"><h2>Class Results — Last 3 Sessions</h2></div>
    <table>
      <thead>
        <tr><th>Session</th><th>Topic</th><th>Class Avg</th><th>Passed</th><th>Needs Review</th></tr>
      </thead>
      <tbody>
        <tr><td>March 14</td><td>Matter &amp; Properties</td><td><span class="badge badge-green">78%</span></td><td>22</td><td>6</td></tr>
        <tr><td>March 12</td><td>Water Cycle</td><td><span class="badge badge-amber">65%</span></td><td>16</td><td>12</td></tr>
        <tr><td>March 10</td><td>Plant Parts</td><td><span class="badge badge-green">83%</span></td><td>24</td><td>4</td></tr>
      </tbody>
    </table>
  </div>
</div>
