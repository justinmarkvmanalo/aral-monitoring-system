<?php
// Suppress PHP error output so it never contaminates JSON responses
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

date_default_timezone_set('Asia/Manila');
session_start();

if (!isset($_SESSION['teacher_id'])) {
    // If this is an AJAX request, return JSON 401 instead of redirect
    if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) || isset($_GET['action']) || isset($_POST['action'])) {
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(['ok'=>false,'error'=>'Not authenticated']);
        exit;
    }
    header("Location: login.php");
    exit;
}
include 'conn.php';

$teacher_id       = intval($_SESSION['teacher_id']);
$teacher_name     = $_SESSION['teacher_name'];
$teacher_initials = $_SESSION['teacher_initials'];

// ── Numeracy AJAX handlers (conn + teacher_id now available) ─
$_na = $_POST['action'] ?? $_GET['action'] ?? '';
if (in_array($_na, ['ping','save_drill','get_drill','save_scores','get_scores'])) {
    while(ob_get_level()) ob_end_clean();
    header('Content-Type: application/json');

    if ($_na === 'ping') {
        echo json_encode(['ok'=>true,'msg'=>'pong']); exit;
    }

    if ($_na === 'get_drill') {
        $drill = null;
        $q = $conn->query("SELECT id,skill,skill_name,level,total_items,label,questions,saved FROM numeracy_drills WHERE teacher_id=$teacher_id ORDER BY created_at DESC LIMIT 1");
        if ($q) $drill = $q->fetch_assoc();
        $conn->close();
        echo json_encode(['ok'=>true,'drill'=>$drill]); exit;
    }

    if ($_na === 'get_scores') {
        $rows = [];
        $q = $conn->query(
            "SELECT ns.student_id, ns.raw_score, ns.pct_score, ns.mastery, ns.recorded_at,
                    nq.total_items, nq.quiz_date,
                    nsk.skill_name,
                    nd.skill, nd.label AS session_label, nd.level,
                    s.first_name, s.last_name
               FROM numeracy_scores ns
               LEFT JOIN numeracy_quizzes nq  ON nq.id  = ns.quiz_id
               LEFT JOIN numeracy_skills  nsk ON nsk.id = nq.skill_id
               LEFT JOIN numeracy_drills  nd  ON nd.section_id = nq.section_id
                                              AND nd.skill_name = nsk.skill_name
                                              AND DATE(nd.created_at) = nq.quiz_date
               LEFT JOIN students         s   ON s.id   = ns.student_id
              WHERE s.section_id = (SELECT id FROM sections WHERE teacher_id=$teacher_id LIMIT 1)
              ORDER BY ns.recorded_at DESC"
        );
        if ($q) {
            while ($r = $q->fetch_assoc()) {
                $rows[] = [
                    'student_id'    => $r['student_id'],
                    'student_name'  => trim($r['first_name'].' '.$r['last_name']),
                    'skill'         => $r['skill']         ?? '',
                    'skill_name'    => $r['skill_name']    ?? '',
                    'level'         => $r['level']         ?? 1,
                    'total_items'   => $r['total_items']   ?? 0,
                    'correct'       => $r['raw_score']     ?? 0,
                    'percent'       => $r['pct_score']     ?? 0,
                    'mastery'       => $r['mastery']       ?? '',
                    'session_label' => $r['session_label'] ?? '',
                    'scored_at'     => $r['recorded_at']   ?? '',
                ];
            }
        }
        $conn->close();
        echo json_encode(['ok'=>true,'scores'=>$rows]); exit;
    }

    if ($_na === 'save_drill') {
        $sk=$conn->real_escape_string($_POST['skill']??'');
        $skn=$conn->real_escape_string($_POST['skill_name']??'');
        $lv=intval($_POST['level']??1); $tt=intval($_POST['total']??10);
        $lb=$conn->real_escape_string($_POST['label']??'');
        $qs=$conn->real_escape_string($_POST['questions']??'');
        $si=intval($_POST['section_id']??0);
        if ($conn->query("INSERT INTO numeracy_drills (teacher_id,section_id,skill,skill_name,level,total_items,label,questions) VALUES ($teacher_id,$si,'$sk','$skn',$lv,$tt,'$lb','$qs')")) {
            $id=$conn->insert_id; $conn->close();
            echo json_encode(['ok'=>true,'drill_id'=>$id]);
        } else {
            $e=$conn->error; $conn->close();
            echo json_encode(['ok'=>false,'error'=>$e]);
        }
        exit;
    }

    if ($_na === 'save_scores') {
        $did    = intval($_POST['drill_id'] ?? 0);
        $scores = json_decode($_POST['scores'] ?? '[]', true);
        if (empty($scores)) { $conn->close(); echo json_encode(['ok'=>false,'error'=>'No scores']); exit; }

        // Map JS mastery strings → DB ENUM values
        $mastery_map = [
            'mastered'   => 'Mastered',
            'developing' => 'Developing',
            'needs'      => 'Below Mastery',
        ];

        // Pull drill details so we can create a numeracy_quizzes row
        // numeracy_scores.quiz_id is a FK to numeracy_quizzes.id (not numeracy_drills)
        $drill_row = null;
        if ($did > 0) {
            $dq = $conn->query("SELECT skill, skill_name, level, total_items, section_id FROM numeracy_drills WHERE id=$did AND teacher_id=$teacher_id LIMIT 1");
            if ($dq) $drill_row = $dq->fetch_assoc();
        }
        if (!$drill_row) { $conn->close(); echo json_encode(['ok'=>false,'error'=>'Drill not found']); exit; }

        // Find or create the skill in numeracy_skills
        $skn_esc  = $conn->real_escape_string($drill_row['skill_name']);
        $skill_row = $conn->query("SELECT id FROM numeracy_skills WHERE skill_name='$skn_esc' LIMIT 1");
        if ($skill_row && $skill_row->num_rows > 0) {
            $skill_id = $skill_row->fetch_assoc()['id'];
        } else {
            $conn->query("INSERT INTO numeracy_skills (skill_name) VALUES ('$skn_esc')");
            $skill_id = $conn->insert_id;
        }

        // Create one numeracy_quizzes row for this session
        $sec_id     = intval($drill_row['section_id']);
        $total_items = intval($drill_row['total_items']);
        $today      = date('Y-m-d');
        $conn->query("INSERT INTO numeracy_quizzes (section_id, skill_id, quiz_date, total_items, created_by) VALUES ($sec_id, $skill_id, '$today', $total_items, $teacher_id)");
        $quiz_id = $conn->insert_id;
        if (!$quiz_id) { $conn->close(); echo json_encode(['ok'=>false,'error'=>'Could not create quiz row: '.$conn->error]); exit; }

        $saved = 0;
        foreach ($scores as $sc) {
            $sid = intval($sc['student_id'] ?? 0);
            $cr  = intval($sc['correct']    ?? 0);
            $pc  = intval($sc['percent']    ?? 0);
            $ms_raw = $sc['mastery'] ?? 'needs';
            $ms  = $conn->real_escape_string($mastery_map[$ms_raw] ?? 'Below Mastery');
            if ($sid <= 0) continue;
            if ($conn->query("INSERT INTO numeracy_scores (quiz_id, student_id, raw_score, pct_score, mastery) VALUES ($quiz_id, $sid, $cr, $pc, '$ms')")) {
                $saved++;
            }
        }

        if ($did > 0) $conn->query("UPDATE numeracy_drills SET saved=1 WHERE id=$did AND teacher_id=$teacher_id");
        $conn->close();
        echo json_encode(['ok'=>true,'saved'=>$saved,'quiz_id'=>$quiz_id]); exit;
    }

    $conn->close();
    echo json_encode(['ok'=>false,'error'=>'Unknown action']);
    exit;
}


