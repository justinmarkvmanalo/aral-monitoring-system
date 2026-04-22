<?php
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

date_default_timezone_set('Asia/Manila');
session_start();

if (!isset($_SESSION['teacher_id'])) {
    if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) || isset($_GET['action']) || isset($_POST['action'])) {
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'Not authenticated']);
        exit;
    }
    header("Location: login.php");
    exit;
}

include 'conn.php';

$teacher_id = (int) $_SESSION['teacher_id'];
$teacher_name = $_SESSION['teacher_name'];
$teacher_initials = $_SESSION['teacher_initials'];
$timezone = new DateTimeZone('Asia/Manila');

$action = $_POST['action'] ?? $_GET['action'] ?? '';
if (in_array($action, ['ping', 'save_drill', 'get_drill', 'save_scores', 'get_scores'], true)) {
    while (ob_get_level()) {
        ob_end_clean();
    }
    header('Content-Type: application/json');

    if ($action === 'ping') {
        echo json_encode(['ok' => true, 'msg' => 'pong']);
        exit;
    }

    if ($action === 'get_drill') {
        $stmt = $conn->prepare(
            "SELECT id, skill, skill_name, level, total_items, label, questions, saved
             FROM numeracy_drills
             WHERE teacher_id = :teacher_id
             ORDER BY created_at DESC
             LIMIT 1"
        );
        $stmt->execute(['teacher_id' => $teacher_id]);
        echo json_encode(['ok' => true, 'drill' => $stmt->fetch() ?: null]);
        exit;
    }

    if ($action === 'get_scores') {
        $stmt = $conn->prepare(
            "SELECT ns.student_id, ns.raw_score, ns.pct_score, ns.mastery, ns.recorded_at,
                    nq.total_items, nq.quiz_date,
                    nsk.skill_name,
                    nd.skill, nd.label AS session_label, nd.level,
                    s.first_name, s.last_name
             FROM numeracy_scores ns
             LEFT JOIN numeracy_quizzes nq ON nq.id = ns.quiz_id
             LEFT JOIN numeracy_skills nsk ON nsk.id = nq.skill_id
             LEFT JOIN numeracy_drills nd ON nd.section_id = nq.section_id
                 AND nd.skill_name = nsk.skill_name
                 AND nd.created_at::date = nq.quiz_date
             LEFT JOIN students s ON s.id = ns.student_id
             WHERE s.section_id = (
                 SELECT id FROM sections WHERE teacher_id = :teacher_id LIMIT 1
             )
             ORDER BY ns.recorded_at DESC"
        );
        $stmt->execute(['teacher_id' => $teacher_id]);

        $rows = [];
        foreach ($stmt->fetchAll() as $r) {
            $rows[] = [
                'student_id' => $r['student_id'],
                'student_name' => trim(($r['first_name'] ?? '') . ' ' . ($r['last_name'] ?? '')),
                'skill' => $r['skill'] ?? '',
                'skill_name' => $r['skill_name'] ?? '',
                'level' => $r['level'] ?? 1,
                'total_items' => $r['total_items'] ?? 0,
                'correct' => $r['raw_score'] ?? 0,
                'percent' => $r['pct_score'] ?? 0,
                'mastery' => $r['mastery'] ?? '',
                'session_label' => $r['session_label'] ?? '',
                'scored_at' => $r['recorded_at'] ?? '',
            ];
        }

        echo json_encode(['ok' => true, 'scores' => $rows]);
        exit;
    }

    if ($action === 'save_drill') {
        $stmt = $conn->prepare(
            "INSERT INTO numeracy_drills
                (teacher_id, section_id, skill, skill_name, level, total_items, label, questions)
             VALUES
                (:teacher_id, :section_id, :skill, :skill_name, :level, :total_items, :label, CAST(:questions AS jsonb))
             RETURNING id"
        );
        $stmt->execute([
            'teacher_id' => $teacher_id,
            'section_id' => (int) ($_POST['section_id'] ?? 0),
            'skill' => trim($_POST['skill'] ?? ''),
            'skill_name' => trim($_POST['skill_name'] ?? ''),
            'level' => (int) ($_POST['level'] ?? 1),
            'total_items' => (int) ($_POST['total'] ?? 10),
            'label' => trim($_POST['label'] ?? ''),
            'questions' => $_POST['questions'] ?? '[]',
        ]);
        echo json_encode(['ok' => true, 'drill_id' => (int) $stmt->fetchColumn()]);
        exit;
    }

    if ($action === 'save_scores') {
        $drill_id = (int) ($_POST['drill_id'] ?? 0);
        $scores = json_decode($_POST['scores'] ?? '[]', true);
        if (empty($scores)) {
            echo json_encode(['ok' => false, 'error' => 'No scores']);
            exit;
        }

        $mastery_map = [
            'mastered' => 'Mastered',
            'developing' => 'Developing',
            'needs' => 'Below Mastery',
        ];

        $drillStmt = $conn->prepare(
            "SELECT skill_name, total_items, section_id
             FROM numeracy_drills
             WHERE id = :id AND teacher_id = :teacher_id
             LIMIT 1"
        );
        $drillStmt->execute([
            'id' => $drill_id,
            'teacher_id' => $teacher_id,
        ]);
        $drill = $drillStmt->fetch();
        if (!$drill) {
            echo json_encode(['ok' => false, 'error' => 'Drill not found']);
            exit;
        }

        $skillStmt = $conn->prepare("SELECT id FROM numeracy_skills WHERE skill_name = :skill_name LIMIT 1");
        $skillStmt->execute(['skill_name' => $drill['skill_name']]);
        $skill_id = $skillStmt->fetchColumn();

        if (!$skill_id) {
            $skillInsertStmt = $conn->prepare(
                "INSERT INTO numeracy_skills (skill_name)
                 VALUES (:skill_name)
                 RETURNING id"
            );
            $skillInsertStmt->execute(['skill_name' => $drill['skill_name']]);
            $skill_id = (int) $skillInsertStmt->fetchColumn();
        }

        $quizStmt = $conn->prepare(
            "INSERT INTO numeracy_quizzes (section_id, skill_id, quiz_date, total_items, created_by)
             VALUES (:section_id, :skill_id, :quiz_date, :total_items, :created_by)
             RETURNING id"
        );
        $quizStmt->execute([
            'section_id' => (int) $drill['section_id'],
            'skill_id' => (int) $skill_id,
            'quiz_date' => (new DateTime('now', $timezone))->format('Y-m-d'),
            'total_items' => (int) $drill['total_items'],
            'created_by' => $teacher_id,
        ]);
        $quiz_id = (int) $quizStmt->fetchColumn();

        $scoreStmt = $conn->prepare(
            "INSERT INTO numeracy_scores (quiz_id, student_id, raw_score, pct_score, mastery)
             VALUES (:quiz_id, :student_id, :raw_score, :pct_score, :mastery)"
        );

        $saved = 0;
        foreach ($scores as $score) {
            $student_id = (int) ($score['student_id'] ?? 0);
            if ($student_id <= 0) {
                continue;
            }

            $scoreStmt->execute([
                'quiz_id' => $quiz_id,
                'student_id' => $student_id,
                'raw_score' => (int) ($score['correct'] ?? 0),
                'pct_score' => (int) ($score['percent'] ?? 0),
                'mastery' => $mastery_map[$score['mastery'] ?? 'needs'] ?? 'Below Mastery',
            ]);
            $saved++;
        }

        $markSavedStmt = $conn->prepare(
            "UPDATE numeracy_drills
             SET saved = true
             WHERE id = :id AND teacher_id = :teacher_id"
        );
        $markSavedStmt->execute([
            'id' => $drill_id,
            'teacher_id' => $teacher_id,
        ]);

        echo json_encode(['ok' => true, 'saved' => $saved, 'quiz_id' => $quiz_id]);
        exit;
    }

    echo json_encode(['ok' => false, 'error' => 'Unknown action']);
    exit;
}

