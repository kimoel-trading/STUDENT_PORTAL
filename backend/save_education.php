<?php 
session_start(); 
header('Content-Type: application/json'); 

// Force PHP notices/warnings into JSON responses instead of HTML
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

set_error_handler(function ($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

set_exception_handler(function ($exception) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $exception->getMessage()
    ]);
    exit();
});

// Check if the user is logged in
if (!isset($_SESSION['user_id'])) { 
    http_response_code(401); 
    echo json_encode(['success' => false, 'message' => 'Please login first.']); 
    exit(); 
}

// Include the database connection
require_once 'db_connection.php'; 

// Get raw input data
$rawInput = file_get_contents('php://input'); 
$data = json_decode($rawInput, true); 

// Check if the input data is valid
if (!$data) { 
    http_response_code(400); 
    echo json_encode(['success' => false, 'message' => 'Invalid request payload.']); 
    exit(); 
}

// Get the user ID from the session
$userId = (int) $_SESSION['user_id']; 

// Map file numbers to database column names
$fileColumnMap = [
    1 => 'grades_form_1',
    2 => 'form_137_junior',
    3 => 'form_137_senior',
    4 => 'certificate_of_enrollment_path'
];

// Prepare file data (Base64 strings)
$fileData = [];
foreach ($fileColumnMap as $fileNum => $columnName) {
    $fileData[$columnName] = isset($data['files'][$fileNum]) ? $data['files'][$fileNum] : null;
}

// Prepare educational information fields
$shs = isset($data['shs']) ? trim($data['shs']) : ''; 
$shsEmail = isset($data['shs_email']) ? trim($data['shs_email']) : ''; 
$schoolType = isset($data['school_type']) ? trim($data['school_type']) : ''; 
$track = isset($data['track']) ? trim($data['track']) : ''; 
$strand = isset($data['strand']) ? trim($data['strand']) : ''; 
$specialization = isset($data['specialization']) ? trim($data['specialization']) : ''; 
$juniorHsCompletionYear = isset($data['junior_hs_completion_year']) ? trim($data['junior_hs_completion_year']) : ''; 
$seniorHsCompletionYear = isset($data['senior_hs_completion_year']) ? trim($data['senior_hs_completion_year']) : ''; 
$categoryOfApplicant = isset($data['category_of_applicant']) ? trim($data['category_of_applicant']) : ''; 

// Prepare Junior High School final grades
$finalGradesInput = isset($data['final_grades']) && is_array($data['final_grades']) ? $data['final_grades'] : [];
$mathGrade = isset($finalGradesInput['math']) ? trim($finalGradesInput['math']) : '';
$scienceGrade = isset($finalGradesInput['science']) ? trim($finalGradesInput['science']) : '';
$englishGrade = isset($finalGradesInput['english']) ? trim($finalGradesInput['english']) : '';

// Validate required fields
$requiredFields = [
    'shs' => $shs, 
    'school_type' => $schoolType, 
    'track' => $track, 
    'junior_hs_completion_year' => $juniorHsCompletionYear, 
    'senior_hs_completion_year' => $seniorHsCompletionYear, 
    'category_of_applicant' => $categoryOfApplicant
];

foreach ($requiredFields as $fieldName => $fieldValue) {
    if (empty($fieldValue)) { 
        http_response_code(422); 
        echo json_encode(['success' => false, 'message' => "Missing required field: {$fieldName}"]); 
        exit(); 
    }
}

// Validate final grades
$gradeFields = [
    'math' => $mathGrade,
    'science' => $scienceGrade,
    'english' => $englishGrade
];

foreach ($gradeFields as $gradeName => $gradeValue) {
    if ($gradeValue === '' || !is_numeric($gradeValue)) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => "Missing or invalid grade for {$gradeName}"]);
        exit();
    }
}

$mathGrade = (float) $mathGrade;
$scienceGrade = (float) $scienceGrade;
$englishGrade = (float) $englishGrade;

// Prepare Grade 11 records (first and second semester subjects)
$grade11Input = isset($data['grade_11_records']) && is_array($data['grade_11_records']) ? $data['grade_11_records'] : null;

$grade11Config = [
    's1_math' => ['label' => 'Grade 11 Math (First Semester)', 'default_priority' => 'Pre-Calculus'],
    's1_science' => ['label' => 'Grade 11 Science (First Semester)', 'default_priority' => 'Earth Science'],
    's1_english' => ['label' => 'Grade 11 English (First Semester)', 'default_priority' => 'Oral Communication'],
    's2_math' => ['label' => 'Grade 11 Math (Second Semester)', 'default_priority' => 'Basic Calculus'],
    's2_science' => ['label' => 'Grade 11 Science (Second Semester)', 'default_priority' => 'General Chemistry I'],
    's2_english' => ['label' => 'Grade 11 English (Second Semester)', 'default_priority' => 'Reading and Writing']
];