// ── Get teacher's section ─────────────────────────────────────
$sec_q = $conn->prepare("SELECT id, section_name, grade_level FROM sections WHERE teacher_id = ? LIMIT 1");
$sec_q->bind_param("i", $teacher_id);
$sec_q->execute();
$sec_q->bind_result($section_id, $section_name, $grade_level);
$sec_q->fetch();
$sec_q->close();

if (!$section_id && !isset($_POST['action'])) {
    header("Location: setup_section.php");
    exit;
}

// ── Handle Add Student POST ───────────────────────────────────
$add_error   = "";
$add_success = "";

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add_student') {
    $first_name  = trim($_POST['first_name']  ?? '');
    $last_name   = trim($_POST['last_name']   ?? '');
    $middle_name = trim($_POST['middle_name'] ?? '');
    $lrn         = trim($_POST['lrn']         ?? '');
    $gender      = trim($_POST['gender']      ?? '');
    $birth_date  = trim($_POST['birth_date']  ?? '');
    $enrolled_at = (new DateTime('now', new DateTimeZone('Asia/Manila')))->format('Y-m-d');
    $initials    = strtoupper(substr($first_name, 0, 1) . substr($last_name, 0, 1));

    if (!$first_name || !$last_name || !$lrn || !$gender) {
        $add_error = "First name, last name, LRN, and gender are required.";
    } elseif (!preg_match('/^\d{12}$/', $lrn)) {
        $add_error = "LRN must be exactly 12 digits.";
    } elseif (!$section_id) {
        $add_error = "No section found for your account. Please contact admin.";
    } else {
        $chk = $conn->prepare("SELECT id FROM students WHERE lrn = ?");
        $chk->bind_param("s", $lrn);
        $chk->execute();
        $chk->store_result();
        if ($chk->num_rows > 0) {
            $add_error = "A student with that LRN already exists.";
        } else {
            $ins = $conn->prepare(
                "INSERT INTO students (section_id, first_name, last_name, middle_name, initials, lrn, gender, birth_date, enrolled_at, is_active)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)"
            );
            $bd = $birth_date ?: null;
            $ins->bind_param("issssssss", $section_id, $first_name, $last_name, $middle_name, $initials, $lrn, $gender, $bd, $enrolled_at);
            if ($ins->execute()) {
                $add_success = "Student {$first_name} {$last_name} added successfully!";
            } else {
                $add_error = "Failed to add student: " . $ins->error;
            }
            $ins->close();
        }
        $chk->close();
    }
}

