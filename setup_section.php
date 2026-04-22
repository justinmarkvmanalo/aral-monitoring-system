<?php
session_start();
if (!isset($_SESSION['teacher_id'])) {
    header("Location: login.php");
    exit;
}
include 'conn.php';

$teacher_id       = $_SESSION['teacher_id'];
$teacher_name     = $_SESSION['teacher_name'];
$teacher_initials = $_SESSION['teacher_initials'];

$error   = "";
$success = "";

// ── Check if teacher already has a section ────────────────────
$chk = $conn->prepare("SELECT id, section_name, grade_level FROM sections WHERE teacher_id = :teacher_id LIMIT 1");
$chk->execute(['teacher_id' => $teacher_id]);
$existing = $chk->fetch();
$existing_id = $existing ? (int) $existing['id'] : null;
$existing_section = $existing['section_name'] ?? null;
$existing_grade = isset($existing['grade_level']) ? (int) $existing['grade_level'] : null;

// ── Handle form submit ────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $sy_label    = trim($_POST['sy_label']    ?? '');
    $sy_start    = trim($_POST['sy_start']    ?? '');
    $sy_end      = trim($_POST['sy_end']      ?? '');
    $grade_level = intval($_POST['grade_level'] ?? 0);
    $section_name = trim($_POST['section_name'] ?? '');

    if (!$sy_label || !$sy_start || !$sy_end || !$grade_level || !$section_name) {
        $error = "All fields are required.";
    } elseif ($grade_level < 1 || $grade_level > 6) {
        $error = "Grade level must be between 1 and 6.";
    } else {
        // ── Get or create school year ─────────────────────────
        $sy_q = $conn->prepare("SELECT id FROM school_years WHERE label = :label LIMIT 1");
        $sy_q->execute(['label' => $sy_label]);
        $sy_id = $sy_q->fetchColumn();

        if (!$sy_id) {
            $sy_ins = $conn->prepare("INSERT INTO school_years (label, start_date, end_date) VALUES (:label, :start_date, :end_date) RETURNING id");
            $sy_ins->execute([
                'label' => $sy_label,
                'start_date' => $sy_start,
                'end_date' => $sy_end,
            ]);
            $sy_id = (int) $sy_ins->fetchColumn();
        }

        if ($existing_id) {
            // ── Update existing section ───────────────────────
            $upd = $conn->prepare("UPDATE sections SET school_year_id = :school_year_id, grade_level = :grade_level, section_name = :section_name WHERE id = :id");
            if ($upd->execute([
                'school_year_id' => $sy_id,
                'grade_level' => $grade_level,
                'section_name' => $section_name,
                'id' => $existing_id,
            ])) {
                $success = "Section updated successfully!";
                $existing_section = $section_name;
                $existing_grade   = $grade_level;
            } else {
                $error = "Update failed.";
            }
        } else {
            // ── Insert new section ────────────────────────────
            $ins = $conn->prepare(
                "INSERT INTO sections (school_year_id, grade_level, section_name, teacher_id)
                 VALUES (:school_year_id, :grade_level, :section_name, :teacher_id)"
            );
            if ($ins->execute([
                'school_year_id' => $sy_id,
                'grade_level' => $grade_level,
                'section_name' => $section_name,
                'teacher_id' => $teacher_id,
            ])) {
                $success = "Section created! Redirecting to dashboard...";
                header("refresh:2;url=dashboard.php");
            } else {
                $error = "Failed to create section.";
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Class Setup — ARAL Monitor</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --accent:     #1D9E75;
      --accent-mid: #0F6E56;
      --accent-lit: #E1F5EE;
      --bg:         #F4F6F3;
      --card:       #FFFFFF;
      --text:       #1A1F1C;
      --muted:      #6B7570;
      --border:     #DDE3DF;
      --danger:     #C0392B;
      --danger-bg:  #FCECEA;
      --success:    #0F6E56;
      --success-bg: #E1F5EE;
      --radius:     14px;
    }
    body {
      font-family: 'DM Sans', sans-serif;
      background: var(--bg); min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      padding: 24px; position: relative;
    }
    body::before {
      content: ''; position: fixed; inset: 0; pointer-events: none;
      background-image:
        radial-gradient(circle at 20% 20%, rgba(29,158,117,0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(15,110,86,0.06) 0%, transparent 50%);
    }
    .wrap { width: 100%; max-width: 500px; position: relative; z-index: 1; }

    /* BRAND */
    .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; justify-content: center; }
    .brand-dot {
      width: 40px; height: 40px; background: var(--accent); border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-family: 'DM Serif Display', serif; font-size: 20px; color: #fff;
      box-shadow: 0 4px 12px rgba(29,158,117,0.3);
    }
    .brand-name { font-family: 'DM Serif Display', serif; font-size: 22px; color: var(--text); }
    .brand-name span { color: var(--accent); }

    /* STEP INDICATOR */
    .steps {
      display: flex; align-items: center; justify-content: center;
      gap: 0; margin-bottom: 24px;
    }
    .step {
      display: flex; align-items: center; gap: 8px;
      font-size: 12px; color: var(--muted);
    }
    .step-dot {
      width: 24px; height: 24px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 600;
      background: var(--border); color: var(--muted);
    }
    .step.done .step-dot { background: #9FE1CB; color: #085041; }
    .step.active .step-dot { background: var(--accent); color: #fff; }
    .step.active { color: var(--text); font-weight: 500; }
    .step-line { width: 40px; height: 1.5px; background: var(--border); margin: 0 4px; }
    .step-line.done { background: #9FE1CB; }

    /* CARD */
    .card {
      background: var(--card); border-radius: var(--radius);
      padding: 32px 32px 28px; border: 1px solid var(--border);
      box-shadow: 0 2px 24px rgba(0,0,0,0.06);
    }
    .card-icon { font-size: 28px; margin-bottom: 10px; }
    .card-title { font-size: 20px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
    .card-sub { font-size: 13.5px; color: var(--muted); margin-bottom: 24px; line-height: 1.5; }

    /* EXISTING SECTION BANNER */
    .section-banner {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 14px; background: var(--accent-lit);
      border: 1px solid #9FE1CB; border-radius: 10px;
      margin-bottom: 20px;
    }
    .section-banner .sb-icon { font-size: 20px; }
    .section-banner .sb-info { flex: 1; }
    .section-banner .sb-label { font-size: 11px; color: var(--accent-mid); font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }
    .section-banner .sb-val { font-size: 14px; font-weight: 600; color: var(--text); margin-top: 1px; }
    .section-banner .sb-link { font-size: 12px; color: var(--accent-mid); text-decoration: none; font-weight: 500; }
    .section-banner .sb-link:hover { text-decoration: underline; }

    /* ALERTS */
    .alert { padding: 11px 14px; border-radius: 8px; font-size: 13.5px; margin-bottom: 18px; line-height: 1.5; }
    .alert-error   { background: var(--danger-bg); color: var(--danger); border: 1px solid #f5c6c2; }
    .alert-success { background: var(--success-bg); color: var(--success); border: 1px solid #9FE1CB; }

    /* SECTION DIVIDER */
    .sec-divider {
      font-size: 11px; font-weight: 600; color: var(--muted);
      text-transform: uppercase; letter-spacing: 0.08em;
      margin: 20px 0 14px; display: flex; align-items: center; gap: 10px;
    }
    .sec-divider::before, .sec-divider::after {
      content: ''; flex: 1; height: 1px; background: var(--border);
    }

    /* FORM FIELDS */
    .field { margin-bottom: 16px; }
    .field label {
      display: block; font-size: 12px; font-weight: 500; color: var(--text);
      margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.04em;
    }
    .field label .req { color: #E24B4A; margin-left: 2px; }
    .field label .opt { color: var(--muted); font-weight: 400; text-transform: none; font-size: 11px; }
    .field input, .field select {
      width: 100%; height: 42px; border: 1.5px solid var(--border); border-radius: 9px;
      padding: 0 13px; font-size: 14px; font-family: 'DM Sans', sans-serif;
      color: var(--text); background: #FAFBFA; outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .field input:focus, .field select:focus {
      border-color: var(--accent); background: #fff;
      box-shadow: 0 0 0 3px rgba(29,158,117,0.12);
    }
    .field input::placeholder { color: #B0B9B4; }
    .field .hint { font-size: 11px; color: var(--muted); margin-top: 4px; }
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    /* BUTTON */
    .btn {
      width: 100%; height: 46px; background: var(--accent); color: #fff;
      border: none; border-radius: 10px; font-size: 15px; font-weight: 600;
      font-family: 'DM Sans', sans-serif; cursor: pointer;
      transition: background 0.15s, transform 0.1s;
      box-shadow: 0 3px 12px rgba(29,158,117,0.25);
      margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .btn:hover { background: var(--accent-mid); }
    .btn:active { transform: scale(0.98); }
    .btn-secondary {
      width: 100%; height: 42px; background: transparent; color: var(--muted);
      border: 1.5px solid var(--border); border-radius: 10px; font-size: 14px;
      font-family: 'DM Sans', sans-serif; cursor: pointer; margin-top: 10px;
      transition: background 0.12s; text-decoration: none;
      display: flex; align-items: center; justify-content: center;
    }
    .btn-secondary:hover { background: var(--bg); color: var(--text); }

    @media (max-width: 480px) {
      .card { padding: 24px 18px 20px; }
      .row2 { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
<div class="wrap">

  <div class="brand">
    <div class="brand-dot">A</div>
    <div class="brand-name">ARAL <span>Monitor</span></div>
  </div>

  <!-- Step indicator -->
  <div class="steps">
    <div class="step done">
      <div class="step-dot">✓</div>
      <span>Register</span>
    </div>
    <div class="step-line done"></div>
    <div class="step done">
      <div class="step-dot">✓</div>
      <span>Log in</span>
    </div>
    <div class="step-line <?= $existing_id ? 'done' : '' ?>"></div>
    <div class="step <?= $existing_id ? 'done' : 'active' ?>">
      <div class="step-dot"><?= $existing_id ? '✓' : '3' ?></div>
      <span>Set up class</span>
    </div>
  </div>

  <div class="card">
    <div class="card-icon">🏫</div>
    <div class="card-title"><?= $existing_id ? 'Update Class Section' : 'Set Up Your Class' ?></div>
    <div class="card-sub">
      <?php if ($existing_id): ?>
        Your current section is shown below. You can update it anytime.
      <?php else: ?>
        Before adding students, set up your class section. This only takes a minute and only needs to be done once.
      <?php endif; ?>
    </div>

    <!-- Show existing section if already set -->
    <?php if ($existing_id): ?>
    <div class="section-banner">
      <div class="sb-icon">📚</div>
      <div class="sb-info">
        <div class="sb-label">Current Section</div>
        <div class="sb-val">Grade <?= $existing_grade ?> – <?= htmlspecialchars($existing_section) ?></div>
      </div>
      <a href="dashboard.php" class="sb-link">Go to Dashboard →</a>
    </div>
    <?php endif; ?>

    <?php if (!empty($error)): ?>
      <div class="alert alert-error">⚠️ <?= htmlspecialchars($error) ?></div>
    <?php endif; ?>
    <?php if (!empty($success)): ?>
      <div class="alert alert-success">✓ <?= htmlspecialchars($success) ?></div>
    <?php endif; ?>

    <form method="POST" action="">

      <!-- School Year -->
      <div class="sec-divider">School Year</div>

      <div class="field">
        <label>School Year Label <span class="req">*</span></label>
        <input type="text" name="sy_label"
          value="<?= htmlspecialchars($_POST['sy_label'] ?? '2025-2026') ?>"
          placeholder="e.g. 2025-2026" maxlength="20" required/>
        <div class="hint">Format: YYYY-YYYY</div>
      </div>

      <div class="row2">
        <div class="field">
          <label>Start Date <span class="req">*</span></label>
          <input type="date" name="sy_start"
            value="<?= htmlspecialchars($_POST['sy_start'] ?? '2025-06-02') ?>" required/>
        </div>
        <div class="field">
          <label>End Date <span class="req">*</span></label>
          <input type="date" name="sy_end"
            value="<?= htmlspecialchars($_POST['sy_end'] ?? '2026-04-03') ?>" required/>
        </div>
      </div>

      <!-- Class Section -->
      <div class="sec-divider">Your Class</div>

      <div class="row2">
        <div class="field">
          <label>Grade Level <span class="req">*</span></label>
          <select name="grade_level" required>
            <option value="">— Select —</option>
            <?php for ($g = 1; $g <= 6; $g++): ?>
              <option value="<?= $g ?>"
                <?= (($_POST['grade_level'] ?? $existing_grade ?? '') == $g) ? 'selected' : '' ?>>
                Grade <?= $g ?>
              </option>
            <?php endfor; ?>
          </select>
        </div>
        <div class="field">
          <label>Section Name <span class="req">*</span></label>
          <input type="text" name="section_name"
            value="<?= htmlspecialchars($_POST['section_name'] ?? $existing_section ?? '') ?>"
            placeholder="e.g. Sampaguita" maxlength="50" required/>
          <div class="hint">Flower, color, or any name</div>
        </div>
      </div>

      <button type="submit" class="btn">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <?= $existing_id ? 'Update Section' : 'Save & Go to Dashboard' ?>
      </button>

    </form>

    <?php if ($existing_id): ?>
    <a href="dashboard.php" class="btn-secondary">← Back to Dashboard</a>
    <?php endif; ?>
  </div>

</div>
</body>
</html>