if (!$grade11Input) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Missing Grade 11 records payload.']);
    exit();
}

$grade11Data = [];
foreach ($grade11Config as $key => $config) {
    $entry = isset($grade11Input[$key]) && is_array($grade11Input[$key]) ? $grade11Input[$key] : [];
    $priority = isset($entry['priority']) ? trim($entry['priority']) : '';
    $priority = $priority !== '' ? $priority : $config['default_priority'];

    if ($priority === '') {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => "Missing priority subject for {$config['label']}"]);
        exit();
    }

    $alternative = isset($entry['alternative']) ? trim($entry['alternative']) : '';
    $alternative = $alternative !== '' ? $alternative : null;

    $na = !empty($entry['na']) ? 1 : 0;
    $gradeRaw = isset($entry['grade']) ? trim($entry['grade']) : '';
    $gradeValue = null;

    if (!$na) {
        if ($gradeRaw === '' || !is_numeric($gradeRaw)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => "Missing or invalid grade for {$config['label']}"]);
            exit();
        }
        $gradeValue = (float) $gradeRaw;
    }

    $grade11Data[$key] = [
        'priority' => $priority,
        'alternative' => $alternative,
        'grade' => $gradeValue,
        'na' => $na
    ];
}

// Validate that required files (1, 2, 3, 4) are uploaded
$requiredFiles = [1, 2, 3, 4]; // Grades Form 1, JHS Form 137, SHS Form 137, Certificate of Enrollment
foreach ($requiredFiles as $fileNum) {
    $columnName = $fileColumnMap[$fileNum];
    if (empty($fileData[$columnName])) { 
        http_response_code(422); 
        echo json_encode(['success' => false, 'message' => "Missing required file: {$columnName}"]); 
        exit(); 
    }
}
// File 5 (cert_unavailability) is optional - no validation needed

// Build SQL query with ON DUPLICATE KEY UPDATE
$sql = "INSERT INTO education_attachments (
            student_id, shs, shs_email, school_type, track, strand, specialization,
            junior_hs_completion_year, senior_hs_completion_year, category_of_applicant,
            grades_form_1, form_137_junior, form_137_senior, certificate_of_enrollment_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            shs = VALUES(shs), 
            shs_email = VALUES(shs_email), 
            school_type = VALUES(school_type), 
            track = VALUES(track), 
            strand = VALUES(strand), 
            specialization = VALUES(specialization), 
            junior_hs_completion_year = VALUES(junior_hs_completion_year), 
            senior_hs_completion_year = VALUES(senior_hs_completion_year), 
            category_of_applicant = VALUES(category_of_applicant), 
            grades_form_1 = VALUES(grades_form_1),
            form_137_junior = VALUES(form_137_junior),
            form_137_senior = VALUES(form_137_senior),
            certificate_of_enrollment_path = VALUES(certificate_of_enrollment_path),
            updated_at = CURRENT_TIMESTAMP";

$gradeInsertSql = "INSERT INTO final_grades (student_id, subject_name, grade_percentage) 
                   VALUES (?, ?, ?) 
                   ON DUPLICATE KEY UPDATE 
                       grade_percentage = VALUES(grade_percentage), 
                       updated_at = CURRENT_TIMESTAMP";

$grade11ColumnsOrder = [];
foreach (array_keys($grade11Config) as $key) {
    $grade11ColumnsOrder[] = "{$key}_priority";
    $grade11ColumnsOrder[] = "{$key}_alternative";
    $grade11ColumnsOrder[] = "{$key}_grade";
    $grade11ColumnsOrder[] = "{$key}_na";
}

$grade11Sql = "INSERT INTO grade_11_records (
                    student_id, " . implode(', ', $grade11ColumnsOrder) . "
                ) VALUES (" . implode(', ', array_fill(0, count($grade11ColumnsOrder) + 1, '?')) . ")
                ON DUPLICATE KEY UPDATE 
                    " . implode(', ', array_map(function ($column) {
                        return "{$column} = VALUES({$column})";
                    }, $grade11ColumnsOrder)) . ",
                    updated_at = CURRENT_TIMESTAMP";

