<?php
/**
 * numeracy_handler.php — plain PHP POST/GET, no JSON.
 *
 * Tables:
 *   numeracy_skills  (id, skill_name)
 *   numeracy_quizzes (id, section_id, skill_id, quiz_date, total_items, created_by)
 *   numeracy_scores  (id, quiz_id, student_id, raw_score, pct_score, mastery)
 */

if (session_status() === PHP_SESSION_NONE) session_start();
date_default_timezone_set('Asia/Manila');

if (!isset($_SESSION['teacher_id'])) {
    http_response_code(401);
    die('Not authenticated.');
}

$conn = new mysqli("sql207.infinityfree.com","if0_41078562","7zkSAZJUNj","if0_41078562_aral_monitor");
if ($conn->connect_error) die('DB error: ' . $conn->connect_error);

$teacher_id = intval($_SESSION['teacher_id']);
$action     = $_POST['action'] ?? $_GET['action'] ?? '';

// ── save_scores ───────────────────────────────────────────────
// POST fields:
//   section_id, skill_name, total_items, quiz_date (optional)
//   raw_score_<student_id>  for each student
if ($action === 'save_scores') {

    $section_id  = intval($_POST['section_id']  ?? 0);
    $skill_name  = trim($_POST['skill_name']     ?? '');
    $total_items = intval($_POST['total_items']  ?? 0);
    $quiz_date   = preg_match('/^\d{4}-\d{2}-\d{2}$/', $_POST['quiz_date'] ?? '')
                   ? $_POST['quiz_date'] : date('Y-m-d');

    if (!$section_id || !$skill_name || !$total_items) {
        redirect_back('Missing required fields.');
    }

    // Step 1 — get or create skill
    $esc_skill = $conn->real_escape_string($skill_name);
    $r = $conn->query("SELECT id FROM numeracy_skills WHERE skill_name='$esc_skill' LIMIT 1");
    if ($r && $r->num_rows) {
        $skill_id = intval($r->fetch_assoc()['id']);
    } else {
        $conn->query("INSERT INTO numeracy_skills (skill_name) VALUES ('$esc_skill')");
        if ($conn->error) redirect_back('Skill insert error: ' . $conn->error);
        $skill_id = $conn->insert_id;
    }

    // Step 2 — create quiz row (gives us a valid quiz_id FK for scores)
    $conn->query("INSERT INTO numeracy_quizzes (section_id,skill_id,quiz_date,total_items,created_by)
                  VALUES ($section_id,$skill_id,'$quiz_date',$total_items,$teacher_id)");
    if ($conn->error) redirect_back('Quiz insert error: ' . $conn->error);
    $quiz_id = $conn->insert_id;

    // Step 3 — one score row per student
    $saved = 0;
    foreach ($_POST as $key => $val) {
        if (strpos($key, 'raw_score_') !== 0) continue;
        $student_id = intval(substr($key, 10));
        if ($student_id <= 0 || $val === '') continue;

        $raw = max(0, min($total_items, intval($val)));
        $pct = $total_items ? intval(round($raw / $total_items * 100)) : 0;
        $mastery = $pct >= 75 ? 'Mastered' : ($pct >= 50 ? 'Developing' : 'Below Mastery');
        $esc_m   = $conn->real_escape_string($mastery);

        $conn->query("INSERT INTO numeracy_scores (quiz_id,student_id,raw_score,pct_score,mastery)
                      VALUES ($quiz_id,$student_id,$raw,$pct,'$esc_m')");
        if (!$conn->error) $saved++;
    }

    $conn->close();
    $back = $_SERVER['HTTP_REFERER'] ?? 'dashboard.php';
    $sep  = strpos($back, '?') !== false ? '&' : '?';
    header("Location: {$back}{$sep}saved={$saved}#page-numeracy");
    exit;
}

// ── get_scores ────────────────────────────────────────────────
// GET: action=get_scores&section_id=<id>
// Returns a plain HTML table ready to inject into a div.
if ($action === 'get_scores') {
    $section_id = intval($_GET['section_id'] ?? 0);
    $where_sec  = $section_id ? "AND nq.section_id=$section_id" : '';

    $q = $conn->query(
        "SELECT CONCAT(s.first_name,' ',s.last_name) AS student_name,
                nsk.skill_name, nq.quiz_date, nq.total_items,
                ns.raw_score, ns.pct_score, ns.mastery, ns.recorded_at
           FROM numeracy_scores ns
           JOIN numeracy_quizzes nq  ON nq.id  = ns.quiz_id
           JOIN numeracy_skills  nsk ON nsk.id = nq.skill_id
           JOIN students         s   ON s.id   = ns.student_id
          WHERE nq.created_by = $teacher_id $where_sec
          ORDER BY ns.recorded_at DESC"
    );

    $rows = [];
    if ($q) while ($r = $q->fetch_assoc()) $rows[] = $r;
    $conn->close();

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
                <td $td>" . htmlspecialchars($r['skill_name'])   . "</td>
                <td $td>" . htmlspecialchars($r['quiz_date'])    . "</td>
                <td $td>" . $r['raw_score'] . "/" . $r['total_items'] . "</td>
                <td $td><strong>" . $r['pct_score'] . "%</strong></td>
                <td $td style='color:$c;font-weight:700;'>" . htmlspecialchars($r['mastery']) . "</td>
              </tr>";
    }
    echo '</tbody></table>';
    exit;
}

$conn->close();
echo 'Unknown action: ' . htmlspecialchars($action);

function redirect_back(string $msg): void {
    $back = $_SERVER['HTTP_REFERER'] ?? 'dashboard.php';
    $sep  = strpos($back, '?') !== false ? '&' : '?';
    header('Location: ' . $back . $sep . 'num_error=' . urlencode($msg) . '#page-numeracy');
    exit;
}