<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
date_default_timezone_set('Asia/Manila');

if (!isset($_SESSION['teacher_id'])) {
    http_response_code(401);
    die('Not authenticated.');
}

include __DIR__ . '/conn.php';

$teacher_id = (int) $_SESSION['teacher_id'];
$action = $_POST['action'] ?? $_GET['action'] ?? '';

if ($action === 'save_scores') {
    $section_id = (int) ($_POST['section_id'] ?? 0);
    $skill_name = trim($_POST['skill_name'] ?? '');
    $total_items = (int) ($_POST['total_items'] ?? 0);
    $quiz_date = preg_match('/^\d{4}-\d{2}-\d{2}$/', $_POST['quiz_date'] ?? '')
        ? $_POST['quiz_date']
        : date('Y-m-d');

    if (!$section_id || !$skill_name || !$total_items) {
        redirect_back('Missing required fields.');
    }

    $skillStmt = $conn->prepare("SELECT id FROM numeracy_skills WHERE skill_name = :skill_name LIMIT 1");
    $skillStmt->execute(['skill_name' => $skill_name]);
    $skill_id = $skillStmt->fetchColumn();

    if (!$skill_id) {
        $insertSkillStmt = $conn->prepare(
            "INSERT INTO numeracy_skills (skill_name)
             VALUES (:skill_name)
             RETURNING id"
        );
        $insertSkillStmt->execute(['skill_name' => $skill_name]);
        $skill_id = (int) $insertSkillStmt->fetchColumn();
    }

    $quizStmt = $conn->prepare(
        "INSERT INTO numeracy_quizzes (section_id, skill_id, quiz_date, total_items, created_by)
         VALUES (:section_id, :skill_id, :quiz_date, :total_items, :created_by)
         RETURNING id"
    );
    $quizStmt->execute([
        'section_id' => $section_id,
        'skill_id' => (int) $skill_id,
        'quiz_date' => $quiz_date,
        'total_items' => $total_items,
        'created_by' => $teacher_id,
    ]);
    $quiz_id = (int) $quizStmt->fetchColumn();

    $scoreStmt = $conn->prepare(
        "INSERT INTO numeracy_scores (quiz_id, student_id, raw_score, pct_score, mastery)
         VALUES (:quiz_id, :student_id, :raw_score, :pct_score, :mastery)"
    );

    $saved = 0;
    foreach ($_POST as $key => $val) {
        if (strpos($key, 'raw_score_') !== 0) {
            continue;
        }

        $student_id = (int) substr($key, 10);
        if ($student_id <= 0 || $val === '') {
            continue;
        }

        $raw = max(0, min($total_items, (int) $val));
        $pct = $total_items ? (int) round($raw / $total_items * 100) : 0;
        $mastery = $pct >= 75 ? 'Mastered' : ($pct >= 50 ? 'Developing' : 'Below Mastery');

        $scoreStmt->execute([
            'quiz_id' => $quiz_id,
            'student_id' => $student_id,
            'raw_score' => $raw,
            'pct_score' => $pct,
            'mastery' => $mastery,
        ]);
        $saved++;
    }

    $back = $_SERVER['HTTP_REFERER'] ?? 'dashboard.php';
    $sep = strpos($back, '?') !== false ? '&' : '?';
    header("Location: {$back}{$sep}saved={$saved}#page-numeracy");
    exit;
}

if ($action === 'get_scores') {
    $section_id = (int) ($_GET['section_id'] ?? 0);
    $sql = "SELECT (s.first_name || ' ' || s.last_name) AS student_name,
                   nsk.skill_name, nq.quiz_date, nq.total_items,
                   ns.raw_score, ns.pct_score, ns.mastery, ns.recorded_at
            FROM numeracy_scores ns
            JOIN numeracy_quizzes nq ON nq.id = ns.quiz_id
            JOIN numeracy_skills nsk ON nsk.id = nq.skill_id
            JOIN students s ON s.id = ns.student_id
            WHERE nq.created_by = :teacher_id";

    $params = ['teacher_id' => $teacher_id];
    if ($section_id) {
        $sql .= " AND nq.section_id = :section_id";
        $params['section_id'] = $section_id;
    }
    $sql .= " ORDER BY ns.recorded_at DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    if (!$rows) {
        echo '<p style="color:#9CA3A0;text-align:center;padding:24px;">No scores recorded yet.</p>';
        exit;
    }

    $th = 'style="padding:8px 12px;background:#f4f6f3;text-align:left;font-size:11px;text-transform:uppercase;"';
    $td = 'style="padding:8px 12px;border-bottom:1px solid #eee;"';
    echo "<table style='width:100%;border-collapse:collapse;font-size:13px;'>
          <thead><tr>
            <th $th>Student</th><th $th>Skill</th><th $th>Date</th>
            <th $th>Score</th><th $th>%</th><th $th>Mastery</th>
          </tr></thead><tbody>";

    foreach ($rows as $r) {
        $c = $r['mastery'] === 'Mastered' ? '#0F6E56' : ($r['mastery'] === 'Developing' ? '#92400E' : '#C0392B');
        echo "<tr>
                <td $td>" . htmlspecialchars($r['student_name']) . "</td>
                <td $td>" . htmlspecialchars($r['skill_name']) . "</td>
                <td $td>" . htmlspecialchars($r['quiz_date']) . "</td>
                <td $td>" . $r['raw_score'] . "/" . $r['total_items'] . "</td>
                <td $td><strong>" . $r['pct_score'] . "%</strong></td>
                <td $td style='color:$c;font-weight:700;'>" . htmlspecialchars($r['mastery']) . "</td>
              </tr>";
    }
    echo '</tbody></table>';
    exit;
}

echo 'Unknown action: ' . htmlspecialchars($action);

function redirect_back(string $msg): void
{
    $back = $_SERVER['HTTP_REFERER'] ?? 'dashboard.php';
    $sep = strpos($back, '?') !== false ? '&' : '?';
    header('Location: ' . $back . $sep . 'num_error=' . urlencode($msg) . '#page-numeracy');
    exit;
}
