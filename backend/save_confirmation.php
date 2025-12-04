<?php
session_start();
require_once 'db_connection.php';

// You MUST add a user_id column to the applicants table in MySQL:
// ALTER TABLE applicants ADD COLUMN user_id INT NULL AFTER id;

// Require application to be started
if (!isset($_SESSION['application_started'])) {
    header("Location: ../college-admission-portal/landing.php?error=Please+start+the+application+first");
    exit();
}

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

// Store confirmation data temporarily in session
$confirmationData = [
    'academic_status' => $academicStatus,
    'enrolled_in_college' => $alreadyEnrolled,
    'first_time_application' => $firstTimeApplying,
    'transferred_in_high_school' => $transferred,
    'transferred_from' => $transferredFrom,
    'graduate_of_batstateu' => $bsuGraduate,
    'graduate_from' => $bsuSchool
];

$_SESSION['application_progress']['confirmation'] = $confirmationData;

// After storing temporarily, go to the next step in the flow
header("Location: ../college-admission-portal/aap.html");
exit();

?>


