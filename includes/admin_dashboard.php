<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
if (!isset($_SESSION['admin_id'])) {
    header("Location: /admin_login.php");
    exit;
}

include __DIR__ . '/../conn.php';

$admin_id = (int) $_SESSION['admin_id'];
$admin_name = $_SESSION['admin_name'];
$admin_initials = $_SESSION['admin_initials'] ?? strtoupper(substr($admin_name, 0, 2));

$success_msg = $_SESSION['success_msg'] ?? '';
$error_msg = $_SESSION['error_msg'] ?? '';
$open_modal = $_SESSION['open_modal'] ?? '';
unset($_SESSION['success_msg'], $_SESSION['error_msg'], $_SESSION['open_modal']);

if (!defined('INC')) {
    define('INC', __DIR__ . '/');
}

$action = $_POST['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'add_teacher') {
    $first_name = trim($_POST['first_name'] ?? '');
    $last_name = trim($_POST['last_name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');
    $name = trim($first_name . ' ' . $last_name);
    $initials = strtoupper(substr($first_name, 0, 1) . substr($last_name, 0, 1));

    if (!$first_name || !$last_name || !$email || !$password) {
        $_SESSION['error_msg'] = "All fields are required.";
        $_SESSION['open_modal'] = 'add_teacher';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $_SESSION['error_msg'] = "Invalid email address.";
        $_SESSION['open_modal'] = 'add_teacher';
    } else {
        $checkStmt = $conn->prepare("SELECT id FROM teachers WHERE email = :email LIMIT 1");
        $checkStmt->execute(['email' => $email]);

        if ($checkStmt->fetch()) {
            $_SESSION['error_msg'] = "A teacher with that email already exists.";
            $_SESSION['open_modal'] = 'add_teacher';
        } else {
            $insertStmt = $conn->prepare(
                "INSERT INTO teachers (full_name, initials, email, password_hash)
                 VALUES (:full_name, :initials, :email, :password_hash)"
            );
            $insertStmt->execute([
                'full_name' => $name,
                'initials' => $initials,
                'email' => $email,
                'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            ]);
            $_SESSION['success_msg'] = "Teacher {$name} added successfully!";
        }
    }

    header("Location: admin_dashboard.php?tab=teachers");
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'toggle_teacher') {
    header('Content-Type: application/json');
    echo json_encode(['ok' => false, 'msg' => 'Not supported']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'delete_teacher') {
    header('Content-Type: application/json');
    $stmt = $conn->prepare("DELETE FROM teachers WHERE id = :id");
    $stmt->execute(['id' => (int) ($_POST['teacher_id'] ?? 0)]);
    echo json_encode(['ok' => true]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'add_announcement') {
    $title = trim($_POST['title'] ?? '');
    $message = trim($_POST['message'] ?? '');

    if (!$title || !$message) {
        $_SESSION['error_msg'] = "Title and message are required.";
        $_SESSION['open_modal'] = 'add_announcement';
    } else {
        $stmt = $conn->prepare(
            "INSERT INTO announcements (admin_id, title, message, created_at)
             VALUES (:admin_id, :title, :message, CURRENT_TIMESTAMP)"
        );
        $stmt->execute([
            'admin_id' => $admin_id,
            'title' => $title,
            'message' => $message,
        ]);
        $_SESSION['success_msg'] = "Announcement posted!";
    }

    header("Location: admin_dashboard.php?tab=announcements");
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'delete_announcement') {
    header('Content-Type: application/json');
    $stmt = $conn->prepare("DELETE FROM announcements WHERE id = :id");
    $stmt->execute(['id' => (int) ($_POST['ann_id'] ?? 0)]);
    echo json_encode(['ok' => true]);
    exit;
}

$teachersStmt = $conn->query(
    "SELECT t.id, t.full_name AS name, t.initials, t.email,
            s.section_name, COUNT(st.id) AS student_count
     FROM teachers t
     LEFT JOIN sections s ON s.teacher_id = t.id
     LEFT JOIN students st ON st.section_id = s.id AND st.is_active = true
     GROUP BY t.id, t.full_name, t.initials, t.email, s.section_name
     ORDER BY t.full_name"
);
$teachers = $teachersStmt ? $teachersStmt->fetchAll() : [];

$sectionsStmt = $conn->query(
    "SELECT s.id, s.section_name, s.grade_level, t.full_name AS teacher_name,
            COUNT(st.id) AS student_count
     FROM sections s
     LEFT JOIN teachers t ON t.id = s.teacher_id
     LEFT JOIN students st ON st.section_id = s.id AND st.is_active = true
     GROUP BY s.id, s.section_name, s.grade_level, t.full_name
     ORDER BY s.grade_level, s.section_name"
);
$sections = $sectionsStmt ? $sectionsStmt->fetchAll() : [];

$total_teachers = count($teachers);
$total_sections = count($sections);
$total_students = (int) ($conn->query("SELECT COUNT(*) AS c FROM students WHERE is_active = true")->fetch()['c'] ?? 0);

$today_str = date('Y-m-d');
$att_present = 0;
$att_absent = 0;
$att_late = 0;
$attStmt = $conn->prepare(
    "SELECT status, COUNT(*) AS c
     FROM attendance
     WHERE session_date = :session_date
     GROUP BY status"
);
$attStmt->execute(['session_date' => $today_str]);
foreach ($attStmt->fetchAll() as $row) {
    if ($row['status'] === 'P') {
        $att_present = (int) $row['c'];
    }
    if ($row['status'] === 'A') {
        $att_absent = (int) $row['c'];
    }
    if ($row['status'] === 'L') {
        $att_late = (int) $row['c'];
    }
}
$att_unmarked = max(0, $total_students - $att_present - $att_absent - $att_late);

$sectionAttStmt = $conn->prepare(
    "SELECT s.section_name, s.grade_level,
            SUM(CASE WHEN a.status = 'P' THEN 1 ELSE 0 END) AS present,
            SUM(CASE WHEN a.status = 'A' THEN 1 ELSE 0 END) AS absent,
            SUM(CASE WHEN a.status = 'L' THEN 1 ELSE 0 END) AS late,
            COUNT(st.id) AS total
     FROM sections s
     LEFT JOIN students st ON st.section_id = s.id AND st.is_active = true
     LEFT JOIN attendance a ON a.student_id = st.id AND a.session_date = :session_date
     GROUP BY s.id, s.section_name, s.grade_level
     ORDER BY s.grade_level, s.section_name"
);
$sectionAttStmt->execute(['session_date' => $today_str]);
$section_att = $sectionAttStmt->fetchAll();

$month_start = date('Y-m-01');
$interventionStmt = $conn->prepare(
    "SELECT st.first_name, st.last_name, sec.section_name,
            t.full_name AS teacher_name, COUNT(a.id) AS absence_count
     FROM students st
     JOIN sections sec ON sec.id = st.section_id
     LEFT JOIN teachers t ON t.id = sec.teacher_id
     LEFT JOIN attendance a ON a.student_id = st.id
         AND a.status = 'A' AND a.session_date >= :month_start
     WHERE st.is_active = true
     GROUP BY st.id, st.first_name, st.last_name, sec.section_name, t.full_name
     HAVING COUNT(a.id) >= 3
     ORDER BY absence_count DESC
     LIMIT 20"
);
$interventionStmt->execute(['month_start' => $month_start]);
$interventions = $interventionStmt->fetchAll();

$announcementStmt = $conn->query(
    "SELECT id, title, message, created_at
     FROM announcements
     ORDER BY created_at DESC
     LIMIT 20"
);
$announcements = $announcementStmt ? $announcementStmt->fetchAll() : [];
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
