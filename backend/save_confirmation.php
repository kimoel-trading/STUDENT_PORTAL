<?php
session_start();
require_once 'db_connection.php';

// You MUST add a user_id column to the applicants table in MySQL:
// ALTER TABLE applicants ADD COLUMN user_id INT NULL AFTER id;

// Require user to be logged in so we know whose record to update
if (!isset($_SESSION['user_id'])) {
    header("Location: ../college-admission-portal/landing.php?error=Please+login+first");
    exit();
}

$user_id            = $_SESSION['user_id'];

// Collect POST data safely
$academicStatus     = $_POST['academicStatus']     ?? null;
$alreadyEnrolled    = $_POST['alreadyEnrolled']    ?? null;
$firstTimeApplying  = $_POST['firstTimeApplying']  ?? null;
$transferred        = $_POST['transferred']        ?? null;
$transferredFrom    = $_POST['transferredFrom']    ?? null;
$transferredYear    = $_POST['transferredYear']    ?? null;
$bsuGraduate        = $_POST['bsuGraduate']        ?? null;
$bsuSchool          = $_POST['bsuSchool']          ?? null;

// Basic validation: make sure required radio fields are present
if (
    !$academicStatus ||
    !$alreadyEnrolled ||
    !$firstTimeApplying ||
    !$transferred ||
    !$bsuGraduate
) {
    header("Location: ../college-admission-portal/confirmation.html?error=Please+complete+all+required+fields");
    exit();
}

// If user answered "yes" to transferred but left sub-fields empty, keep them as null
if ($transferred !== 'yes') {
    $transferredFrom = null;
    $transferredYear = null;
}

// If user is not a BSU graduate, clear the school field
if ($bsuGraduate !== 'yes') {
    $bsuSchool = null;
}

// If there is a year, append it to the "transferred_from" text so it still fits your table
if ($transferredFrom && $transferredYear) {
    $transferredFrom = $transferredFrom . ' (' . $transferredYear . ')';
}

// Check if this user already has a row in applicants
$checkSql = "SELECT id FROM applicants WHERE user_id = ? LIMIT 1";
$checkStmt = $conn->prepare($checkSql);
$checkStmt->bind_param("i", $user_id);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();

if ($checkResult && $checkResult->num_rows > 0) {
    // UPDATE existing row for this user
    $row = $checkResult->fetch_assoc();
    $applicantId = (int)$row['id'];

    $sql = "UPDATE applicants
            SET academic_status = ?,
                enrolled_in_college = ?,
                first_time_application = ?,
                transferred_in_high_school = ?,
                transferred_from = ?,
                graduate_of_batstateu = ?,
                graduate_from = ?
            WHERE id = ? AND user_id = ?";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        header("Location: ../college-admission-portal/confirmation.html?error=Unable+to+save+your+answers");
        exit();
    }

    $stmt->bind_param(
        "sssssssii",
        $academicStatus,
        $alreadyEnrolled,
        $firstTimeApplying,
        $transferred,
        $transferredFrom,
        $bsuGraduate,
        $bsuSchool,
        $applicantId,
        $user_id
    );
} else {
    // INSERT new row for this user
    $sql = "INSERT INTO applicants
        (user_id, academic_status, enrolled_in_college, first_time_application,
         transferred_in_high_school, transferred_from,
         graduate_of_batstateu, graduate_from)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        header("Location: ../college-admission-portal/confirmation.html?error=Unable+to+save+your+answers");
        exit();
    }

    $stmt->bind_param(
        "isssssss",
        $user_id,
        $academicStatus,
        $alreadyEnrolled,
        $firstTimeApplying,
        $transferred,
        $transferredFrom,
        $bsuGraduate,
        $bsuSchool
    );
}

if ($stmt->execute()) {
    // After saving, go to the next step in the flow
    header("Location: ../college-admission-portal/aap.html");
    exit();
} else {
    header("Location: ../college-admission-portal/confirmation.html?error=Failed+to+save+data");
    exit();
}

?>


