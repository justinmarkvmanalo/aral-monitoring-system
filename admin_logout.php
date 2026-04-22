<?php
session_start();

// Clear only admin session keys
unset(
    $_SESSION['admin_id'],
    $_SESSION['admin_name'],
    $_SESSION['admin_initials'],
    $_SESSION['success_msg'],
    $_SESSION['error_msg'],
    $_SESSION['open_modal']
);

// If no other session data remains, destroy entirely
if (empty($_SESSION)) {
    session_destroy();
}

header("Location: index.php");
exit;
