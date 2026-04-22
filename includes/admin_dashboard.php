<?php
if (session_status() === PHP_SESSION_NONE) session_start();
if (!isset($_SESSION['admin_id'])) {
    header("Location: /admin_login.php");
    exit;
}
include __DIR__ . '/../conn.php';

$admin_id       = $_SESSION['admin_id'];
$admin_name     = $_SESSION['admin_name'];
$admin_initials = $_SESSION['admin_initials'] ?? strtoupper(substr($admin_name, 0, 2));

// ── Flash messages (PRG pattern) ─────────────────────────────
$success_msg = $_SESSION['success_msg'] ?? '';
$error_msg   = $_SESSION['error_msg']   ?? '';
$open_modal  = $_SESSION['open_modal']  ?? '';
unset($_SESSION['success_msg'], $_SESSION['error_msg'], $_SESSION['open_modal']);

// ── Includes path ─────────────────────────────────────────────
if (!defined('INC')) define('INC', __DIR__ . '/');

// ══════════════════════════════════════════════════════════════
// POST HANDLERS
// ══════════════════════════════════════════════════════════════

$action = $_POST['action'] ?? '';

// ── Add Teacher ───────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'add_teacher') {
    $first_name  = trim($_POST['first_name']  ?? '');
    $last_name   = trim($_POST['last_name']   ?? '');
    $email       = trim($_POST['email']       ?? '');
    $password    = trim($_POST['password']    ?? '');
    $name        = $first_name . ' ' . $last_name;
    $initials    = strtoupper(substr($first_name, 0, 1) . substr($last_name, 0, 1));

    if (!$first_name || !$last_name || !$email || !$password) {
        $_SESSION['error_msg']  = "All fields are required.";
        $_SESSION['open_modal'] = 'add_teacher';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $_SESSION['error_msg']  = "Invalid email address.";
        $_SESSION['open_modal'] = 'add_teacher';
    } else {
        $chk = $conn->prepare("SELECT id FROM teachers WHERE email = ?");
        $chk->bind_param("s", $email);
        $chk->execute();
        $chk->store_result();
        if ($chk->num_rows > 0) {
            $_SESSION['error_msg']  = "A teacher with that email already exists.";
            $_SESSION['open_modal'] = 'add_teacher';
        } else {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $ins  = $conn->prepare(
                "INSERT INTO teachers (full_name, initials, email, password_hash)
                 VALUES (?, ?, ?, ?)"
            );
            $ins->bind_param("ssss", $name, $initials, $email, $hash);
            if ($ins->execute()) {
                $_SESSION['success_msg'] = "Teacher {$name} added successfully!";
            } else {
                $_SESSION['error_msg']  = "Failed to add teacher: " . $ins->error;
                $_SESSION['open_modal'] = 'add_teacher';
            }
            $ins->close();
        }
        $chk->close();
    }
    $conn->close();
    header("Location: admin_dashboard.php?tab=teachers");
    exit;
}

// ── Toggle Teacher Active/Inactive (AJAX) — not supported, no is_active column
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'toggle_teacher') {
    header('Content-Type: application/json');
    echo json_encode(['ok' => false, 'msg' => 'Not supported']);
    exit;
}

// ── Delete Teacher (AJAX) ─────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'delete_teacher') {
    header('Content-Type: application/json');
    $tid = intval($_POST['teacher_id']);
    $d = $conn->prepare("DELETE FROM teachers WHERE id = ?");
    $d->bind_param("i", $tid);
    $d->execute();
    $d->close();
    echo json_encode(['ok' => true]);
    exit;
}

// ── Add Announcement ─────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'add_announcement') {
    $title   = trim($_POST['title']   ?? '');
    $message = trim($_POST['message'] ?? '');
    if (!$title || !$message) {
        $_SESSION['error_msg']  = "Title and message are required.";
        $_SESSION['open_modal'] = 'add_announcement';
    } else {
        $ins = $conn->prepare(
            "INSERT INTO announcements (admin_id, title, message, created_at) VALUES (?, ?, ?, NOW())"
        );
        $ins->bind_param("iss", $admin_id, $title, $message);
        if ($ins->execute()) {
            $_SESSION['success_msg'] = "Announcement posted!";
        } else {
            $_SESSION['error_msg']  = "Failed to post: " . $ins->error;
            $_SESSION['open_modal'] = 'add_announcement';
        }
        $ins->close();
    }
    $conn->close();
    header("Location: admin_dashboard.php?tab=announcements");
    exit;
}

// ── Delete Announcement (AJAX) ────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'delete_announcement') {
    header('Content-Type: application/json');
    $aid = intval($_POST['ann_id']);
    $d = $conn->prepare("DELETE FROM announcements WHERE id = ?");
    $d->bind_param("i", $aid);
    $d->execute();
    $d->close();
    echo json_encode(['ok' => true]);
    exit;
}

// ══════════════════════════════════════════════════════════════
// DATA QUERIES
// ══════════════════════════════════════════════════════════════

