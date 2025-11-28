<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please login first.']);
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

$userId = (int) $_SESSION['user_id'];

$height = isset($data['height']) && $data['height'] !== '' ? (int) $data['height'] : null;
$fatherAge = isset($data['father_age']) && $data['father_age'] !== '' ? (int) $data['father_age'] : null;
$motherAge = isset($data['mother_age']) && $data['mother_age'] !== '' ? (int) $data['mother_age'] : null;
$siblingsInfo = isset($data['siblings_info']) ? $data['siblings_info'] : '[]';
$hasSiblings = isset($data['has_siblings']) ? strtolower($data['has_siblings']) : 'no';
$studentIdImage = isset($data['student_id_image']) ? $data['student_id_image'] : null;

if ($studentIdImage) {
    try {
        $aiResult = verify_id_photo($studentIdImage);
        if (empty($aiResult['is_valid'])) {
            $messages = isset($aiResult['messages']) && is_array($aiResult['messages']) ? $aiResult['messages'] : ['ID photo failed validation.'];
            // Combine all validation messages instead of showing just the first one
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

$fields = [
    'last_name' => $data['last_name'] ?? null,
    'first_name' => $data['first_name'] ?? null,
    'middle_name' => $data['middle_name'] ?? null,
    'name_extension' => $data['name_extension'] ?? null,
    'sex' => $data['sex'] ?? null,
    'birthdate' => $data['birthdate'] ?? null,
    'nationality' => $data['nationality'] ?? null,
    'height' => $height,
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
    'father_age' => $fatherAge,
    'mother_age' => $motherAge,
    'father_occupation' => $data['father_occupation'] ?? null,
    'mother_occupation' => $data['mother_occupation'] ?? null,
    'father_contact_no' => $data['father_contact_no'] ?? null,
    'mother_contact_no' => $data['mother_contact_no'] ?? null,
    'family_income_range' => $data['family_income_range'] ?? null,
    'siblings_info' => $siblingsInfo,
    'student_id_image' => $studentIdImage,
];

$sql = "INSERT INTO personal (
            user_id, last_name, first_name, middle_name, name_extension,
            sex, birthdate, nationality, height, region, province,
            city_municipality, barangay, house_address, email, mobile_no,
            telephone_no, contact_name, contact_address, contact_mobile,
            contact_relationship, first_member_to_apply, recipient_of_4ps,
            member_of_indigenous_group, member_of_lgbtqia, internally_displaced_person,
            disability, solo_parent, father_name, mother_name, mother_maiden_name,
            father_age, mother_age, father_occupation, mother_occupation,
            father_contact_no, mother_contact_no, family_income_range, siblings_info, student_id_image
        ) VALUES (
            ?,?,?,?,?,?,?,?,?,?,
            ?,?,?,?,?,?,?,?,?,?,
            ?,?,?,?,?,?,?,?,?,?,
            ?,?,?,?,?,?,?,?,?,?
        )
        ON DUPLICATE KEY UPDATE
            last_name = VALUES(last_name),
            first_name = VALUES(first_name),
            middle_name = VALUES(middle_name),
            name_extension = VALUES(name_extension),
            sex = VALUES(sex),
            birthdate = VALUES(birthdate),
            nationality = VALUES(nationality),
            height = VALUES(height),
            region = VALUES(region),
            province = VALUES(province),
            city_municipality = VALUES(city_municipality),
            barangay = VALUES(barangay),
            house_address = VALUES(house_address),
            email = VALUES(email),
            mobile_no = VALUES(mobile_no),
            telephone_no = VALUES(telephone_no),
            contact_name = VALUES(contact_name),
            contact_address = VALUES(contact_address),
            contact_mobile = VALUES(contact_mobile),
            contact_relationship = VALUES(contact_relationship),
            first_member_to_apply = VALUES(first_member_to_apply),
            recipient_of_4ps = VALUES(recipient_of_4ps),
            member_of_indigenous_group = VALUES(member_of_indigenous_group),
            member_of_lgbtqia = VALUES(member_of_lgbtqia),
            internally_displaced_person = VALUES(internally_displaced_person),
            disability = VALUES(disability),
            solo_parent = VALUES(solo_parent),
            father_name = VALUES(father_name),
            mother_name = VALUES(mother_name),
            mother_maiden_name = VALUES(mother_maiden_name),
            father_age = VALUES(father_age),
            mother_age = VALUES(mother_age),
            father_occupation = VALUES(father_occupation),
            mother_occupation = VALUES(mother_occupation),
            father_contact_no = VALUES(father_contact_no),
            mother_contact_no = VALUES(mother_contact_no),
            family_income_range = VALUES(family_income_range),
            siblings_info = VALUES(siblings_info),
            student_id_image = VALUES(student_id_image)";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to prepare statement.']);
    exit();
}

$types = [
    'i', // user_id
    's','s','s','s','s','s','s', // last_name ... nationality
    'i', // height
    's','s','s','s','s','s','s','s','s','s','s','s','s','s','s','s','s','s','s','s','s','s', // region ... mother_maiden_name
    'i','i', // father_age, mother_age
    's','s','s','s','s','s','s' // remaining strings including student_id_image
];

$typeString = implode('', $types);

$params = [
    $userId,
    $fields['last_name'],
    $fields['first_name'],
    $fields['middle_name'],
    $fields['name_extension'],
    $fields['sex'],
    $fields['birthdate'],
    $fields['nationality'],
    $fields['height'],
    $fields['region'],
    $fields['province'],
    $fields['city_municipality'],
    $fields['barangay'],
    $fields['house_address'],
    $fields['email'],
    $fields['mobile_no'],
    $fields['telephone_no'],
    $fields['contact_name'],
    $fields['contact_address'],
    $fields['contact_mobile'],
    $fields['contact_relationship'],
    $fields['first_member_to_apply'],
    $fields['recipient_of_4ps'],
    $fields['member_of_indigenous_group'],
    $fields['member_of_lgbtqia'],
    $fields['internally_displaced_person'],
    $fields['disability'],
    $fields['solo_parent'],
    $fields['father_name'],
    $fields['mother_name'],
    $fields['mother_maiden_name'],
    $fields['father_age'],
    $fields['mother_age'],
    $fields['father_occupation'],
    $fields['mother_occupation'],
    $fields['father_contact_no'],
    $fields['mother_contact_no'],
    $fields['family_income_range'],
    $fields['siblings_info'],
    $fields['student_id_image'],
];

$stmt->bind_param($typeString, ...$params);

if ($stmt->execute()) {
    $personalId = null;
    $personalStmt = $conn->prepare("SELECT id FROM personal WHERE user_id = ? LIMIT 1");
    if ($personalStmt) {
        $personalStmt->bind_param("i", $userId);
        $personalStmt->execute();
        $result = $personalStmt->get_result();
        if ($result && $row = $result->fetch_assoc()) {
            $personalId = (int) $row['id'];
        }
        $personalStmt->close();
    }

    if ($personalId) {
        $deleteStmt = $conn->prepare("DELETE FROM siblings WHERE personal_id = ?");
        if ($deleteStmt) {
            $deleteStmt->bind_param("i", $personalId);
            $deleteStmt->execute();
            $deleteStmt->close();
        }

        if ($hasSiblings === 'yes') {
            $siblingsArray = json_decode($siblingsInfo, true);
            if (is_array($siblingsArray) && count($siblingsArray) > 0) {
                $insertStmt = $conn->prepare("INSERT INTO siblings (personal_id, full_name, age, educational_attainment, school, year_graduated, `option`) VALUES (?, ?, ?, ?, ?, ?, ?)");
                if ($insertStmt) {
                    $fullName = $education = $school = $yearGraduated = $optionValue = '';
                    $ageValue = null;
                    $insertStmt->bind_param("isissss", $personalId, $fullName, $ageValue, $education, $school, $yearGraduated, $optionValue);

                    foreach ($siblingsArray as $sibling) {
                        $fullName = isset($sibling['fullname']) ? trim($sibling['fullname']) : '';
                        if ($fullName === '') {
                            continue;
                        }
                        $ageValue = isset($sibling['age']) && $sibling['age'] !== '' ? (int) $sibling['age'] : null;
                        $education = $sibling['education'] ?? '';
                        $school = $sibling['school'] ?? '';
                        $yearGraduated = $sibling['year'] ?? '';
                        $optionValue = $sibling['option'] ?? '';
                        $insertStmt->execute();
                    }

                    $insertStmt->close();
                }
            }
        }
    }

    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to save personal data.']);
}

?>


