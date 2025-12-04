<?php
session_start();
header('Content-Type: application/json');

ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

set_exception_handler(function ($exception) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $exception->getMessage()
    ]);
    exit();
});

if (!isset($_SESSION['application_started'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Application not started.']);
    exit();
}

require_once 'db_connection.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data || !isset($data['choices']) || !is_array($data['choices']) || empty($data['choices'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid or missing program choices.']);
    exit();
}

// Validate the choices
$validatedChoices = [];
foreach ($data['choices'] as $choice) {
    $choiceNumber = isset($choice['number']) ? (int)$choice['number'] : 0;
    $programName = isset($choice['program']) ? trim($choice['program']) : '';
    $campusName = isset($choice['campus']) ? trim($choice['campus']) : '';

    if ($choiceNumber <= 0 || $programName === '' || $campusName === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Each choice must include a valid number, program, and campus.']);
        exit();
    }

    $validatedChoices[] = [
        'number' => $choiceNumber,
        'program' => $programName,
        'campus' => $campusName
    ];
}

// Store program choices temporarily in session
$_SESSION['application_progress']['program_choices'] = $validatedChoices;

echo json_encode(['success' => true, 'message' => 'Program choices validated and stored temporarily.']);
?>