// ── Teachers ──────────────────────────────────────────────────
$teachers = [];
$res = $conn->query(
    "SELECT t.id, t.full_name AS name, t.initials, t.email,
            s.section_name, COUNT(st.id) AS student_count
     FROM teachers t
     LEFT JOIN sections s  ON s.teacher_id = t.id
     LEFT JOIN students st ON st.section_id = s.id AND st.is_active = 1
     GROUP BY t.id ORDER BY t.full_name"
);
if ($res) while ($row = $res->fetch_assoc()) $teachers[] = $row;

// ── Sections ──────────────────────────────────────────────────
$sections = [];
$res2 = $conn->query(
    "SELECT s.id, s.section_name, s.grade_level, t.full_name AS teacher_name,
            COUNT(st.id) AS student_count
     FROM sections s
     LEFT JOIN teachers t  ON t.id = s.teacher_id
     LEFT JOIN students st ON st.section_id = s.id AND st.is_active = 1
     GROUP BY s.id ORDER BY s.grade_level, s.section_name"
);
if ($res2) while ($row = $res2->fetch_assoc()) $sections[] = $row;

// ── Totals ────────────────────────────────────────────────────
$total_teachers = count($teachers);
$total_sections = count($sections);
$total_students = 0;
$r = $conn->query("SELECT COUNT(*) AS c FROM students WHERE is_active = 1");
if ($r) $total_students = $r->fetch_assoc()['c'];

// ── School-wide attendance today ──────────────────────────────
$today_str   = date('Y-m-d');
$att_present = $att_absent = $att_late = 0;
$att_res = $conn->query(
    "SELECT status, COUNT(*) AS c FROM attendance
     WHERE session_date = '{$today_str}' GROUP BY status"
);
if ($att_res) {
    while ($row = $att_res->fetch_assoc()) {
        if ($row['status'] === 'P') $att_present = $row['c'];
        if ($row['status'] === 'A') $att_absent  = $row['c'];
        if ($row['status'] === 'L') $att_late    = $row['c'];
    }
}
$att_unmarked = max(0, $total_students - $att_present - $att_absent - $att_late);

// ── Per-section attendance today ─────────────────────────────
$section_att = [];
$sa_res = $conn->query(
    "SELECT s.section_name, s.grade_level,
            SUM(CASE WHEN a.status='P' THEN 1 ELSE 0 END) AS present,
            SUM(CASE WHEN a.status='A' THEN 1 ELSE 0 END) AS absent,
            SUM(CASE WHEN a.status='L' THEN 1 ELSE 0 END) AS late,
            COUNT(st.id) AS total
     FROM sections s
     LEFT JOIN students st ON st.section_id = s.id AND st.is_active = 1
     LEFT JOIN attendance a ON a.student_id = st.id AND a.session_date = '{$today_str}'
     GROUP BY s.id ORDER BY s.grade_level, s.section_name"
);
if ($sa_res) while ($row = $sa_res->fetch_assoc()) $section_att[] = $row;

// ── Interventions (3+ absences this month) ────────────────────
$interventions = [];
$month_start   = date('Y-m-01');
$int_res = $conn->query(
    "SELECT st.first_name, st.last_name, sec.section_name,
            t.full_name AS teacher_name, COUNT(a.id) AS absence_count
     FROM students st
     JOIN sections sec  ON sec.id = st.section_id
     LEFT JOIN teachers t ON t.id = sec.teacher_id
     LEFT JOIN attendance a ON a.student_id = st.id
         AND a.status = 'A' AND a.session_date >= '{$month_start}'
     WHERE st.is_active = 1
     GROUP BY st.id HAVING absence_count >= 3
     ORDER BY absence_count DESC LIMIT 20"
);
if ($int_res) while ($row = $int_res->fetch_assoc()) $interventions[] = $row;

// ── Announcements ─────────────────────────────────────────────
$announcements = [];
$ann_res = $conn->query(
    "SELECT id, title, message, created_at FROM announcements
     ORDER BY created_at DESC LIMIT 20"
);
if ($ann_res) while ($row = $ann_res->fetch_assoc()) $announcements[] = $row;

$conn->close();
?>
<?php include INC . '_admin_layout_head.php'; ?>
<?php include INC . '_admin_layout_nav.php'; ?>

<div class="main-wrap">
  <?php include INC . '_admin_layout_sidebar.php'; ?>

  <main class="content">
    <?php include INC . 'admin_page_overview.php'; ?>
    <?php include INC . 'admin_page_teachers.php'; ?>
    <?php include INC . 'admin_page_sections.php'; ?>
    <?php include INC . 'admin_page_attendance.php'; ?>
    <?php include INC . 'admin_page_interventions.php'; ?>
    <?php include INC . 'admin_page_announcements.php'; ?>
    <?php include INC . 'admin_page_reports.php'; ?>
  </main>
</div>

<?php include INC . '_admin_modal_add_teacher.php'; ?>
<?php include INC . '_admin_modal_add_announcement.php'; ?>
<?php include INC . '_admin_layout_footer.php'; ?>