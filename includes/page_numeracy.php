<!-- ═══════════════════════════════════
     PAGE: ARAL NUMERACY PRACTICE
════════════════════════════════════ -->
<div id="page-numeracy" style="display:none;">
  <div class="page-header">
    <h1>🔢 ARAL Numeracy Practice</h1>
    <p>Generate class drills · Print or display · Encode scores after · Track mastery</p>
  </div>

  <div class="tabs">
    <button class="tab-btn active" onclick="numTab('drill',this)">📝 Class Drill</button>
    <button class="tab-btn" onclick="numTab('encode',this)">✏️ Encode Scores</button>
    <button class="tab-btn" onclick="numTab('mastery',this)">📊 Class Mastery</button>
    <button class="tab-btn" onclick="numTab('history',this)">📋 History</button>
  </div>

  <!-- ══ TAB 1: CLASS DRILL GENERATOR ══ -->
  <div id="num-tab-drill" class="num-tab active">

    <div class="num-setup-grid">
      <!-- Setup -->
      <div class="card">
        <div class="card-header"><h2>⚙️ Drill Setup</h2></div>

        <div class="ira-field">
          <label>Skill / Operation</label>
          <select id="num-skill" onchange="updateDifficultyLabels()">
            <option value="addition">➕ Addition</option>
            <option value="subtraction">➖ Subtraction</option>
            <option value="multiplication">✖️ Multiplication</option>
            <option value="division">➗ Division</option>
            <option value="problem_solving">📖 Problem Solving</option>
          </select>
        </div>

        <div class="ira-field">
          <label>Difficulty Level</label>
          <select id="num-difficulty">
            <option value="1">Level 1 — Basic (single digit)</option>
            <option value="2">Level 2 — Intermediate (double digit)</option>
            <option value="3">Level 3 — Advanced (triple digit)</option>
          </select>
        </div>

        <div class="ira-field">
          <label>Number of Items</label>
          <select id="num-items">
            <option value="5">5 items</option>
            <option value="10" selected>10 items</option>
            <option value="15">15 items</option>
            <option value="20">20 items</option>
          </select>
        </div>

        <div class="ira-field">
          <label>Session Label (optional)</label>
          <input type="text" id="num-session-label" placeholder="e.g. Week 3 Addition Drill">
        </div>

        <button class="btn-ira-start" onclick="generateClassDrill()">
          🎯 Generate Class Drill
        </button>
      </div>

      <!-- How it works -->
      <div class="card" style="background:#f8fafc;">
        <div class="card-header"><h2>📌 How to Use</h2></div>
        <div style="font-size:13.5px;line-height:2;color:var(--text);">
          <div style="margin-bottom:8px;">
            <span style="background:#1D9E75;color:#fff;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;margin-right:8px;">1</span>
            Set skill, difficulty, and number of items
          </div>
          <div style="margin-bottom:8px;">
            <span style="background:#1D9E75;color:#fff;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;margin-right:8px;">2</span>
            Click <strong>Generate</strong> — questions appear below
          </div>
          <div style="margin-bottom:8px;">
            <span style="background:#1D9E75;color:#fff;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;margin-right:8px;">3</span>
            <strong>Print</strong> the drill sheet or write on the board
          </div>
          <div style="margin-bottom:8px;">
            <span style="background:#1D9E75;color:#fff;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;margin-right:8px;">4</span>
            Let all students answer on paper
          </div>
          <div>
            <span style="background:#1D9E75;color:#fff;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;margin-right:8px;">5</span>
            Go to <strong>Encode Scores</strong> tab to record each student's result
          </div>
        </div>
      </div>
    </div>

    <!-- Generated Drill -->
    <div id="num-drill-output" style="display:none;">
      <div class="card">
        <div class="card-header">
          <h2 id="num-drill-title">Class Drill</h2>
          <div style="display:flex;gap:8px;">
            <button class="card-action" onclick="printDrill()">🖨️ Print</button>
            <button class="card-action primary" onclick="numTab('encode', document.querySelectorAll('.tabs .tab-btn')[1])">✏️ Encode Scores →</button>
          </div>
        </div>

        <!-- Answer key toggle -->
        <div style="margin-bottom:16px;">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:var(--muted);">
            <input type="checkbox" id="show-answers" onchange="toggleAnswers(this.checked)">
            Show Answer Key (teacher view)
          </label>
        </div>

        <div id="num-drill-questions"></div>
      </div>


    </div>
  </div>

  <!-- ══ TAB 2: ENCODE SCORES ══ -->
  <div id="num-tab-encode" class="num-tab">
    <div class="card">
      <div class="card-header">
        <h2>✏️ Encode Student Scores</h2>
        <span style="font-size:12px;color:var(--muted);" id="encode-drill-label">No drill generated yet</span>
      </div>

      <div id="encode-no-drill" style="text-align:center;padding:40px;color:var(--muted);font-size:13.5px;">
        ⚠️ Generate a class drill first from the <strong>Class Drill</strong> tab, then come back here to encode scores.
      </div>

      <div id="encode-form" style="display:none;">
        <div style="background:#f0fdf8;border:1px solid #6ee7b7;border-radius:10px;padding:14px 18px;margin-bottom:20px;font-size:13px;color:#0F6E56;">
          📋 Enter the number of correct answers for each student. Total items: <strong id="encode-total-items">—</strong>
        </div>

        <div style="overflow-x:auto;">
          <table id="encode-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Student Name</th>
                <th style="width:120px;">Correct Items</th>
                <th style="width:80px;">Score %</th>
                <th style="width:100px;">Mastery</th>
              </tr>
            </thead>
            <tbody id="encode-tbody">
            </tbody>
          </table>
        </div>

        <div style="margin-top:20px;display:flex;gap:10px;justify-content:flex-end;">
          <button class="card-action primary" onclick="saveAllScores()" style="padding:10px 24px;font-size:14px;">
            💾 Save All Scores
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ══ TAB 3: CLASS MASTERY ══ -->
  <div id="num-tab-mastery" class="num-tab">
    <div class="card">
      <div class="card-header">
        <h2>📊 Class Mastery Overview</h2>
        <span style="font-size:12px;color:var(--muted);">Latest score per skill per student</span>
      </div>
      <div id="num-mastery-body">
        <div style="text-align:center;padding:32px;color:#9CA3A0;font-size:13px;">No scores saved yet.</div>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <h2>⚠️ Needs Intervention</h2>
        <span style="font-size:12px;color:var(--muted);">Below 75% in any skill</span>
      </div>
      <div id="num-intervention-body">
        <div style="text-align:center;padding:32px;color:#9CA3A0;font-size:13px;">No flags yet.</div>
      </div>
    </div>
  </div>

  <!-- ══ TAB 4: HISTORY ══ -->
  <div id="num-tab-history" class="num-tab">
    <div class="card">
      <div class="card-header">
        <h2>📋 Score History</h2>
        <button class="card-action danger" onclick="clearNumHistory()">🗑 Clear All</button>
      </div>
      <div id="num-history-body">
        <div style="text-align:center;padding:32px;color:#9CA3A0;font-size:13px;">No history yet.</div>
      </div>
    </div>
  </div>

