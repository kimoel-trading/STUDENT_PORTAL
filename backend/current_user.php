<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated.']);
    exit();
}

echo json_encode([
    'success' => true,
    'user_id' => (int) $_SESSION['user_id'],
    'application_number' => isset($_SESSION['application_number']) ? $_SESSION['application_number'] : null
]);
?>