// ── Handle Attendance Toggle (AJAX) ──────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'toggle_att') {
    header('Content-Type: application/json');
    $student_id   = intval($_POST['student_id']);
    $session_date = $_POST['session_date'];
    $new_status   = $_POST['status'];

    if ($new_status === '') {
        $d = $conn->prepare("DELETE FROM attendance WHERE student_id = ? AND session_date = ?");
        $d->bind_param("is", $student_id, $session_date);
        $d->execute();
        $d->close();
    } else {
        $u = $conn->prepare(
            "INSERT INTO attendance (student_id, session_date, status, recorded_by)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE status = VALUES(status), recorded_by = VALUES(recorded_by)"
        );
        $u->bind_param("issi", $student_id, $session_date, $new_status, $teacher_id);
        $u->execute();
        $u->close();
    }
    echo json_encode(['ok' => true]);
    exit;
}

// ── Build week dates (Mon–Fri) ────────────────────────────────
$week_dates = [];
$today  = new DateTime('now', new DateTimeZone('Asia/Manila'));
$dow    = $today->format('N');
$monday = (clone $today)->modify('-' . ($dow - 1) . ' days');
for ($d = 0; $d < 5; $d++) {
    $week_dates[] = (clone $monday)->modify("+{$d} days")->format('Y-m-d');
}

// ── Load students + their week attendance ─────────────────────
$students = [];
if ($section_id) {
    $stu_q = $conn->prepare(
        "SELECT id, first_name, last_name, initials, lrn FROM students
         WHERE section_id = ? AND is_active = 1 ORDER BY last_name, first_name"
    );
    $stu_q->bind_param("i", $section_id);
    $stu_q->execute();
    $stu_res = $stu_q->get_result();
    while ($row = $stu_res->fetch_assoc()) {
        $att = [];
        foreach ($week_dates as $dt) {
            $att_q   = $conn->prepare("SELECT status FROM attendance WHERE student_id = ? AND session_date = ?");
            $att_q->bind_param("is", $row['id'], $dt);
            $att_q->execute();
            $status  = null;                                         // reset before bind
            $att_q->bind_result($status);
            $fetched = $att_q->fetch();                              // true = row found
            $att_q->close();
            $att[]   = ($fetched === true && $status !== null) ? $status : '';
        }
        $row['attendance'] = $att;
        $row['week_dates'] = $week_dates;
        $students[] = $row;
    }
    $stu_q->close();
}

// ── Dashboard stats ───────────────────────────────────────────
$total_students = count($students);
$today_str      = (new DateTime('now', new DateTimeZone('Asia/Manila')))->format('Y-m-d');

// Derive stats from already-loaded attendance array (same data as the grid)
// This avoids timezone mismatch from a second DB query with date()
$today_idx = array_search($today_str, $week_dates);
$present_today = $absent_today = $late_today = 0;

if ($today_idx !== false) {
    foreach ($students as $s) {
        $st = $s['attendance'][$today_idx] ?? '';
        if ($st === 'P') $present_today++;
        elseif ($st === 'A') $absent_today++;
        elseif ($st === 'L') $late_today++;
    }
}

$conn->close();
?>
<?php include 'includes/_layout_head.php'; ?>
<?php include 'includes/_layout_nav.php'; ?>

<div class="main-wrap">
  <?php include 'includes/_layout_sidebar.php'; ?>

  <main class="content">
    <?php include 'includes/page_dashboard.php'; ?>
    <?php include 'includes/page_attendance.php'; ?>
    <?php include 'includes/page_reading.php'; ?>
    <?php include 'includes/page_numeracy.php'; ?>
    <?php include 'includes/page_science.php'; ?>
    <?php include 'includes/page_intervention.php'; ?>
    <?php include 'includes/page_reports.php'; ?>
    <?php include 'includes/page_announcements.php'; ?>
  </main>
</div>

<?php include 'includes/_modal_add_student.php'; ?>
<?php include 'includes/_layout_footer.php'; ?>