$sectionStmt = $conn->prepare(
    "SELECT id, section_name, grade_level
     FROM sections
     WHERE teacher_id = :teacher_id
     LIMIT 1"
);
$sectionStmt->execute(['teacher_id' => $teacher_id]);
$section = $sectionStmt->fetch();

$section_id = $section ? (int) $section['id'] : null;
$section_name = $section['section_name'] ?? null;
$grade_level = isset($section['grade_level']) ? (int) $section['grade_level'] : null;

if (!$section_id && !isset($_POST['action'])) {
    header("Location: setup_section.php");
    exit;
}

$add_error = "";
$add_success = "";

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($action === 'add_student')) {
    $first_name = trim($_POST['first_name'] ?? '');
    $last_name = trim($_POST['last_name'] ?? '');
    $middle_name = trim($_POST['middle_name'] ?? '');
    $lrn = trim($_POST['lrn'] ?? '');
    $gender = trim($_POST['gender'] ?? '');
    $birth_date = trim($_POST['birth_date'] ?? '');
    $enrolled_at = (new DateTime('now', $timezone))->format('Y-m-d');
    $initials = strtoupper(substr($first_name, 0, 1) . substr($last_name, 0, 1));

    if (!$first_name || !$last_name || !$lrn || !$gender) {
        $add_error = "First name, last name, LRN, and gender are required.";
    } elseif (!preg_match('/^\d{12}$/', $lrn)) {
        $add_error = "LRN must be exactly 12 digits.";
    } elseif (!$section_id) {
        $add_error = "No section found for your account. Please contact admin.";
    } else {
        $checkStmt = $conn->prepare("SELECT id FROM students WHERE lrn = :lrn LIMIT 1");
        $checkStmt->execute(['lrn' => $lrn]);
        if ($checkStmt->fetch()) {
            $add_error = "A student with that LRN already exists.";
        } else {
            $insertStmt = $conn->prepare(
                "INSERT INTO students
                    (section_id, first_name, last_name, middle_name, initials, lrn, gender, birth_date, enrolled_at, is_active)
                 VALUES
                    (:section_id, :first_name, :last_name, :middle_name, :initials, :lrn, :gender, :birth_date, :enrolled_at, true)"
            );
            $insertStmt->execute([
                'section_id' => $section_id,
                'first_name' => $first_name,
                'last_name' => $last_name,
                'middle_name' => $middle_name !== '' ? $middle_name : null,
                'initials' => $initials,
                'lrn' => $lrn,
                'gender' => $gender,
                'birth_date' => $birth_date !== '' ? $birth_date : null,
                'enrolled_at' => $enrolled_at,
            ]);
            $add_success = "Student {$first_name} {$last_name} added successfully!";
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($action === 'toggle_att')) {
    header('Content-Type: application/json');
    $student_id = (int) ($_POST['student_id'] ?? 0);
    $session_date = $_POST['session_date'] ?? '';
    $new_status = $_POST['status'] ?? '';

    if ($new_status === '') {
        $deleteStmt = $conn->prepare(
            "DELETE FROM attendance
             WHERE student_id = :student_id AND session_date = :session_date"
        );
        $deleteStmt->execute([
            'student_id' => $student_id,
            'session_date' => $session_date,
        ]);
    } else {
        $upsertStmt = $conn->prepare(
            "INSERT INTO attendance (student_id, session_date, status, recorded_by)
             VALUES (:student_id, :session_date, :status, :recorded_by)
             ON CONFLICT (student_id, session_date)
             DO UPDATE SET
                status = EXCLUDED.status,
                recorded_by = EXCLUDED.recorded_by,
                updated_at = CURRENT_TIMESTAMP"
        );
        $upsertStmt->execute([
            'student_id' => $student_id,
            'session_date' => $session_date,
            'status' => $new_status,
            'recorded_by' => $teacher_id,
        ]);
    }

    echo json_encode(['ok' => true]);
    exit;
}

$week_dates = [];
$today = new DateTime('now', $timezone);
$dow = (int) $today->format('N');
$monday = (clone $today)->modify('-' . ($dow - 1) . ' days');
for ($d = 0; $d < 5; $d++) {
    $week_dates[] = (clone $monday)->modify("+{$d} days")->format('Y-m-d');
}

$students = [];
if ($section_id) {
    $studentStmt = $conn->prepare(
        "SELECT id, first_name, last_name, initials, lrn
         FROM students
         WHERE section_id = :section_id AND is_active = true
         ORDER BY last_name, first_name"
    );
    $studentStmt->execute(['section_id' => $section_id]);
    $students = $studentStmt->fetchAll();

    if ($students) {
        $attendanceMap = [];
        $params = ['section_id' => $section_id];
        $placeholders = [];

        foreach ($week_dates as $i => $week_date) {
            $key = "d{$i}";
            $params[$key] = $week_date;
            $placeholders[] = ':' . $key;
        }

        $attendanceStmt = $conn->prepare(
            "SELECT a.student_id, a.session_date, a.status
             FROM attendance a
             INNER JOIN students s ON s.id = a.student_id
             WHERE s.section_id = :section_id
               AND s.is_active = true
               AND a.session_date IN (" . implode(', ', $placeholders) . ")"
        );
        $attendanceStmt->execute($params);

        foreach ($attendanceStmt->fetchAll() as $attendance) {
            $attendanceMap[$attendance['student_id']][$attendance['session_date']] = $attendance['status'];
        }

        foreach ($students as &$student) {
            $student_attendance = [];
            foreach ($week_dates as $week_date) {
                $student_attendance[] = $attendanceMap[$student['id']][$week_date] ?? '';
            }
            $student['attendance'] = $student_attendance;
            $student['week_dates'] = $week_dates;
        }
        unset($student);
    }
}

$total_students = count($students);
$today_str = $today->format('Y-m-d');
$today_idx = array_search($today_str, $week_dates, true);
$present_today = 0;
$absent_today = 0;
$late_today = 0;

if ($today_idx !== false) {
    foreach ($students as $student) {
        $status = $student['attendance'][$today_idx] ?? '';
        if ($status === 'P') {
            $present_today++;
        } elseif ($status === 'A') {
            $absent_today++;
        } elseif ($status === 'L') {
            $late_today++;
        }
    }
}
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
