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

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please login first.']);
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

$userId = (int) $_SESSION['user_id'];

try {
    $conn->begin_transaction();

    $deleteSql = "DELETE FROM program_choices WHERE user_id = ?";
    $deleteStmt = $conn->prepare($deleteSql);
    if (!$deleteStmt) {
        throw new Exception('Failed to prepare delete statement: ' . $conn->error);
    }
    $deleteStmt->bind_param('i', $userId);
    if (!$deleteStmt->execute()) {
        throw new Exception('Failed to clear existing program choices: ' . $deleteStmt->error);
    }
    $deleteStmt->close();

    $insertSql = "INSERT INTO program_choices (user_id, choice_number, program_name, campus_name) VALUES (?, ?, ?, ?)";
    $insertStmt = $conn->prepare($insertSql);
    if (!$insertStmt) {
        throw new Exception('Failed to prepare insert statement: ' . $conn->error);
    }

    foreach ($data['choices'] as $choice) {
        $choiceNumber = isset($choice['number']) ? (int)$choice['number'] : 0;
        $programName = isset($choice['program']) ? trim($choice['program']) : '';
        $campusName = isset($choice['campus']) ? trim($choice['campus']) : '';

        if ($choiceNumber <= 0 || $programName === '' || $campusName === '') {
            throw new Exception('Each choice must include a valid number, program, and campus.');
        }

        $insertStmt->bind_param('iiss', $userId, $choiceNumber, $programName, $campusName);
        if (!$insertStmt->execute()) {
            throw new Exception('Failed to save program choice #' . $choiceNumber . ': ' . $insertStmt->error);
        }
    }

    $insertStmt->close();
    $conn->commit();

    echo json_encode(['success' => true, 'message' => 'Program choices saved successfully.']);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} finally {
    $conn->close();
}
?>
