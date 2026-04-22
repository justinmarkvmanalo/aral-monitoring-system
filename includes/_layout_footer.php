<div class="toast" id="toast-el"></div>

<script>
// ── Navigation ────────────────────────────────────────────────
const pages = ['dashboard','attendance','reading','numeracy','science','intervention','reports'];
function navigate(page, el) {
  pages.forEach(p => {
    const pg = document.getElementById('page-' + p);
    if (pg) pg.style.display = 'none';
  });
  const t = document.getElementById('page-' + page);
  if (t) t.style.display = 'block';
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  if (el) el.classList.add('active');
}

// ── Toast ─────────────────────────────────────────────────────
function toast(msg) {
  const t = document.getElementById('toast-el');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

// ── Modal ─────────────────────────────────────────────────────
function openAddStudent() {
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}
function closeModalOutside(event) {
  if (event.target === document.getElementById('modal-overlay')) closeModal();
}

// ── Auto-navigate based on URL ?tab= param (used after PRG redirect) ──
<?php if (!empty($add_success)): ?>
window.addEventListener('DOMContentLoaded', () => {
  navigate('attendance', document.querySelector('[onclick*=attendance]'));
});
<?php endif; ?>

// ── Open modal / show error if add_student POST failed ────────
<?php if (!empty($add_error)): ?>
window.addEventListener('DOMContentLoaded', () => {
  openAddStudent();
  const alertEl = document.getElementById('modal-alert');
  alertEl.innerHTML = '<div class="modal-alert err">⚠️ <?= addslashes(htmlspecialchars($add_error)) ?></div>';
  alertEl.style.display = 'block';
  navigate('attendance', document.querySelector('[onclick*=attendance]'));
});
<?php endif; ?>

// ── Attendance cycling ────────────────────────────────────────
const cycleStatus = { '': 'P', 'P': 'A', 'A': 'L', 'L': '' };
const cycleLabel  = { '': '–', 'P': 'P', 'A': 'A', 'L': 'L' };

// Recounts today's attendance from live DOM badges and updates stat cards
function updateStatCards() {
  const today = '<?= date('Y-m-d') ?>'; // PHP server date — avoids UTC timezone mismatch
  let present = 0, absent = 0, late = 0;
  document.querySelectorAll('.att-badge[data-date="' + today + '"]').forEach(function(el) {
    var s = el.dataset.status;
    if (s === 'P') present++;
    else if (s === 'A') absent++;
    else if (s === 'L') late++;
  });
  // Update the stat card values
  var cards = document.querySelectorAll('#page-attendance .stat-card .value');
  if (cards[0]) cards[0].textContent = present;
  if (cards[1]) cards[1].textContent = absent;
  if (cards[2]) cards[2].textContent = late;
  // Update absent needs-follow-up badge
  var absentCard = document.querySelectorAll('#page-attendance .stat-card')[1];
  if (absentCard) {
    var badge = absentCard.querySelector('.badge');
    if (absent > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'badge badge-red';
        absentCard.appendChild(badge);
      }
      badge.textContent = 'needs follow-up';
    } else if (badge) {
      badge.remove();
    }
  }
}

function cycleAtt(event) {
  const el   = event.currentTarget;
  const curr = el.dataset.status;
  const next = cycleStatus[curr] ?? 'P';

  el.textContent    = cycleLabel[next];
  el.dataset.status = next;
  el.className      = 'att-badge att-' + next;

  const fd = new FormData();
  fd.append('action',       'toggle_att');
  fd.append('student_id',   el.dataset.student);
  fd.append('session_date', el.dataset.date);
  fd.append('status',       next);

  fetch('dashboard.php', { method: 'POST', body: fd })
    .then(r => r.json())
    .then(d => {
      if (d.ok) {
        const labels = { '': 'Cleared', 'P': 'Present', 'A': 'Absent', 'L': 'Late' };
        toast('Saved: ' + (labels[next] ?? next));
        updateStatCards(); // ← update Present/Absent/Late counts live
      } else {
        toast('Server error — please try again');
      }
    })
    .catch(() => toast('Network error — check your connection'));
}

// ── Tab switcher ──────────────────────────────────────────────
function switchTab(tab, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  btn.classList.add('active');
}

