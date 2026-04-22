<!-- ═══════════════════════════════════
     PAGE: PHIL-IRI ORAL READING ASSESSOR v2
════════════════════════════════════ -->
<div id="page-reading" style="display:none;">
  <div class="page-header">
    <h1>📖 Phil-IRI Oral Reading Assessment</h1>
    <p>Live speech-to-text - Miscue analysis - WPM speed - Official DepEd grading criteria</p>
  </div>

  <!-- PHIL-IRI CRITERIA LEGEND -->
  <div class="card ira-legend">
    <div class="legend-title">📊 Official Phil-IRI Oral Reading Criteria</div>
    <div class="legend-grid">
      <div class="legend-col">
        <div class="legend-head">Word Recognition</div>
        <div class="legend-row ind">✅ Independent &nbsp;97–100%</div>
        <div class="legend-row ins">⚠️ Instructional &nbsp;90–96%</div>
        <div class="legend-row fru">❌ Frustration &nbsp;89% &amp; below</div>
      </div>
      <div class="legend-col">
        <div class="legend-head">Reading Speed (WPM)</div>
        <table class="legend-table">
          <tr><th>Grade</th><th class="ind-c">Independent</th><th class="ins-c">Instructional</th><th class="fru-c">Frustration</th></tr>
          <tr><td>1</td><td>70+</td><td>31–69</td><td>≤30</td></tr>
          <tr><td>2</td><td>100+</td><td>61–99</td><td>≤60</td></tr>
          <tr><td>3</td><td>120+</td><td>91–119</td><td>≤90</td></tr>
          <tr><td>4</td><td>140+</td><td>111–139</td><td>≤110</td></tr>
          <tr><td>5</td><td>170+</td><td>141–169</td><td>≤140</td></tr>
          <tr><td>6</td><td>190+</td><td>161–189</td><td>≤160</td></tr>
        </table>
      </div>
      <div class="legend-col">
        <div class="legend-head">Formula</div>
        <div class="legend-formula">
          <div><strong>WR%</strong> = 100% − (Major Miscues ÷ Total Words × 100)</div>
          <div style="margin-top:8px;"><strong>WPM</strong> = (Words ÷ Seconds) × 60</div>
          <div style="margin-top:8px;"><strong>Final Level</strong> = combination of WR% + WPM</div>
        </div>
      </div>
    </div>
  </div>

  <div class="ira-grid">
    <!-- Setup Panel -->
    <div class="card ira-setup">
      <div class="card-header"><h2>⚙️ Assessment Setup</h2></div>
      <div class="ira-field">
        <label>Student</label>
        <select id="ira-student">
          <option value="">— Select a student —</option>
          <?php foreach ($students as $s): ?>
          <option value="<?= $s['id'] ?>" data-name="<?= htmlspecialchars($s['first_name'].' '.$s['last_name']) ?>">
            <?= htmlspecialchars($s['last_name'].', '.$s['first_name']) ?>
          </option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="ira-field">
        <label>Grade Level</label>
        <select id="ira-grade">
          <option value="">— Select grade —</option>
          <option value="1">Grade 1</option><option value="2">Grade 2</option>
          <option value="3">Grade 3</option><option value="4">Grade 4</option>
          <option value="5">Grade 5</option><option value="6">Grade 6</option>
        </select>
      </div>
      <div class="ira-field">
        <label>Period</label>
        <select id="ira-period">
          <option value="pre">Pre-test (Beginning of SY)</option>
          <option value="post">Post-test (End of SY)</option>
        </select>
      </div>
      <div class="ira-field">
        <label>Reading Passage</label>
        <select id="ira-passage-select" onchange="loadPassage()">
          <option value="">— Choose a passage —</option>
          <optgroup label="Grade 1">
            <option value="g1_p1">Ang Aking Pamilya (Grade 1 - 35 words)</option>
            <option value="g1_p2">Si Pedro at ang Aso (Grade 1 - 34 words)</option>
          </optgroup>
          <optgroup label="Grade 2">
            <option value="g2_p1">Ang Mahal Kong Nanay (Grade 2 - 44 words)</option>
            <option value="g2_p2">Isang Araw sa Bukid (Grade 2 - 44 words)</option>
          </optgroup>
          <optgroup label="Grade 3">
            <option value="g3_p1">Ang Matandang Mangingisda (Grade 3 - 57 words)</option>
            <option value="g3_p2">Ang Batang Manlalaro (Grade 3 - 54 words)</option>
          </optgroup>
          <optgroup label="Grade 4–6">
            <option value="g4_p1">Ang Kagandahan ng Kalikasan (Grade 4 - 64 words)</option>
            <option value="g5_p1">Ang Pagtutulungan (Grade 5 - 72 words)</option>
            <option value="g6_p1">Ang Kabataang Pilipino (Grade 6 - 83 words)</option>
          </optgroup>
          <option value="custom">✏️ Custom Passage...</option>
        </select>
      </div>
      <div class="ira-field" id="custom-passage-wrap" style="display:none;">
        <label>Custom Passage Text</label>
        <textarea id="ira-custom-text" rows="6" placeholder="Paste or type the reading passage here..."></textarea>
      </div>
      <div class="ira-field">
        <label>Total Words in Passage</label>
        <input type="number" id="ira-word-count" min="1" placeholder="Auto-counted" readonly style="background:#f4f6f3;">
      </div>
      <button class="btn-ira-start" id="btn-start-assessment" onclick="startAssessment()">
        🎙️ Start Assessment
      </button>
    </div>

    <!-- Passage Display -->
    <div class="card ira-passage-card">
      <div class="card-header">
        <h2>📄 Reading Passage</h2>
        <span id="passage-title-label" style="font-size:12px;color:var(--muted);"></span>
      </div>
      <div id="ira-passage-display" class="ira-passage-text">
        <div style="text-align:center;padding:40px 24px;color:var(--muted);font-size:13px;">
          Select a passage from the setup panel to begin.
        </div>
      </div>
    </div>
  </div>

  <!-- RECORDING PANEL -->
  <div class="card ira-recorder" id="ira-recorder" style="display:none;">
    <div class="card-header">
      <h2 id="rec-student-label">Recording: —</h2>
      <div class="rec-controls">
        <button class="btn-rec" id="btn-mic" onclick="toggleRecording()">
          <span class="rec-dot"></span> Start Recording
        </button>
        <button class="btn-analyze" id="btn-analyze" onclick="analyzeReading()" disabled>
          🤖 Analyze with AI
        </button>
      </div>
    </div>

    <!-- Timer display -->
    <div class="ira-timer-bar">
      <div class="timer-display" id="timer-display">
        <span class="timer-icon">⏱️</span>
        <span id="timer-value">0:00</span>
        <span class="timer-label">Reading Time</span>
      </div>
      <div class="timer-display">
        <span class="timer-icon">📝</span>
        <span id="wpm-live">—</span>
        <span class="timer-label">Est. WPM</span>
      </div>
      <div class="timer-display" id="wpm-level-display" style="display:none;">
        <span class="timer-icon">📊</span>
        <span id="wpm-level-val">—</span>
        <span class="timer-label">Speed Level</span>
      </div>
    </div>

    <div class="ira-two-col">
      <div>
        <div class="ira-col-label">📄 Original Passage</div>
        <div id="rec-passage" class="ira-passage-text ira-passage-sm"></div>
      </div>
      <div>
        <div class="ira-col-label">🎙️ Student Read (live)</div>
        <div id="rec-transcript" class="ira-transcript-box">
          <span style="color:var(--muted);font-size:13px;">Speech will appear here as the student reads...</span>
        </div>
        <div class="rec-status" id="rec-status">⏸ Not recording</div>
      </div>
    </div>
  </div>

  <!-- AI RESULTS -->
  <div class="card ira-results" id="ira-results" style="display:none;">
    <div class="card-header">
      <h2>🤖 Phil-IRI Analysis Results</h2>
      <button class="card-action primary" onclick="saveResult()">💾 Save Result</button>
    </div>
    <div id="ira-results-body"></div>
  </div>

  <!-- HISTORY -->
  <div class="card" id="ira-history-card">
    <div class="card-header"><h2>📊 Assessment History</h2></div>
    <div id="ira-history-body">
      <div style="text-align:center;padding:32px;color:#9CA3A0;font-size:13px;">No assessments saved yet.</div>
    </div>
  </div>