</div>

<!-- ══ PRINT STYLES ══ -->
<style>


/* Layout */
.num-setup-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px; }
@media(max-width:800px){ .num-setup-grid{ grid-template-columns:1fr; } }
.num-tab { display:none; }
.num-tab.active { display:block; }

/* Drill questions display */
.num-q-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:0; }
.num-q-item { display:flex; align-items:center; gap:12px; padding:12px 16px; border-bottom:1px solid var(--border); border-right:1px solid var(--border); }
.num-q-item:nth-child(odd):last-child { grid-column: span 2; }
.num-q-num { width:28px; height:28px; border-radius:50%; background:#f4f6f3; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:var(--muted); flex-shrink:0; }
.num-q-text { font-size:14px; font-weight:500; color:var(--text); flex:1; }
.num-q-answer { font-size:13px; font-weight:700; color:#0F6E56; background:#e1f5ee; padding:2px 10px; border-radius:6px; display:none; }
.num-q-answer.visible { display:inline-block; }
.num-q-problem { font-size:13px; line-height:1.7; background:#f8f9fa; padding:12px; border-radius:8px; border-left:3px solid var(--accent); margin:0; flex:1; }

/* Encode table */
#encode-table { width:100%; border-collapse:collapse; font-size:13px; }
#encode-table th { background:#f4f6f3; padding:10px 14px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); border-bottom:1px solid var(--border); }
#encode-table td { padding:8px 14px; border-bottom:1px solid var(--border); vertical-align:middle; }
.encode-input { width:70px; height:36px; border:1.5px solid var(--border); border-radius:8px; padding:0 10px; font-size:14px; font-weight:600; text-align:center; font-family:'DM Sans',sans-serif; outline:none; transition:border-color .18s; }
.encode-input:focus { border-color:var(--accent); }
.encode-pct { font-weight:700; font-size:14px; }
.mastery-pill { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
.mp-mastered  { background:#e1f5ee; color:#0F6E56; }
.mp-developing{ background:#fef3c7; color:#92400E; }
.mp-needs     { background:#fcecea; color:#C0392B; }

/* Mastery table */
#num-mastery-body table,
#num-history-body table { width:100%; border-collapse:collapse; font-size:13px; }
#num-mastery-body th,
#num-history-body th { background:#f4f6f3; padding:8px 12px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); border-bottom:1px solid var(--border); }
#num-mastery-body td,
#num-history-body td { padding:9px 12px; border-bottom:1px solid var(--border); }
.skill-bar-wrap { display:flex; align-items:center; gap:8px; }
.skill-bar { flex:1; height:7px; background:#f0f0f0; border-radius:4px; overflow:hidden; min-width:60px; }
.skill-bar-fill { height:100%; border-radius:4px; }
.sb-green { background:#1D9E75; }
.sb-amber { background:#F59E0B; }
.sb-red   { background:#C0392B; }
.intervention-row { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-radius:10px; background:#fff8f8; border:1px solid #fca5a5; margin-bottom:8px; }
</style>

<script>
// ── State ─────────────────────────────────────────────────────
var numHistory = [];
var currentDrill = { id:0, questions:[], skill:'', skillName:'', level:1, total:0, label:'', saved:false };

// Load latest drill and scores from DB on page load
document.addEventListener('DOMContentLoaded', function(){
  updateDifficultyLabels();
  loadDrillFromDB();
  loadScoresFromDB();
});

function loadDrillFromDB(){
  fetch('dashboard.php?action=get_drill', {credentials:'same-origin'})
    .then(function(r){ return r.json(); })
    .then(function(d){
      if(d.ok && d.drill){
        var dr = d.drill;
        currentDrill.id        = dr.id;
        currentDrill.skill     = dr.skill;
        currentDrill.skillName = dr.skill_name;
        currentDrill.level     = dr.level;
        currentDrill.total     = dr.total_items;
        currentDrill.label     = dr.label;
        currentDrill.saved     = dr.saved == 1;
        try { currentDrill.questions = JSON.parse(dr.questions); } catch(e){ currentDrill.questions = []; }
        if(currentDrill.questions.length) restoreDrillUI();
      }
    }).catch(function(){});
}

function loadScoresFromDB(){
  fetch('dashboard.php?action=get_scores', {credentials:'same-origin'})
    .then(function(r){ return r.json(); })
    .then(function(d){
      if(d.ok && d.scores && d.scores.length){
        numHistory = d.scores;
      }
    }).catch(function(){});
}

function restoreDrillUI(){
  var skillLabels={addition:'Addition',subtraction:'Subtraction',multiplication:'Multiplication',division:'Division',problem_solving:'Problem Solving'};
  var html='';
  currentDrill.questions.forEach(function(q,i){
    if(q.isProblem){
      html+='<div style="padding:14px 16px;border-bottom:1px solid var(--border);">'+
        '<div style="display:flex;gap:12px;align-items:flex-start;">'+
        '<div class="num-q-num">'+(i+1)+'</div>'+
        '<div class="num-q-problem">'+q.q+'<br><span style="font-size:12px;color:var(--muted);">Answer: ___________</span></div>'+
        '<span class="num-q-answer" id="ans-'+i+'">'+q.ans+'</span>'+
        '</div></div>';
    } else {
      html+='<div class="num-q-item">'+
        '<div class="num-q-num">'+(i+1)+'</div>'+
        '<div class="num-q-text">'+q.q+'</div>'+
        '<span class="num-q-answer" id="ans-'+i+'">'+q.ans+'</span>'+
        '</div>';
    }
  });
  document.getElementById('num-drill-questions').innerHTML='<div class="num-q-grid">'+html+'</div>';
  document.getElementById('num-drill-title').textContent = currentDrill.label+' ('+currentDrill.total+' items)';
  document.getElementById('num-drill-output').style.display='block';
  document.getElementById('show-answers').checked=false;

  // Restore saved state on button
  if(currentDrill.saved){
    var btn=document.querySelector('#num-tab-encode .card-action.primary');
    if(btn){ btn.disabled=true; btn.textContent='✅ Scores Saved'; btn.style.opacity='0.6'; btn.style.cursor='not-allowed'; }
  }
}

// ── Tab switcher ──────────────────────────────────────────────
function numTab(name, btn) {
  document.querySelectorAll('.num-tab').forEach(function(t){ t.classList.remove('active'); });
  document.querySelectorAll('.tabs .tab-btn').forEach(function(b){ b.classList.remove('active'); });
  var tabEl = document.getElementById('num-tab-'+name);
  if(tabEl) tabEl.classList.add('active');
  if(btn) btn.classList.add('active');
  if(name==='mastery') renderNumMastery();
  if(name==='history') renderNumHistory();
  if(name==='encode')  renderEncodeForm();
}

// ── Difficulty labels ─────────────────────────────────────────
function updateDifficultyLabels(){
  var skill=document.getElementById('num-skill').value;
  var d=document.getElementById('num-difficulty');
  if(skill==='problem_solving'){
    d.options[0].text='Level 1 — Simple (1-step word problems)';
    d.options[1].text='Level 2 — Medium (2-step word problems)';
    d.options[2].text='Level 3 — Hard (multi-step mixed)';
  } else {
    d.options[0].text='Level 1 — Basic (single digit)';
    d.options[1].text='Level 2 — Intermediate (double digit)';
    d.options[2].text='Level 3 — Advanced (triple digit)';
  }
}

// ── Question generator ────────────────────────────────────────
function rnd(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }

function genQ(skill, level){
  var a,b,c,ans,q,isProblem=false;
  if(skill==='addition'){
    if(level==1){a=rnd(1,9);b=rnd(1,9);}
    else if(level==2){a=rnd(11,99);b=rnd(11,99);}
    else{a=rnd(101,999);b=rnd(101,999);}
    ans=a+b; q=a+' + '+b+' = ___';
  } else if(skill==='subtraction'){
    if(level==1){a=rnd(3,9);b=rnd(1,a-1);}
    else if(level==2){a=rnd(20,99);b=rnd(10,a-1);}
    else{a=rnd(200,999);b=rnd(100,a-1);}
    ans=a-b; q=a+' − '+b+' = ___';
  } else if(skill==='multiplication'){
    if(level==1){a=rnd(1,9);b=rnd(1,9);}
    else if(level==2){a=rnd(2,9);b=rnd(10,19);}
    else{a=rnd(11,19);b=rnd(11,19);}
    ans=a*b; q=a+' × '+b+' = ___';
  } else if(skill==='division'){
    if(level==1){b=rnd(1,9);ans=rnd(1,9);a=b*ans;}
    else if(level==2){b=rnd(2,9);ans=rnd(2,12);a=b*ans;}
    else{b=rnd(2,12);ans=rnd(10,20);a=b*ans;}
    q=a+' ÷ '+b+' = ___';
  } else {
    isProblem=true;
    var templates=[
      {t:'Si {name1} ay may {a} {obj}. Binigyan siya ni {name2} ng {b} pa. Ilan lahat ang {obj}?', fn:function(x,y){return x+y;}, l:1},
      {t:'May {a} {obj} sa basket. Kinuha ang {b}. Ilan ang natira?', fn:function(x,y){return x-y;}, l:1},
      {t:'Bawat kahon ay may {a} {obj}. May {b} kahon. Ilan lahat?', fn:function(x,y){return x*y;}, l:1},
      {t:'Si {name1} ay may {a} piso. Bumili siya ng {obj1} na {b} piso at {obj2} na {c} piso. Magkano ang natitira?', fn:function(x,y,z){return x-y-z;}, l:2, three:true},
      {t:'May {a} mangga sa bawat puno. May {b} puno. Ibinigay ang {c} mangga. Ilan ang natira?', fn:function(x,y,z){return x*y-z;}, l:2, three:true},
    ];
    var names=['Ana','Pedro','Maria','Juan','Rosa','Carlo','Lisa','Mario'];
    var objs=['mangga','tinapay','lapis','libro','kendi','mansanas','bola'];
    var n1=names[rnd(0,names.length-1)], n2=names[rnd(0,names.length-1)];
    var obj=objs[rnd(0,objs.length-1)];
    var filtered=templates.filter(function(t){return t.l<=level;});
    var tmpl=filtered[rnd(0,filtered.length-1)];
    if(tmpl.three){
      if(level==2){a=rnd(20,50);b=rnd(5,15);c=rnd(3,10);}
      else{a=rnd(50,200);b=rnd(10,30);c=rnd(10,20);}
      ans=Math.abs(tmpl.fn(a,b,c));
      q=tmpl.t.replace('{a}',a).replace('{b}',b).replace('{c}',c)
        .replace('{name1}',n1).replace('{name2}',n2)
        .replace('{obj}',obj).replace('{obj1}',objs[rnd(0,objs.length-1)])
        .replace('{obj2}',objs[rnd(0,objs.length-1)]);
    } else {
      if(level==1){a=rnd(2,9);b=rnd(1,a);}
      else{a=rnd(10,30);b=rnd(5,a);}
      ans=Math.abs(tmpl.fn(a,b));
      q=tmpl.t.replace('{a}',a).replace('{b}',b)
        .replace('{name1}',n1).replace('{name2}',n2).replace('{obj}',obj);
    }
  }
  return {q:q, ans:ans, isProblem:isProblem};
}

// ── Generate class drill ──────────────────────────────────────
function generateClassDrill(){
  var skill=document.getElementById('num-skill').value;
  var level=parseInt(document.getElementById('num-difficulty').value);
  var items=parseInt(document.getElementById('num-items').value);
  var label=document.getElementById('num-session-label').value.trim();
  var skillLabels={addition:'Addition',subtraction:'Subtraction',multiplication:'Multiplication',division:'Division',problem_solving:'Problem Solving'};
  var skillEmoji={addition:'➕',subtraction:'➖',multiplication:'✖️',division:'➗',problem_solving:'📖'};

  var questions=[];
  for(var i=0;i<items;i++) questions.push(genQ(skill,level));

  currentDrill = { questions:questions, skill:skill, skillName:skillLabels[skill], skillEmoji:skillEmoji[skill], level:level, total:items, label:label||skillLabels[skill]+' Drill — Level '+level, saved:false };

  // Save drill to DB
  var fd = new FormData();
  fd.append('action',     'save_drill');
  fd.append('skill',      currentDrill.skill);
  fd.append('skill_name', currentDrill.skillName);
  fd.append('level',      currentDrill.level);
  fd.append('total',      currentDrill.total);
  fd.append('label',      currentDrill.label);
  fd.append('questions',  JSON.stringify(currentDrill.questions));
  fd.append('section_id', '<?= $section_id ?? 0 ?>');
  fetch('dashboard.php', {method:'POST',body:fd,credentials:'same-origin'})
    .then(function(r){
      var clone = r.clone();
      return r.json().catch(function(){
        return clone.text().then(function(txt){
          toast('❌ save_drill raw response: '+txt.substring(0,120),'error');
          return {ok:false,error:'Not JSON: '+txt.substring(0,80)};
        });
      });
    })
    .then(function(d){
      if(d.ok){ currentDrill.id = d.drill_id; toast('✅ Drill saved (id:'+d.drill_id+')','success'); }
      else { toast('❌ Drill save error: '+(d.error||'unknown'),'error'); console.error('save_drill error:',d); }
    }).catch(function(e){ toast('❌ save_drill: '+e.message,'error'); });

  // Re-enable save button for new drill
  var btn = document.querySelector('#num-tab-encode .card-action.primary');
  if(btn){ btn.disabled=false; btn.textContent='💾 Save All Scores'; btn.style.opacity='1'; btn.style.cursor='pointer'; }

  // Render questions grid
  var html='';
  questions.forEach(function(q,i){
    if(q.isProblem){
      html+='<div style="padding:14px 16px;border-bottom:1px solid var(--border);">'+
        '<div style="display:flex;gap:12px;align-items:flex-start;">'+
        '<div class="num-q-num">'+(i+1)+'</div>'+
        '<div class="num-q-problem">'+q.q+'<br><span style="font-size:12px;color:var(--muted);">Answer: ___________</span></div>'+
        '<span class="num-q-answer" id="ans-'+i+'">'+q.ans+'</span>'+
        '</div></div>';
    } else {
      html+='<div class="num-q-item">'+
        '<div class="num-q-num">'+(i+1)+'</div>'+
        '<div class="num-q-text">'+q.q+'</div>'+
        '<span class="num-q-answer" id="ans-'+i+'">'+q.ans+'</span>'+
        '</div>';
    }
  });

  document.getElementById('num-drill-questions').innerHTML=
    '<div class="num-q-grid">'+html+'</div>';
  document.getElementById('num-drill-title').textContent=currentDrill.label+' ('+items+' items)';
  document.getElementById('num-drill-output').style.display='block';
  document.getElementById('show-answers').checked=false;
  document.getElementById('num-drill-output').scrollIntoView({behavior:'smooth',block:'start'});
  toast('✅ Drill generated! '+items+' items ready.','success');
}

// ── Show/hide answers ─────────────────────────────────────────
function toggleAnswers(show){
  document.querySelectorAll('.num-q-answer').forEach(function(el){
    el.classList.toggle('visible', show);
  });
}

// ── Print drill ───────────────────────────────────────────────
function printDrill(){
  if(!currentDrill.questions.length){ toast('⚠️ Generate a drill first.','warn'); return; }

  var questionsHtml = '';
  currentDrill.questions.forEach(function(q,i){
    if(q.isProblem){
      questionsHtml += '<div style="margin-bottom:18px;padding:12px;border:1px solid #ddd;border-radius:6px;">'+
        '<div style="font-weight:700;margin-bottom:6px;font-size:13px;">'+(i+1)+'. '+q.q+'</div>'+
        '<div style="font-size:12px;color:#666;">Answer: _________________________________</div>'+
        '</div>';
    } else {
      questionsHtml += '<div style="display:flex;align-items:center;padding:10px 0;border-bottom:1px solid #eee;font-size:15px;">'+
        '<span style="font-weight:700;width:32px;color:#666;">'+(i+1)+'.</span>'+
        '<span style="flex:1;">'+q.q.replace('= ___','')+'=</span>'+
        '<span style="border-bottom:2px solid #000;display:inline-block;width:80px;">&nbsp;</span>'+
        '</div>';
    }
  });

  var printHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8">'+
    '<title>'+currentDrill.label+'</title>'+
    '<style>'+
      'body{font-family:Arial,sans-serif;padding:24px;max-width:700px;margin:0 auto;color:#000;}'+
      'h2{font-size:18px;margin:0 0 4px;}'+
      '.meta{font-size:12px;color:#555;margin-bottom:6px;}'+
      '.info-row{display:flex;gap:24px;border:1px solid #000;padding:8px 12px;border-radius:4px;margin-bottom:20px;font-size:13px;}'+
      '.info-row span{flex:1;}'+
      '@media print{button{display:none!important;}}'+
    '</style></head><body>'+
    '<h2>'+currentDrill.label+'</h2>'+
    '<div class="meta">ARAL Numeracy Practice — '+currentDrill.skillName+' Level '+currentDrill.level+'</div>'+
    '<div class="info-row">'+
      '<span>Name: _______________________</span>'+
      '<span>Section: ___________</span>'+
      '<span>Date: ___________</span>'+
      '<span>Score: ____/'+currentDrill.total+'</span>'+
    '</div>'+
    '<div>'+questionsHtml+'</div>'+
    '<br><div style="text-align:right;font-size:11px;color:#aaa;">ARAL Monitor — Generated '+new Date().toLocaleDateString('en-PH')+'</div>'+
    '<br><button onclick="window.print()" style="padding:8px 20px;background:#1D9E75;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;">🖨️ Print</button>'+
    '</body></html>';

  var pw = window.open('','_blank','width=800,height=700');
  pw.document.write(printHtml);
  pw.document.close();
  pw.focus();
}

// ── Encode Form ───────────────────────────────────────────────
function renderEncodeForm(){
  if(!currentDrill.questions.length){
    document.getElementById('encode-no-drill').style.display='block';
    document.getElementById('encode-form').style.display='none';
    return;
  }
  document.getElementById('encode-no-drill').style.display='none';
  document.getElementById('encode-form').style.display='block';
  document.getElementById('encode-drill-label').textContent=currentDrill.label+' ('+currentDrill.total+' items)';
  document.getElementById('encode-total-items').textContent=currentDrill.total;

  // Build table rows from $students
  var students = <?php
    $studentList = [];
    foreach($students as $s){
      $studentList[] = ['id'=>$s['id'], 'name'=>$s['first_name'].' '.$s['last_name']];
    }
    echo json_encode($studentList);
  ?>;

  var rows='';
  students.forEach(function(s,i){
    rows+='<tr id="enc-row-'+s.id+'">'+
      '<td style="color:var(--muted);font-size:12px;">'+(i+1)+'</td>'+
      '<td style="font-weight:500;">'+s.name+'</td>'+
      '<td><input class="encode-input" type="number" min="0" max="'+currentDrill.total+'" id="enc-'+s.id+'" placeholder="0" oninput="updateEncPct('+s.id+','+currentDrill.total+')" onkeydown="encNextRow(event,'+i+','+students.length+','+s.id+')"></td>'+
      '<td><span class="encode-pct" id="pct-'+s.id+'" style="color:var(--muted);">—</span></td>'+
      '<td><span id="mst-'+s.id+'">—</span></td>'+
      '</tr>';
  });
  document.getElementById('encode-tbody').innerHTML=rows;

  // Focus first input
  if(students.length){
    setTimeout(function(){ var f=document.getElementById('enc-'+students[0].id); if(f) f.focus(); },100);
  }
}

function encNextRow(e, idx, total, id){
  if(e.key==='Enter' || e.key==='Tab'){
    e.preventDefault();
    var students=<?php echo json_encode(array_values(array_map(function($s){ return ['id'=>$s['id']]; }, $students))); ?>;
    var nextIdx=idx+1;
    if(nextIdx<students.length){
      var next=document.getElementById('enc-'+students[nextIdx].id);
      if(next) next.focus();
    }
  }
}

function updateEncPct(id, total){
  var inp=document.getElementById('enc-'+id);
  var val=parseInt(inp.value);
  if(isNaN(val)||val<0){val=0;} if(val>total){val=total; inp.value=total;}
  var pct=Math.round(val/total*100);
  var pctEl=document.getElementById('pct-'+id);
  var mstEl=document.getElementById('mst-'+id);
  pctEl.textContent=pct+'%';
  pctEl.style.color=pct>=75?'#0F6E56':pct>=50?'#92400E':'#C0392B';
  var mst=pct>=75?'mastered':pct>=50?'developing':'needs';
  var mstLabel={mastered:'✅ Mastered',developing:'⚠️ Developing',needs:'❌ Needs Support'};
  var mstCls={mastered:'mp-mastered',developing:'mp-developing',needs:'mp-needs'};
  mstEl.innerHTML='<span class="mastery-pill '+mstCls[mst]+'">'+mstLabel[mst]+'</span>';
}

function saveAllScores(){
  if(currentDrill.saved){
    toast('⚠️ Already saved. Generate a new drill to record new scores.','warn');
    return;
  }

  var students=<?php echo json_encode(array_values(array_map(function($s){ return ['id'=>$s['id'], 'name'=>$s['first_name'].' '.$s['last_name']]; }, $students))); ?>;
  var scores=[];
  var skipped=0;

  students.forEach(function(s){
    var inp=document.getElementById('enc-'+s.id);
    if(!inp||inp.value===''){skipped++;return;}
    var correct=parseInt(inp.value)||0;
    var pct=Math.round(correct/currentDrill.total*100);
    var mst=pct>=75?'mastered':pct>=50?'developing':'needs';
    scores.push({
      student_id: s.id,
      student_name: s.name,
      skill: currentDrill.skill,
      skill_name: currentDrill.skillName,
      level: currentDrill.level,
      total: currentDrill.total,
      correct: correct,     // maps to raw_score in DB
      percent: pct,         // maps to pct_score in DB
      mastery: mst,
      session_label: currentDrill.label  // maps to quiz_id in DB
    });
  });

  if(!scores.length){ toast('⚠️ No scores entered yet.','warn'); return; }

  // Disable button immediately to prevent double-click
  var btn=document.querySelector('#num-tab-encode .card-action.primary');
  if(btn){ btn.disabled=true; btn.textContent='💾 Saving...'; btn.style.opacity='0.7'; }

  var fd=new FormData();
  fd.append('action',   'save_scores');
  fd.append('drill_id', currentDrill.id||0);
  fd.append('scores',   JSON.stringify(scores));

  fetch('dashboard.php',{method:'POST',body:fd,credentials:'same-origin'})
    .then(function(r){
      var clone=r.clone();
      return r.json().catch(function(){
        return clone.text().then(function(txt){
          return {ok:false,error:'Not JSON: '+txt.substring(0,120)};
        });
      });
    })
    .then(function(d){
      if(d.ok){
        currentDrill.saved=true;
        // Add to local numHistory for immediate mastery view
        scores.forEach(function(sc){ numHistory.unshift(Object.assign({},sc,{scored_at:new Date().toISOString()})); });
        if(btn){ btn.textContent='✅ Scores Saved'; btn.style.opacity='0.6'; btn.style.cursor='not-allowed'; }
        toast('✅ Saved '+d.saved+' score'+(d.saved>1?'s':'')+(skipped>0?' ('+skipped+' skipped)':'')+'!','success');
      } else {
        if(btn){ btn.disabled=false; btn.textContent='💾 Save All Scores'; btn.style.opacity='1'; btn.style.cursor='pointer'; }
        toast('❌ Save failed: '+(d.error||'unknown error'),'error');
      }
    }).catch(function(e){
      if(btn){ btn.disabled=false; btn.textContent='💾 Save All Scores'; btn.style.opacity='1'; btn.style.cursor='pointer'; }
      toast('❌ Network error. Try again.','error');
    });
}

// ── Mastery overview ──────────────────────────────────────────
function renderNumMastery(){
  // Reload from DB first for fresh data
  var body=document.getElementById('num-mastery-body');
  var intBody=document.getElementById('num-intervention-body');
  if(!numHistory.length){
    body.innerHTML='<div style="text-align:center;padding:32px;color:#9CA3A0;font-size:13px;">No scores yet.</div>';
    intBody.innerHTML='<div style="text-align:center;padding:32px;color:#9CA3A0;font-size:13px;">No flags yet.</div>';
    return;
  }
  var skills=['addition','subtraction','multiplication','division','problem_solving'];
  var sLabels={addition:'Addition',subtraction:'Subtraction',multiplication:'Multiplication',division:'Division',problem_solving:'Problem Solving'};
  var sEmoji={addition:'➕',subtraction:'➖',multiplication:'✖️',division:'➗',problem_solving:'📖'};

  var studentMap={};
  numHistory.forEach(function(h){
    if(!studentMap[h.student_id]) studentMap[h.student_id]={name:h.student_name,scores:{}};
    if(!studentMap[h.student_id].scores[h.skill]) studentMap[h.student_id].scores[h.skill]=[];
    studentMap[h.student_id].scores[h.skill].push(h.percent);
  });

  var thead='<tr><th>Student</th>'+skills.map(function(sk){return '<th>'+sEmoji[sk]+' '+sLabels[sk]+'</th>';}).join('')+'</tr>';
  var tbody=''; var interventions=[];

  Object.keys(studentMap).forEach(function(id){
    var st=studentMap[id];
    var row='<td style="font-weight:500;">'+st.name+'</td>';
    skills.forEach(function(sk){
      var arr=st.scores[sk]||[];
      if(!arr.length){row+='<td style="color:var(--muted);font-size:12px;text-align:center;">—</td>';return;}
      var avg=Math.round(arr.reduce(function(a,b){return a+b;},0)/arr.length);
      var bc=avg>=75?'sb-green':avg>=50?'sb-amber':'sb-red';
      var badge=avg>=75?'badge-green':avg>=50?'badge-amber':'badge-red';
      row+='<td><div class="skill-bar-wrap"><div class="skill-bar"><div class="skill-bar-fill '+bc+'" style="width:'+avg+'%"></div></div><span class="badge '+badge+'" style="font-size:11px;min-width:36px;text-align:center;">'+avg+'%</span></div></td>';
      if(avg<75) interventions.push({name:st.name,skill:sLabels[sk],avg:avg});
    });
    tbody+='<tr>'+row+'</tr>';
  });

  body.innerHTML='<div style="overflow-x:auto;"><table><thead>'+thead+'</thead><tbody>'+tbody+'</tbody></table></div>';
  intBody.innerHTML=!interventions.length
    ?'<div style="text-align:center;padding:20px;color:#0F6E56;font-size:13px;">✅ All students at or above 75%!</div>'
    :interventions.map(function(r){
      return '<div class="intervention-row"><div><strong>'+r.name+'</strong> — '+r.skill+'</div><span class="badge badge-red">'+r.avg+'% avg</span></div>';
    }).join('');
}

// ── History ───────────────────────────────────────────────────
function renderNumHistory(){
  var body=document.getElementById('num-history-body');
  if(!numHistory.length){body.innerHTML='<div style="text-align:center;padding:32px;color:#9CA3A0;font-size:13px;">No history yet.</div>';return;}
  var sEmoji={addition:'➕',subtraction:'➖',multiplication:'✖️',division:'➗',problem_solving:'📖'};
  var lBadge={mastered:'badge-green',developing:'badge-amber',needs:'badge-red'};
  var rows=numHistory.map(function(h){
    return '<tr>'+
      '<td style="font-weight:500;">'+h.student_name+'</td>'+
      '<td>'+(sEmoji[h.skill]||'🔢')+' '+(h.skill_name||h.skill||'—')+'</td>'+
      '<td style="font-size:12px;color:var(--muted);">'+(h.session_label||h.quiz_id||'—')+'</td>'+
      '<td>'+(h.correct||h.raw_score||0)+'/'+(h.total||h.total_items||'?')+'</td>'+
      '<td><strong>'+(h.percent||h.pct_score||0)+'%</strong></td>'+
      '<td><span class="badge '+(lBadge[h.mastery]||'')+'">'+h.mastery+'</span></td>'+
      '<td style="font-size:11px;color:var(--muted);">'+new Date(h.scored_at||h.date||'').toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})+'</td>'+
      '</tr>';
  }).join('');
  body.innerHTML='<div style="overflow-x:auto;"><table><thead><tr><th>Student</th><th>Skill</th><th>Session</th><th>Score</th><th>%</th><th>Mastery</th><th>Date</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}

function clearNumHistory(){
  if(!confirm('This only clears your local view. DB scores remain intact. Continue?')) return;
  numHistory=[];
  renderNumHistory(); renderNumMastery();
  toast('Local view cleared. Reload page to restore from DB.','warn');
}
</script>