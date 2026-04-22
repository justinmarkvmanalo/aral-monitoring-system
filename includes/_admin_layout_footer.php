<div class="toast" id="toast-el"></div>

<script>
// ── Navigation ────────────────────────────────────────────────
const pages = ['overview','teachers','sections','attendance','interventions','announcements','reports'];
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
  setTimeout(() => t.classList.remove('show'), 2600);
}

// ── Modals ────────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}
function closeModalOutside(event, id) {
  if (event.target === document.getElementById(id)) closeModal(id);
}

// ── Auto-navigate from URL ?tab= param ───────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const tab    = params.get('tab');
  if (tab) {
    const el = document.querySelector(`.nav-item[onclick*="${tab}"]`);
    navigate(tab, el);
  }

  // Re-open modal if there was a validation error (set via PHP session)
  <?php if (!empty($open_modal)): ?>
  openModal('modal-<?= $open_modal === 'add_teacher' ? 'add-teacher' : 'add-announcement' ?>');
  <?php endif; ?>
});

// ── Toggle Teacher Active/Inactive (AJAX) ────────────────────
function toggleTeacher(teacherId, isActive) {
  const status = isActive ? 1 : 0;
  const label  = document.getElementById('status-label-' + teacherId);
  const fd = new FormData();
  fd.append('action',     'toggle_teacher');
  fd.append('teacher_id', teacherId);
  fd.append('status',     status);

  fetch('admin_dashboard.php', { method: 'POST', body: fd })
    .then(r => r.json())
    .then(d => {
      if (d.ok) {
        label.textContent = isActive ? 'Active' : 'Inactive';
        label.style.color = isActive ? '#3B6D11' : '#9CA3A0';
        toast(isActive ? 'Teacher activated' : 'Teacher deactivated');
      }
    })
    .catch(() => toast('Error — check connection'));
}

// ── Delete Teacher (AJAX) ─────────────────────────────────────
function deleteTeacher(teacherId, name) {
  if (!confirm(`Delete teacher "${name}"?\nThis cannot be undone.`)) return;
  const fd = new FormData();
  fd.append('action',     'delete_teacher');
  fd.append('teacher_id', teacherId);

  fetch('admin_dashboard.php', { method: 'POST', body: fd })
    .then(r => r.json())
    .then(d => {
      if (d.ok) {
        const row = document.getElementById('teacher-row-' + teacherId);
        if (row) row.remove();
        toast('Teacher deleted');
      }
    })
    .catch(() => toast('Error — check connection'));
}

// ── Delete Announcement (AJAX) ────────────────────────────────
function deleteAnnouncement(annId, btn) {
  if (!confirm('Delete this announcement?')) return;
  const fd = new FormData();
  fd.append('action', 'delete_announcement');
  fd.append('ann_id', annId);

  fetch('admin_dashboard.php', { method: 'POST', body: fd })
    .then(r => r.json())
    .then(d => {
      if (d.ok) {
        btn.closest('.ann-item').remove();
        toast('Announcement deleted');
      }
    })
    .catch(() => toast('Error — check connection'));
}
</script>
</body>
</html>
