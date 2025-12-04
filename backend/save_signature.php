<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['application_started'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Application not started.']);
    exit();
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data || !isset($data['signature'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No signature data provided.']);
    exit();
}

// Store signature temporarily in session
$_SESSION['application_progress']['signature'] = $data['signature'];

echo json_encode(['success' => true, 'message' => 'Signature saved temporarily.']);
?>