// ── Numeracy Quiz ─────────────────────────────────────────────
const quizData = [
  {q:'24 + 37 = ?',ans:61},{q:'56 + 19 = ?',ans:75},
  {q:'43 + 28 = ?',ans:71},{q:'17 + 65 = ?',ans:82},{q:'38 + 47 = ?',ans:85}
];
function buildQuiz() {
  const w = document.getElementById('quiz-items');
  if (!w) return;
  w.innerHTML = '';
  quizData.forEach((item,i) => {
    w.innerHTML += `<div class="quiz-row">
      <span class="quiz-q">${i+1}. ${item.q}</span>
      <input class="quiz-input" type="number" id="qans-${i}" placeholder="?"/>
      <span class="quiz-result" id="qres-${i}"></span>
    </div>`;
  });
}
function gradeQuiz() {
  let score = 0;
  quizData.forEach((item,i) => {
    const inp = document.getElementById('qans-'+i);
    const res = document.getElementById('qres-'+i);
    if (parseInt(inp.value) === item.ans) { score++; res.innerHTML='<span class="badge badge-green">✓</span>'; }
    else { res.innerHTML=`<span class="badge badge-red">${item.ans}</span>`; }
  });
  const pct = Math.round(score/quizData.length*100);
  document.getElementById('quiz-score-wrap').style.display='block';
  document.getElementById('quiz-score-text').textContent =
    `Score: ${score}/${quizData.length} (${pct}%) — ${pct>=80?'Mastered!':pct>=60?'Developing — needs practice':'Below mastery — recommend intervention'}`;
}

// ── Mastery Bars ──────────────────────────────────────────────
const masteryData = [
  {label:'Addition',val:76,color:'#1D9E75'},{label:'Subtraction',val:68,color:'#1D9E75'},
  {label:'Multiplication',val:52,color:'#EF9F27'},{label:'Problem Solving',val:45,color:'#E24B4A'}
];
function buildMastery() {
  const w = document.getElementById('mastery-bars');
  if (!w) return;
  w.innerHTML = '';
  masteryData.forEach(m => {
    w.innerHTML += `<div class="mastery-row">
      <span class="mastery-label">${m.label}</span>
      <div class="mastery-bar-wrap"><div class="mastery-bar" style="width:${m.val}%;background:${m.color};"></div></div>
      <span class="mastery-pct">${m.val}%</span>
    </div>`;
  });
}

// ── Science Quiz ──────────────────────────────────────────────
const scienceQs = [
  {q:'Living things need food, water, and _____ to survive.',opts:['sunlight','wind','rocks','noise'],ans:0},
  {q:'Which of these is NOT a living thing?',opts:['tree','stone','mushroom','ant'],ans:1},
  {q:'Animals that eat only plants are called _____.', opts:['carnivores','omnivores','herbivores','predators'],ans:2}
];
function buildScienceQuiz() {
  const w = document.getElementById('science-quiz');
  if (!w) return;
  w.innerHTML = '';
  scienceQs.forEach((q,i) => {
    let opts = q.opts.map((o,j)=>`<label style="display:flex;align-items:center;gap:8px;padding:6px 0;cursor:pointer;font-size:13px;"><input type="radio" name="sq${i}" value="${j}" style="accent-color:var(--accent);"> ${o}</label>`).join('');
    w.innerHTML += `<div style="margin-bottom:16px;"><p style="font-size:13px;font-weight:500;margin-bottom:8px;">${i+1}. ${q.q}</p>${opts}</div>`;
  });
}
function gradeScienceQuiz() {
  let score = 0;
  scienceQs.forEach((q,i) => {
    const sel = document.querySelector(`input[name="sq${i}"]:checked`);
    if (sel && parseInt(sel.value)===q.ans) score++;
  });
  const pct = Math.round(score/scienceQs.length*100);
  document.getElementById('science-result').style.display='block';
  document.getElementById('science-score-text').textContent =
    `Score: ${score}/${scienceQs.length} (${pct}%) — ${pct===100?'Perfect!':pct>=67?'Good — review missed items.':'Concept review needed.'}`;
}

buildQuiz();
buildMastery();
buildScienceQuiz();
</script>
</body>
</html>
