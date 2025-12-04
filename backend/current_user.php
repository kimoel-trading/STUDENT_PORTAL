<?php
session_start();
header('Content-Type: application/json');

// Check if application has been started (no user authentication required)
if (!isset($_SESSION['application_started'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Application not started.']);
    exit();
}

// Return session information for application progress tracking
echo json_encode([
    'success' => true,
    'temp_session_id' => $_SESSION['temp_session_id'] ?? session_id(),
    'application_started' => true,
    'progress_steps' => array_keys($_SESSION['application_progress'] ?? []),
    // Only include user_id and application_number if they exist (after final submission)
    'user_id' => isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null,
    'application_number' => isset($_SESSION['application_number']) ? $_SESSION['application_number'] : null
]);
?>