</div>

<style>
/* Legend */
.ira-legend { margin-bottom:20px; }
.legend-title { font-size:13px; font-weight:700; color:var(--text); margin-bottom:14px; text-transform:uppercase; letter-spacing:.04em; }
.legend-grid { display:grid; grid-template-columns:1fr 2fr 1fr; gap:20px; }
@media(max-width:900px){ .legend-grid { grid-template-columns:1fr; } }
.legend-head { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); margin-bottom:8px; }
.legend-row { font-size:13px; padding:5px 10px; border-radius:6px; margin-bottom:5px; font-weight:500; }
.legend-row.ind { background:#e1f5ee; color:#0F6E56; }
.legend-row.ins { background:#fef3c7; color:#92400E; }
.legend-row.fru { background:#fcecea; color:#C0392B; }
.legend-table { width:100%; border-collapse:collapse; font-size:12px; }
.legend-table th { padding:5px 8px; background:#f4f6f3; border-bottom:1px solid var(--border); font-weight:600; color:var(--muted); }
.legend-table td { padding:4px 8px; border-bottom:1px solid var(--border); text-align:center; }
.legend-table .ind-c { color:#0F6E56; }
.legend-table .ins-c { color:#92400E; }
.legend-table .fru-c { color:#C0392B; }
.legend-formula { font-size:12.5px; line-height:1.8; color:var(--text); background:#f8f9fa; padding:12px; border-radius:8px; border:1px solid var(--border); }

/* Layout */
.ira-grid { display:grid; grid-template-columns:360px 1fr; gap:20px; margin-bottom:20px; }
@media(max-width:900px){ .ira-grid { grid-template-columns:1fr; } }
.ira-field { margin-bottom:16px; }
.ira-field label { display:block; font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); margin-bottom:6px; }
.ira-field select, .ira-field input, .ira-field textarea { width:100%; padding:9px 12px; border:1.5px solid var(--border); border-radius:8px; font-size:13.5px; font-family:'DM Sans',sans-serif; color:var(--text); background:#fafbfa; outline:none; transition:border-color .18s; }
.ira-field select:focus, .ira-field input:focus, .ira-field textarea:focus { border-color:var(--accent); }
.ira-field textarea { resize:vertical; line-height:1.6; }
.btn-ira-start { width:100%; padding:13px; background:var(--accent); color:#fff; border:none; border-radius:10px; font-size:15px; font-weight:600; font-family:'DM Sans',sans-serif; cursor:pointer; margin-top:4px; transition:background .18s,opacity .18s; box-shadow:0 3px 12px rgba(29,158,117,.25); }
.btn-ira-start:disabled { opacity:.45; cursor:not-allowed; }
.btn-ira-start:not(:disabled):hover { background:#0F6E56; }
.ira-passage-text { font-size:15px; line-height:2.1; color:var(--text); padding:8px 4px; min-height:120px; }
.ira-passage-sm { font-size:13px; line-height:1.9; }

/* Timer bar */
.ira-timer-bar { display:flex; gap:24px; padding:16px 0 20px; border-bottom:1px solid var(--border); margin-bottom:20px; flex-wrap:wrap; }
.timer-display { display:flex; align-items:center; gap:8px; background:#f4f6f3; padding:10px 18px; border-radius:10px; border:1px solid var(--border); }
.timer-icon { font-size:18px; }
#timer-value { font-size:22px; font-weight:700; color:var(--text); font-variant-numeric:tabular-nums; min-width:44px; }
#wpm-live { font-size:22px; font-weight:700; color:var(--accent); min-width:44px; }
#wpm-level-val { font-size:16px; font-weight:700; min-width:80px; }
.timer-label { font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:.04em; }

/* Recorder */
.ira-recorder .card-header { flex-wrap:wrap; gap:12px; }
.rec-controls { display:flex; gap:10px; flex-wrap:wrap; }
.btn-rec { display:flex; align-items:center; gap:8px; padding:9px 18px; border-radius:9px; border:none; background:#C0392B; color:#fff; font-size:13.5px; font-weight:600; font-family:'DM Sans',sans-serif; cursor:pointer; }
.btn-rec.recording { background:#7f1d1d; animation:pulse-btn 1.2s infinite; }
@keyframes pulse-btn { 0%,100%{box-shadow:0 0 0 0 rgba(192,57,43,.4)} 50%{box-shadow:0 0 0 8px rgba(192,57,43,0)} }
.rec-dot { width:10px; height:10px; border-radius:50%; background:#fff; display:inline-block; }
.btn-analyze { padding:9px 18px; border-radius:9px; border:none; background:#1D4ED8; color:#fff; font-size:13.5px; font-weight:600; font-family:'DM Sans',sans-serif; cursor:pointer; transition:opacity .18s; }
.btn-analyze:disabled { opacity:.4; cursor:not-allowed; }
.btn-analyze:not(:disabled):hover { background:#1E40AF; }
.ira-two-col { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
@media(max-width:700px){ .ira-two-col { grid-template-columns:1fr; } }
.ira-col-label { font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); margin-bottom:10px; }
.ira-transcript-box { min-height:120px; padding:14px; background:#f8f9ff; border:1.5px solid #dde3ff; border-radius:10px; font-size:14px; line-height:1.8; color:var(--text); }
.rec-status { font-size:12px; color:var(--muted); margin-top:8px; font-style:italic; }

/* Results */
.ira-loading { display:flex; flex-direction:column; align-items:center; gap:14px; padding:48px; color:var(--muted); font-size:13.5px; }
.ira-spinner { width:36px; height:36px; border:3px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin .8s linear infinite; }
@keyframes spin { to{transform:rotate(360deg)} }
.ira-summary-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:14px; margin-bottom:24px; }
.ira-stat { background:#f4f6f3; border-radius:12px; padding:16px; text-align:center; border:1px solid var(--border); }
.ira-stat .val { font-size:26px; font-weight:700; color:var(--text); }
.ira-stat .lbl { font-size:10.5px; color:var(--muted); text-transform:uppercase; letter-spacing:.04em; margin-top:4px; }
.ira-stat .sub { font-size:11px; color:var(--muted); margin-top:2px; }

/* Level badges */
.level-badge { display:inline-block; padding:6px 18px; border-radius:20px; font-size:14px; font-weight:700; }
.level-ind { background:#e1f5ee; color:#0F6E56; }
.level-ins { background:#fef3c7; color:#92400E; }
.level-fru { background:#fcecea; color:#C0392B; }

/* Dual level panel */
.dual-level { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px; }
@media(max-width:600px){ .dual-level { grid-template-columns:1fr; } }
.level-panel { border-radius:12px; padding:16px 18px; border:1.5px solid var(--border); }
.level-panel-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); margin-bottom:8px; }
.level-panel-val { font-size:18px; font-weight:700; margin-bottom:4px; }
.level-panel-detail { font-size:12px; color:var(--muted); }
.lp-ind { border-color:#6ee7b7; background:#f0fdf8; }
.lp-ins { border-color:#fcd34d; background:#fffbeb; }
.lp-fru { border-color:#fca5a5; background:#fff5f5; }

/* Miscue table */
.miscue-section { margin-top:20px; }
.miscue-section h3 { font-size:13.5px; font-weight:600; margin-bottom:12px; }
.miscue-table { width:100%; border-collapse:collapse; font-size:13px; }
.miscue-table th { background:#f4f6f3; padding:8px 12px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); border-bottom:1px solid var(--border); }
.miscue-table td { padding:9px 12px; border-bottom:1px solid var(--border); vertical-align:middle; }
.miscue-table tr:last-child td { border-bottom:none; }
.miscue-type { display:inline-block; padding:2px 9px; border-radius:10px; font-size:11px; font-weight:600; text-transform:uppercase; }
.mt-sub { background:#fcecea; color:#C0392B; }
.mt-om  { background:#fef3c7; color:#92400E; }
.mt-ins { background:#f5f3ff; color:#7C3AED; }
.mt-mis { background:#fce7f3; color:#9D174D; }
.mt-rep { background:#e0f2fe; color:#0369A1; }

/* Computation box */
.computation-box { background:#f8fafc; border:1px solid var(--border); border-radius:12px; padding:18px 20px; margin-top:20px; font-size:13px; line-height:2; }
.computation-box .comp-title { font-weight:700; font-size:13.5px; margin-bottom:8px; color:var(--text); }
.computation-box .comp-line { display:flex; justify-content:space-between; border-bottom:1px dashed var(--border); padding:3px 0; }
.computation-box .comp-line:last-child { border-bottom:none; font-weight:700; }

.ai-feedback-box { background:#f0fdf8; border:1px solid #6ee7b7; border-radius:12px; padding:18px 20px; font-size:13.5px; line-height:1.75; color:var(--text); margin-top:12px; }
.ai-feedback-box strong { color:#0F6E56; }

/* History */
#ira-history-body table { width:100%; border-collapse:collapse; font-size:13px; }
#ira-history-body th { background:#f4f6f3; padding:8px 12px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); border-bottom:1px solid var(--border); }
#ira-history-body td { padding:9px 12px; border-bottom:1px solid var(--border); }
</style>

<script>
// ── Phil-IRI WPM Norms ────────────────────────────────────────
const WPM_NORMS = {
  1: { ind:70,  ins_lo:31,  ins_hi:69  },
  2: { ind:100, ins_lo:61,  ins_hi:99  },
  3: { ind:120, ins_lo:91,  ins_hi:119 },
  4: { ind:140, ins_lo:111, ins_hi:139 },
  5: { ind:170, ins_lo:141, ins_hi:169 },
  6: { ind:190, ins_lo:161, ins_hi:189 }
};

function getWpmLevel(wpm, grade) {
  var n = WPM_NORMS[grade];
  if (!n) return 'unknown';
  if (wpm >= n.ind)    return 'independent';
  if (wpm >= n.ins_lo) return 'instructional';
  return 'frustration';
}

// Official Phil-IRI final level lookup table
// Rows = WR level, Cols = WPM (speed) level
// Source: Phil-IRI Manual 2018 combination table
function getFinalLevel(wrLevel, wpmLevel) {
  if (wrLevel === 'independent' && wpmLevel === 'independent') return 'independent';
  if (wrLevel === 'independent' && wpmLevel === 'instructional') return 'instructional';
  if (wrLevel === 'independent' && wpmLevel === 'frustration')   return 'frustration';
  if (wrLevel === 'instructional' && wpmLevel === 'independent') return 'instructional';
  if (wrLevel === 'instructional' && wpmLevel === 'instructional') return 'instructional';
  if (wrLevel === 'instructional' && wpmLevel === 'frustration')   return 'frustration';
  if (wrLevel === 'frustration') return 'frustration';
  return 'frustration';
}

// ── Passages ──────────────────────────────────────────────────
const PASSAGES = {
  g1_p1:{ title:"Ang Aking Pamilya", grade:1, text:"Mahal ko ang aking pamilya. Kami ay tatlo sa bahay. Si Nanay si Tatay at ako. Masaya kami sa aming tahanan. Tumutulong ako sa aking mga magulang. Lagi kaming nagkakasama sa hapag-kainan. Mahal na mahal ko sila." },
  g1_p2:{ title:"Si Pedro at ang Aso", grade:1, text:"Si Pedro ay may aso. Itim ang kulay ng aso. Bantay ang pangalan nito. Lagi silang naglalaro sa bakuran. Inaalagaan ni Pedro si Bantay araw-araw. Binibigyan siya ng pagkain at tubig. Masayang-masaya si Pedro sa kanyang aso." },
  g2_p1:{ title:"Ang Mahal Kong Nanay", grade:2, text:"Si Nanay ay napakaganda ng kalooban. Lagi siyang gising nang maaga para magluto ng almusal. Tinutulungan niya kami sa aming mga aralin. Kapag kami ay may sakit siya ang nag-aalaga sa amin. Maraming pasasalamat ako sa aking nanay. Siya ang aking bayani sa araw-araw." },
  g2_p2:{ title:"Isang Araw sa Bukid", grade:2, text:"Pumunta kami sa bukid ng aming lolo. Malawak at maganda ang palayan. Nakita namin ang mga magsasaka na nagtatanim ng palay. Masipag sila sa kanilang trabaho. Nagtanim din kami ng gulay sa hardin. Pagod kami ngunit masaya. Marami kaming natutunan sa araw na iyon." },
  g3_p1:{ title:"Ang Matandang Mangingisda", grade:3, text:"Si Mang Berting ay isang matandang mangingisda sa aming nayon. Bawat umaga lumalabas siya ng maaga upang mangisda sa ilog. Kahit mainit ang araw o malakas ang ulan hindi siya sumusuko. Ang mga isdang nahuhuli niya ay ibinibenta sa palengke. Ang kita niya ay ginagamit para sa pangangailangan ng kanyang pamilya. Ipinagmamalaki siya ng kanilang baranggay dahil sa kanyang kasipagan at tiyaga." },
  g3_p2:{ title:"Ang Batang Manlalaro", grade:3, text:"Si Marco ay isang batang mahilig maglaro ng basketbol. Araw-araw pagkatapos ng klase pumupunta siya sa parke. Nagsasanay siya nang maraming oras. Minsan nalulungkot siya kapag natalo ang kanyang koponan. Ngunit hindi siya sumusuko. Naniniwala siya na ang pagsasanay ang susi sa tagumpay. Isang araw nanalo ang kanyang koponan sa kampeonato ng kanilang baranggay." },
  g4_p1:{ title:"Ang Kagandahan ng Kalikasan", grade:4, text:"Ang kalikasan ay isa sa pinakamahalagang kayamanan ng ating bansa. Ang ating mga bundok ilog at kagubatan ay nagbibigay ng hangin tubig at pagkain sa lahat ng nilalang. Ngunit sa kasalukuyan maraming panganib ang nagbabanta sa ating kapaligiran. Ang polusyon pagtotroso at pagmimina ay nagdudulot ng malaking pinsala sa ating kalikasan. Bilang mga kabataan may responsibilidad tayo na pangalagaan ang ating kapaligiran para sa mga susunod na henerasyon." },
  g5_p1:{ title:"Ang Pagtutulungan", grade:5, text:"Sa isang munting nayon sa probinsya may isang grupo ng mga kabataang nagtutulungan para sa ikabubuti ng kanilang pamayanan. Bawat Sabado nagsasama-sama sila upang linisin ang kanilang paligid. Nagtatanim sila ng mga puno at gulay sa bakanteng lupa. Tinutulungan din nila ang mga matatanda at may kapansanan sa kanilang mga pangangailangan. Ang kanilang bayanihan ay nagbibigay inspirasyon sa lahat ng tao sa kanilang nayon. Patunay ito na ang pagkakaisa ay nagdudulot ng positibong pagbabago sa lipunan." },
  g6_p1:{ title:"Ang Kabataang Pilipino", grade:6, text:"Ang kabataan ay tinatawag na pag-asa ng bayan. Bilang mga kabataang Pilipino may natatanging papel tayong ginagampanan sa pagbuo ng isang mas maunlad at makatarungang lipunan. Ang edukasyon ay susi sa pagkamit ng ating mga pangarap at sa pagtupad sa ating mga responsibilidad bilang mamamayan. Dapat tayong magbasa matuto at magpaunlad ng ating mga kakayahan. Ngunit higit sa lahat kailangan nating maging mapanuri at matapang na harapin ang mga hamon ng panahon. Ang kinabukasan ng ating bansa ay nakasalalay sa ating mga kamay." }
};

// ── State ─────────────────────────────────────────────────────
var recognition=null, isRecording=false, fullTranscript='', currentPassageText='', currentStudentName='', lastAnalysisResult=null;
var timerInterval=null, timerSeconds=0, recordingStartTime=null;
var assessmentHistory=[];
try{ assessmentHistory=JSON.parse(localStorage.getItem('ira_history')||'[]'); }catch(e){}

// ── Passage loader ────────────────────────────────────────────
function loadPassage(){
  var sel = (document.getElementById('ira-passage-select') || {}).value || '';
  var cw  = document.getElementById('custom-passage-wrap');

  if(sel === 'custom'){
    if(cw) cw.style.display = 'block';
    document.getElementById('ira-passage-display').innerHTML =
      '<div style="color:var(--muted);font-size:13px;padding:20px 0;">Type your passage in the box on the left.</div>';
    document.getElementById('passage-title-label').textContent = 'Custom';
    document.getElementById('ira-word-count').value = '';
    currentPassageText = '';
    return;
  }

  var p = PASSAGES[sel] || null;
  if(cw) cw.style.display = 'none';

  if(p){
    currentPassageText = p.text.trim();
    var wc = currentPassageText.split(/\s+/).filter(Boolean).length;
    document.getElementById('ira-passage-display').innerHTML =
      '<p style="font-size:15px;line-height:2.2;letter-spacing:.01em;">' + currentPassageText + '</p>';
    document.getElementById('passage-title-label').textContent = p.title;
    document.getElementById('ira-word-count').value = wc;
    document.getElementById('ira-grade').value = String(p.grade);
    toast('✅ Passage loaded: ' + p.title + ' (' + wc + ' words)', 'success');
  } else {
    currentPassageText = '';
  }
}

document.addEventListener('DOMContentLoaded', function(){
  var ct = document.getElementById('ira-custom-text');
  if(ct) ct.addEventListener('input', function(){
    currentPassageText = this.value.trim();
    var wc = currentPassageText.split(/\s+/).filter(Boolean).length;
    document.getElementById('ira-word-count').value = wc || '';
    if(currentPassageText)
      document.getElementById('ira-passage-display').innerHTML =
        '<p style="font-size:15px;line-height:2.2;">' + currentPassageText + '</p>';
  });
  renderHistory();
});

function checkReady(){ /* validation now happens inside startAssessment */ }

// ── Start assessment ──────────────────────────────────────────
function startAssessment(){
  // Validate all required fields
  var studentEl = document.getElementById('ira-student');
  if(!studentEl.value){
    toast('⚠️ Please select a student first.', 'warn');
    return;
  }
  if(!currentPassageText){
    toast('⚠️ Please select a reading passage first.', 'warn');
    return;
  }
  if(!document.getElementById('ira-grade').value){
    toast('⚠️ Please select a grade level.', 'warn');
    return;
  }
  var sel=studentEl;
  currentStudentName=sel.options[sel.selectedIndex].dataset.name;
  var period=document.getElementById('ira-period').value;
  document.getElementById('ira-recorder').style.display='block';
  document.getElementById('ira-results').style.display='none';
  document.getElementById('rec-student-label').textContent='Recording: '+currentStudentName+' — '+(period==='pre'?'Pre-test':'Post-test');
  document.getElementById('rec-passage').innerHTML='<p>'+currentPassageText+'</p>';
  fullTranscript='';
  timerSeconds=0;
  document.getElementById('timer-value').textContent='0:00';
  document.getElementById('wpm-live').textContent='—';
  document.getElementById('wpm-level-display').style.display='none';
  document.getElementById('rec-transcript').innerHTML='<span style="color:var(--muted);font-size:13px;">Speech will appear here as the student reads...</span>';
  document.getElementById('btn-analyze').disabled=true;
  document.getElementById('ira-recorder').scrollIntoView({behavior:'smooth',block:'start'});
}

// ── Timer ─────────────────────────────────────────────────────
function startTimer(){
  timerSeconds=0;
  recordingStartTime=Date.now();
  clearInterval(timerInterval);
  timerInterval=setInterval(function(){
    timerSeconds=Math.floor((Date.now()-recordingStartTime)/1000);
    var m=Math.floor(timerSeconds/60), s=timerSeconds%60;
    document.getElementById('timer-value').textContent=m+':'+(s<10?'0':'')+s;
    // Live WPM estimate
    var wc=parseInt(document.getElementById('ira-word-count').value)||0;
    if(timerSeconds>0 && wc>0){
      var liveWpm=Math.round((wc/timerSeconds)*60);
      document.getElementById('wpm-live').textContent=liveWpm;
    }
  },500);
}

function stopTimer(){
  clearInterval(timerInterval);
}

// ── Recording ─────────────────────────────────────────────────
function toggleRecording(){
  if(!('webkitSpeechRecognition' in window)&&!('SpeechRecognition' in window)){
    toast('⚠️ Speech recognition requires Google Chrome or Microsoft Edge.', 'warn');
    return;
  }
  isRecording ? stopRecording() : startRecording();
}

function startRecording(){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  recognition=new SR();
  recognition.lang='fil-PH';
  recognition.continuous=true;
  recognition.interimResults=true;
  recognition.onstart=function(){
    isRecording=true;
    startTimer();
    var btn=document.getElementById('btn-mic');
    btn.innerHTML='<span class="rec-dot"></span> Stop Recording';
    btn.classList.add('recording');
    document.getElementById('rec-status').textContent='🔴 Recording... student is reading';
  };
  recognition.onresult=function(e){
    var interim='', final='';
    for(var i=e.resultIndex;i<e.results.length;i++){
      var t=e.results[i][0].transcript;
      if(e.results[i].isFinal) final+=t+' '; else interim+=t;
    }
    if(final) fullTranscript+=final;
    var box=document.getElementById('rec-transcript');
    box.innerHTML=(fullTranscript+'<span style="color:#9CA3A0">'+interim+'</span>')||'<span style="color:var(--muted)">Listening...</span>';
  };
  recognition.onerror=function(e){ if(e.error!=='no-speech') document.getElementById('rec-status').textContent='Error: '+e.error; };
  recognition.onend=function(){ if(isRecording) recognition.start(); };
  recognition.start();
}

function stopRecording(){
  isRecording=false;
  stopTimer();
  if(recognition) recognition.stop();
  var btn=document.getElementById('btn-mic');
  btn.innerHTML='<span class="rec-dot"></span> Resume Recording';
  btn.classList.remove('recording');
  document.getElementById('rec-status').textContent='Paused — '+timerSeconds+' seconds recorded';
  document.getElementById('btn-analyze').disabled=fullTranscript.trim().length<3;

  // Show WPM level preview
  var wc=parseInt(document.getElementById('ira-word-count').value)||0;
  var grade=parseInt(document.getElementById('ira-grade').value)||1;
  if(timerSeconds>0 && wc>0){
    var wpm=Math.round((wc/timerSeconds)*60);
    var wpmLv=getWpmLevel(wpm,grade);
    var lvLabels={independent:'✅ Fast Reader',instructional:'⚠️ Average Reader',frustration:'❌ Slow Reader'};
    var lvEl=document.getElementById('wpm-level-val');
    lvEl.textContent=lvLabels[wpmLv]||wpmLv;
    lvEl.style.color=wpmLv==='independent'?'#0F6E56':wpmLv==='instructional'?'#92400E':'#C0392B';
    document.getElementById('wpm-level-display').style.display='flex';
  }
}

// ── AI Analysis ───────────────────────────────────────────────
async function analyzeReading(){
  if(isRecording) stopRecording();

  document.getElementById('ira-results').style.display='block';
  document.getElementById('ira-results-body').innerHTML='<div class="ira-loading"><div class="ira-spinner"></div><div>Analyzing oral reading with AI...</div></div>';
  document.getElementById('ira-results').scrollIntoView({behavior:'smooth'});

  var grade=parseInt(document.getElementById('ira-grade').value)||1;
  var period=document.getElementById('ira-period').value;
  var wordCount=parseInt(document.getElementById('ira-word-count').value)||0;
  var readingSeconds=timerSeconds||0;
  var wpm=readingSeconds>0?Math.round((wordCount/readingSeconds)*60):0;
  var wpmLevel=wpm>0?getWpmLevel(wpm,grade):'unknown';

    var prompt='You are a DepEd Phil-IRI oral reading miscue analyst for Filipino language.\n\nPRE-PROCESSING — before comparing, normalize BOTH passage and transcript:\n- Strip all punctuation (periods, commas, hyphens, dashes)\n- Convert everything to LOWERCASE\n- Treat hyphenated words as one word with no hyphen (pag-asa = pagasa, araw-araw = arawaraw)\n- Ignore capitalization completely\n- Ignore extra spaces\nAfter normalization, pag-asa and pag asa are IDENTICAL. lipunan and Lipunan are IDENTICAL. mamamayan and Mamamayan are IDENTICAL.\n\nSTEP 1 — Number every word in the normalized passage (1, 2, 3...).\nSTEP 2 — Match normalized transcript words to passage words sequentially.\nSTEP 3 — Apply these STRICT rules:\n\nWHAT IS CORRECT (never mark these as errors):\n- Same word different capitalization = CORRECT\n- Hyphenated word said without hyphen = CORRECT (pag-asa = pag asa = CORRECT)\n- Same word with minor pronunciation variation = CORRECT\n- Repetition of a word = CORRECT, not an error\n- Self-correction (student fixes mistake) = CORRECT, count the corrected version\n- Speech-to-text splitting one word into two = CORRECT\n\nFUNCTION WORDS — NEVER major miscues:\nList: ang, ng, na, sa, ay, at, mga, ni, kay, para, kung, nang, dahil, pero, kaya, o, pa, din, rin, doon, dito, ito, iyon, kami, siya, sila, namin, nila, niya, ko, mo, ka, ikaw, ako, nito, niya, nito, noon, nga, man, lang, lamang, po, ho\nIf omitted or substituted = MINOR miscue only, never major.\n\nMAJOR MISCUES — content words only:\n- Noun, verb, adjective, adverb substituted with a DIFFERENT word = MAJOR\n- Content word clearly omitted (student skipped it entirely) = MAJOR\n- Extra content word inserted that changes meaning = MAJOR\n\nPOSITION RULE:\n- Scan forward only, never go back\n- Skipped content words = omission at their actual position\n- Never reuse a position number\n\nORIGINAL PASSAGE ('+wordCount+' words, Grade '+grade+'):\n'+currentPassageText+'\n\nSTUDENT TRANSCRIPT:\n'+fullTranscript.trim()+'\n\nSTUDENT: '+currentStudentName+' | GRADE: '+grade+' | PERIOD: '+(period==='pre'?'Pre-test':'Post-test')+'\nRECORDED TIME: '+readingSeconds+' seconds | WPM: '+wpm+' | WPM LEVEL: '+wpmLevel+'\n\nRespond ONLY with this exact JSON, no markdown, no extra text:\n{\n  "total_words": '+wordCount+',\n  "reading_seconds": '+readingSeconds+',\n  "wpm": '+wpm+',\n  "wpm_level": "'+wpmLevel+'",\n  "major_miscues": [\n    {"type":"substitution|omission|insertion|mispronunciation","original":"<exact word from passage>","read_as":"<what student said, empty string if omission>","position":<1-based word number>}\n  ],\n  "minor_miscues": [\n    {"type":"repetition|function-word-omission|function-word-substitution|hesitation","original":"<word>","position":<number>}\n  ],\n  "major_miscue_count": <length of major_miscues array only>,\n  "percent_miscues": <major_miscue_count / total_words * 100 rounded to 2 decimals>,\n  "word_recognition_percent": <100 - percent_miscues rounded to 2 decimals>,\n  "wr_level": "independent|instructional|frustration",\n  "final_reading_level": "independent|instructional|frustration",\n  "fluency_observations": "<2-3 sentences on pacing, expression, self-corrections>",\n  "teacher_recommendations": "<3-4 numbered Phil-IRI based recommendations>",\n  "comprehension_note": "<observation on comprehension based on reading behavior>"\n}\n\nPhil-IRI WR criteria: independent=97-100%, instructional=90-96%, frustration=89% below.\nFinal level: both independent = independent. Either frustration = frustration. Otherwise = instructional.';

  try{
    var res=await fetch('ai_proxy.php',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({messages:[{role:'user',content:prompt}]})
    });
    var data=await res.json();
    var raw=data.content?.map(function(c){return c.text||''}).join('');
    var clean=raw.replace(/```json|```/g,'').trim();
    // Extract JSON if surrounded by other text
    var jsonMatch=clean.match(/\{[\s\S]*\}/);
    if(jsonMatch) clean=jsonMatch[0];
    var result=JSON.parse(clean);
    lastAnalysisResult=Object.assign({},result,{
      student:currentStudentName,
      date:new Date().toISOString(),
      grade:grade,
      period:period,
      passage_title:document.getElementById('passage-title-label').textContent
    });
    renderResults(result);
  }catch(err){
    document.getElementById('ira-results-body').innerHTML='<div style="padding:24px;color:#C0392B;">⚠️ Analysis failed. Please try again.<br><small>'+err.message+'</small></div>';
  }
}

// ── Render Results ────────────────────────────────────────────
function renderResults(r){
  var lvlClass={independent:'level-ind',instructional:'level-ins',frustration:'level-fru'};
  var lvlLabel={independent:'Independent',instructional:'Instructional',frustration:'Frustration'};
  var lvlEmoji={independent:'✅',instructional:'⚠️',frustration:'❌'};
  var lvlPanelClass={independent:'lp-ind',instructional:'lp-ins',frustration:'lp-fru'};
  var typeClass={substitution:'mt-sub',omission:'mt-om',insertion:'mt-ins',mispronunciation:'mt-mis',repetition:'mt-rep',hesitation:'mt-rep'};

  var wpm=r.wpm||0;
  var readSec=r.reading_seconds||0;
  var m=Math.floor(readSec/60), s=readSec%60;
  var timeStr=m>0?m+'m '+(s<10?'0':'')+s+'s':s+'s';

  // Computation box
  var compHtml='<div class="computation-box"><div class="comp-title">📐 Official Phil-IRI Computation</div>'+
    '<div class="comp-line"><span>Total Words in Passage (N)</span><span>'+r.total_words+'</span></div>'+
    '<div class="comp-line"><span>Major Miscues (M)</span><span>'+r.major_miscue_count+'</span></div>'+
    '<div class="comp-line"><span>% of Miscues = M ÷ N × 100</span><span>'+(r.percent_miscues||0).toFixed(2)+'%</span></div>'+
    '<div class="comp-line"><span>Word Recognition % = 100% − % of Miscues</span><span><strong>'+(r.word_recognition_percent||0).toFixed(2)+'%</strong></span></div>'+
    '<div class="comp-line"><span>Reading Time</span><span>'+timeStr+'</span></div>'+
    '<div class="comp-line"><span>WPM = (Words ÷ Seconds) × 60</span><span><strong>'+wpm+' WPM</strong></span></div>'+
    '</div>';

  // Dual level panel
  var wrLv=r.wr_level||'frustration';
  var wpmLv=r.wpm_level||'unknown';
  var finalLv=r.final_reading_level||'frustration';
  var dualHtml='<div class="dual-level">'+
    '<div class="level-panel '+lvlPanelClass[wrLv]+'"><div class="level-panel-title">📝 Word Recognition Level</div><div class="level-panel-val">'+lvlEmoji[wrLv]+' '+(lvlLabel[wrLv]||wrLv)+'</div><div class="level-panel-detail">'+(r.word_recognition_percent||0).toFixed(2)+'% accuracy - '+(r.major_miscue_count||0)+' major miscues</div></div>'+
    '<div class="level-panel '+lvlPanelClass[wpmLv]+'"><div class="level-panel-title">⚡ Reading Speed Level</div><div class="level-panel-val">'+lvlEmoji[wpmLv]+' '+(lvlLabel[wpmLv]||wpmLv)+'</div><div class="level-panel-detail">'+wpm+' WPM - '+timeStr+'</div></div>'+
    '</div>';

  // Final level banner
  var finalHtml='<div style="background:'+(finalLv==='independent'?'#e1f5ee':finalLv==='instructional'?'#fef3c7':'#fcecea')+';border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;">'+
    '<span class="level-badge '+lvlClass[finalLv]+'">'+lvlEmoji[finalLv]+' '+lvlLabel[finalLv]+' Reader</span>'+
    '<span style="font-size:13px;color:var(--muted);">Final Phil-IRI Level = WR Level ('+lvlLabel[wrLv]+') + Speed Level ('+lvlLabel[wpmLv]+')</span>'+
    '</div>';

  // Stats grid
  var statsHtml='<div class="ira-summary-grid">'+
    '<div class="ira-stat"><div class="val">'+(r.word_recognition_percent||0).toFixed(1)+'%</div><div class="lbl">Word Recognition</div></div>'+
    '<div class="ira-stat"><div class="val">'+(r.major_miscue_count||0)+'</div><div class="lbl">Major Miscues</div></div>'+
    '<div class="ira-stat"><div class="val">'+(wpm||'—')+'</div><div class="lbl">WPM</div></div>'+
    '<div class="ira-stat"><div class="val">'+timeStr+'</div><div class="lbl">Reading Time</div></div>'+
    '<div class="ira-stat"><div class="val">'+(r.total_words||'—')+'</div><div class="lbl">Total Words</div></div>'+
    '</div>';

  // Major miscues table
  var majorRows='';
  if(r.major_miscues&&r.major_miscues.length){
    majorRows=r.major_miscues.map(function(m){
      return '<tr><td>'+m.position+'</td><td><strong>'+m.original+'</strong></td><td>'+(m.read_as||'<em style="color:#9CA3A0">omitted</em>')+'</td><td><span class="miscue-type '+(typeClass[m.type]||'mt-sub')+'">'+m.type+'</span></td><td>🔴 Major</td></tr>';
    }).join('');
  } else {
    majorRows='<tr><td colspan="5" style="text-align:center;color:#9CA3A0;padding:20px;">No major miscues — excellent word recognition!</td></tr>';
  }

  // Minor miscues table
  var minorRows='';
  if(r.minor_miscues&&r.minor_miscues.length){
    minorRows='<div class="miscue-section"><h3>📌 Minor Miscues (not counted in score)</h3><table class="miscue-table"><thead><tr><th>#</th><th>Word</th><th>Type</th></tr></thead><tbody>'+
      r.minor_miscues.map(function(m){
        return '<tr><td>'+m.position+'</td><td>'+m.original+'</td><td><span class="miscue-type '+(typeClass[m.type]||'mt-rep')+'">'+m.type+'</span></td></tr>';
      }).join('')+'</tbody></table></div>';
  }

  document.getElementById('ira-results-body').innerHTML=
    finalHtml+
    statsHtml+
    dualHtml+
    compHtml+
    '<div class="miscue-section"><h3>🔴 Major Miscues (counted in score)</h3><table class="miscue-table"><thead><tr><th>#</th><th>Expected</th><th>Student Read</th><th>Type</th><th>Severity</th></tr></thead><tbody>'+majorRows+'</tbody></table></div>'+
    minorRows+
    '<div class="ai-feedback-box"><strong>🎙️ Fluency Observations:</strong><br>'+(r.fluency_observations||'—')+'</div>'+
    '<div class="ai-feedback-box" style="background:#f0f4ff;border-color:#93c5fd;"><strong>💡 Teacher Recommendations:</strong><br>'+(r.teacher_recommendations||'—')+'</div>'+
    '<div class="ai-feedback-box" style="background:#fffbeb;border-color:#fcd34d;"><strong>📝 Comprehension Note:</strong><br>'+(r.comprehension_note||'—')+'</div>';
}

// ── Save & History ────────────────────────────────────────────
function saveResult(){
  if(!lastAnalysisResult) return;
  assessmentHistory.unshift(lastAnalysisResult);
  try{ localStorage.setItem('ira_history',JSON.stringify(assessmentHistory.slice(0,50))); }catch(e){}
  renderHistory();
  if(typeof toast==='function') toast('Assessment saved!');
}

function renderHistory(){
  var body=document.getElementById('ira-history-body');
  if(!assessmentHistory.length) return;
  var lvlBadge={independent:'badge-green',instructional:'badge-amber',frustration:'badge-red'};
  var rows=assessmentHistory.map(function(h){
    return '<tr>'+
      '<td style="font-weight:500;">'+(h.student||'—')+'</td>'+
      '<td>'+(h.passage_title||'—')+'</td>'+
      '<td>Grade '+(h.grade||'—')+'</td>'+
      '<td>'+(h.period==='pre'?'Pre-test':'Post-test')+'</td>'+
      '<td>'+parseFloat(h.word_recognition_percent||h.accuracy_rate||0).toFixed(1)+'%</td>'+
      '<td>'+(h.wpm||'—')+' WPM</td>'+
      '<td><span class="badge '+(lvlBadge[h.final_reading_level||h.reading_level]||'')+'">'+(h.final_reading_level||h.reading_level||'—')+'</span></td>'+
      '<td style="font-size:11px;color:var(--muted);">'+new Date(h.date).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})+'</td>'+
      '</tr>';
  }).join('');
  body.innerHTML='<div style="overflow-x:auto;"><table><thead><tr><th>Student</th><th>Passage</th><th>Grade</th><th>Period</th><th>WR%</th><th>WPM</th><th>Level</th><th>Date</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
</script>