try {
    $conn->begin_transaction();

    $stmt = $conn->prepare($sql); 
    if (!$stmt) { 
        throw new Exception('Failed to prepare education statement: ' . $conn->error);
    }

    $stmt->bind_param(
        'isssssssssssss',
        $userId, $shs, $shsEmail, $schoolType, $track, $strand, $specialization,
        $juniorHsCompletionYear, $seniorHsCompletionYear, $categoryOfApplicant,
        $fileData['grades_form_1'], $fileData['form_137_junior'],
        $fileData['form_137_senior'], $fileData['certificate_of_enrollment_path']
    );

    if (!$stmt->execute()) {
        throw new Exception('Failed to save education attachments: ' . $stmt->error);
    }
    $stmt->close();

    $gradeStmt = $conn->prepare($gradeInsertSql);
    if (!$gradeStmt) {
        throw new Exception('Failed to prepare final grades statement: ' . $conn->error);
    }

    $subject = '';
    $gradePercentage = 0.0;
    $gradeStmt->bind_param('isd', $userId, $subject, $gradePercentage);

    $gradeMappings = [
        'Mathematics' => $mathGrade,
        'Science' => $scienceGrade,
        'English' => $englishGrade
    ];

    foreach ($gradeMappings as $subjectName => $gradeValue) {
        $subject = $subjectName;
        $gradePercentage = $gradeValue;
        if (!$gradeStmt->execute()) {
            throw new Exception('Failed to save final grade for ' . $subjectName . ': ' . $gradeStmt->error);
        }
    }

    $gradeStmt->close();

    $grade11Stmt = $conn->prepare($grade11Sql);
    if (!$grade11Stmt) {
        throw new Exception('Failed to prepare Grade 11 statement: ' . $conn->error);
    }

    $s1MathPriority = $grade11Data['s1_math']['priority'];
    $s1MathAlternative = $grade11Data['s1_math']['alternative'];
    $s1MathGrade = is_null($grade11Data['s1_math']['grade']) ? null : (string)round($grade11Data['s1_math']['grade'], 2);
    $s1MathNA = $grade11Data['s1_math']['na'];

    $s1SciencePriority = $grade11Data['s1_science']['priority'];
    $s1ScienceAlternative = $grade11Data['s1_science']['alternative'];
    $s1ScienceGrade = is_null($grade11Data['s1_science']['grade']) ? null : (string)round($grade11Data['s1_science']['grade'], 2);
    $s1ScienceNA = $grade11Data['s1_science']['na'];

    $s1EnglishPriority = $grade11Data['s1_english']['priority'];
    $s1EnglishAlternative = $grade11Data['s1_english']['alternative'];
    $s1EnglishGrade = is_null($grade11Data['s1_english']['grade']) ? null : (string)round($grade11Data['s1_english']['grade'], 2);
    $s1EnglishNA = $grade11Data['s1_english']['na'];

    $s2MathPriority = $grade11Data['s2_math']['priority'];
    $s2MathAlternative = $grade11Data['s2_math']['alternative'];
    $s2MathGrade = is_null($grade11Data['s2_math']['grade']) ? null : (string)round($grade11Data['s2_math']['grade'], 2);
    $s2MathNA = $grade11Data['s2_math']['na'];

    $s2SciencePriority = $grade11Data['s2_science']['priority'];
    $s2ScienceAlternative = $grade11Data['s2_science']['alternative'];
    $s2ScienceGrade = is_null($grade11Data['s2_science']['grade']) ? null : (string)round($grade11Data['s2_science']['grade'], 2);
    $s2ScienceNA = $grade11Data['s2_science']['na'];

    $s2EnglishPriority = $grade11Data['s2_english']['priority'];
    $s2EnglishAlternative = $grade11Data['s2_english']['alternative'];
    $s2EnglishGrade = is_null($grade11Data['s2_english']['grade']) ? null : (string)round($grade11Data['s2_english']['grade'], 2);
    $s2EnglishNA = $grade11Data['s2_english']['na'];

    $grade11TypeString = 'i' . str_repeat('sssi', count($grade11Config));

    $grade11Stmt->bind_param(
        $grade11TypeString,
        $userId,
        $s1MathPriority, $s1MathAlternative, $s1MathGrade, $s1MathNA,
        $s1SciencePriority, $s1ScienceAlternative, $s1ScienceGrade, $s1ScienceNA,
        $s1EnglishPriority, $s1EnglishAlternative, $s1EnglishGrade, $s1EnglishNA,
        $s2MathPriority, $s2MathAlternative, $s2MathGrade, $s2MathNA,
        $s2SciencePriority, $s2ScienceAlternative, $s2ScienceGrade, $s2ScienceNA,
        $s2EnglishPriority, $s2EnglishAlternative, $s2EnglishGrade, $s2EnglishNA
    );

    if (!$grade11Stmt->execute()) {
        throw new Exception('Failed to save Grade 11 records: ' . $grade11Stmt->error);
    }

    $grade11Stmt->close();

    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Education data saved successfully.']);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} finally {
    $conn->close();
}
?>