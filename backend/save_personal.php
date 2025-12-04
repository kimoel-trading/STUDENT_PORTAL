<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['application_started'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Application not started.']);
    exit();
}

require_once 'db_connection.php';

function verify_id_photo($base64Image) {
    if (!$base64Image) {
        return ['is_valid' => false, 'messages' => ['No ID image provided.']];
    }

    $payload = json_encode(['image' => $base64Image]);
    if ($payload === false) {
        throw new Exception('Failed to encode image payload.');
    }

    $endpoint = 'http://127.0.0.1:5001/verify';
    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_TIMEOUT => 20,
    ]);

    $response = curl_exec($ch);
    $curlError = curl_error($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_RESPONSE_CODE) ?: 0;
    curl_close($ch);

    if ($response === false) {
        throw new Exception("AI validator unreachable: {$curlError}");
    }

    $decoded = json_decode($response, true);
    if (!is_array($decoded)) {
        throw new Exception('Invalid response from AI validator.');
    }

    if ($statusCode >= 400) {
        $message = $decoded['detail'] ?? 'AI validator rejected the image.';
        throw new Exception($message);
    }

    return $decoded;
}

// Make sure your `personal` table has a `user_id` column with a UNIQUE index:
// ALTER TABLE personal ADD COLUMN user_id INT NOT NULL UNIQUE AFTER id;
// Make sure your `siblings` table has a `personal_id` column to link back to `personal.id`.

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid request payload.']);
    exit();
}

$requiredFields = [
    'last_name', 'first_name', 'sex', 'birthdate', 'nationality',
    'region', 'province', 'city_municipality', 'barangay',
    'house_address', 'email', 'mobile_no',
    'contact_name', 'contact_address', 'contact_mobile', 'contact_relationship'
];

foreach ($requiredFields as $field) {
    if (!isset($data[$field]) || $data[$field] === '') {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => "Missing field: {$field}"]);
        exit();
    }
}

// Validate ID photo if provided
if ($studentIdImage) {
    try {
        $aiResult = verify_id_photo($studentIdImage);
        if (empty($aiResult['is_valid'])) {
            $messages = isset($aiResult['messages']) && is_array($aiResult['messages']) ? $aiResult['messages'] : ['ID photo failed validation.'];
            $combinedMessage = count($messages) > 1 ? implode(' ', $messages) : $messages[0];
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => $combinedMessage]);
            exit();
        }
    } catch (Exception $e) {
        http_response_code(502);
        echo json_encode(['success' => false, 'message' => 'ID validation service error: ' . $e->getMessage()]);
        exit();
    }
}

// Store validated data temporarily in session (will be saved to database at final submission)
$personalData = [
    'last_name' => $data['last_name'] ?? null,
    'first_name' => $data['first_name'] ?? null,
    'middle_name' => $data['middle_name'] ?? null,
    'name_extension' => $data['name_extension'] ?? null,
    'sex' => $data['sex'] ?? null,
    'birthdate' => $data['birthdate'] ?? null,
    'nationality' => $data['nationality'] ?? null,
    'height' => isset($data['height']) && $data['height'] !== '' ? (int) $data['height'] : null,
    'region' => $data['region'] ?? null,
    'province' => $data['province'] ?? null,
    'city_municipality' => $data['city_municipality'] ?? null,
    'barangay' => $data['barangay'] ?? null,
    'house_address' => $data['house_address'] ?? null,
    'email' => $data['email'] ?? null,
    'mobile_no' => $data['mobile_no'] ?? null,
    'telephone_no' => $data['telephone_no'] ?? null,
    'contact_name' => $data['contact_name'] ?? null,
    'contact_address' => $data['contact_address'] ?? null,
    'contact_mobile' => $data['contact_mobile'] ?? null,
    'contact_relationship' => $data['contact_relationship'] ?? null,
    'first_member_to_apply' => $data['first_member_to_apply'] ?? null,
    'recipient_of_4ps' => $data['recipient_of_4ps'] ?? null,
    'member_of_indigenous_group' => $data['member_of_indigenous_group'] ?? null,
    'member_of_lgbtqia' => $data['member_of_lgbtqia'] ?? null,
    'internally_displaced_person' => $data['internally_displaced_person'] ?? null,
    'disability' => $data['disability'] ?? null,
    'solo_parent' => $data['solo_parent'] ?? null,
    'father_name' => $data['father_name'] ?? null,
    'mother_name' => $data['mother_name'] ?? null,
    'mother_maiden_name' => $data['mother_maiden_name'] ?? null,
    'father_age' => isset($data['father_age']) && $data['father_age'] !== '' ? (int) $data['father_age'] : null,
    'mother_age' => isset($data['mother_age']) && $data['mother_age'] !== '' ? (int) $data['mother_age'] : null,
    'father_occupation' => $data['father_occupation'] ?? null,
    'mother_occupation' => $data['mother_occupation'] ?? null,
    'father_contact_no' => $data['father_contact_no'] ?? null,
    'mother_contact_no' => $data['mother_contact_no'] ?? null,
    'family_income_range' => $data['family_income_range'] ?? null,
    'siblings_info' => $data['siblings_info'] ?? '[]',
    'student_id_image' => $studentIdImage,
    'has_siblings' => isset($data['has_siblings']) ? strtolower($data['has_siblings']) : 'no'
];

// Store in session for later use during final submission
$_SESSION['application_progress']['personal'] = $personalData;

echo json_encode(['success' => true, 'message' => 'Personal information validated and stored temporarily.']);

?>


