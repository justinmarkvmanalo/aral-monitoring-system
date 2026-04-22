<?php
session_start();

// Clear only teacher session keys to avoid affecting any other sessions
unset(
    $_SESSION['teacher_id'],
    $_SESSION['teacher_name'],
    $_SESSION['teacher_initials'],
    $_SESSION['add_success']
);

// If no other session data remains, destroy entirely
if (empty($_SESSION)) {
    session_destroy();
}

header("Location: index.php");
exit;
