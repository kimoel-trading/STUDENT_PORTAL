<?php
session_start();
require_once 'db_connection.php';

// You MUST add a user_id column to the aap table in MySQL (run once in phpMyAdmin):
// ALTER TABLE aap ADD COLUMN user_id INT NULL AFTER id;

// Require user to be logged in so we know whose record to update
if (!isset($_SESSION['user_id'])) {
    header("Location: ../college-admission-portal/landing.php?error=Please+login+first");
    exit();
}

$user_id = $_SESSION['user_id'];

// Get selected AAP option
$aapChoice = $_POST['aap'] ?? null;

if (!$aapChoice) {
    header("Location: ../college-admission-portal/aap.html?error=Please+select+an+AAP+option");
    exit();
}

// Default all flags to 'no'
$is_indigent_student          = 'no';
$is_als_graduate             = 'no';
$is_indigenous_people        = 'no';
$is_pwd                      = 'no';
$is_iscolar_ng_bayan         = 'no';
$is_children_of_solo_parent  = 'no';
$is_batstateu_lab_graduate   = 'no';

// Turn on the one corresponding to the selection (if not "none")
switch ($aapChoice) {
    case 'indigent':
        $is_indigent_student = 'yes';
        break;
    case 'als':
        $is_als_graduate = 'yes';
        break;
    case 'indigenous':
        $is_indigenous_people = 'yes';
        break;
    case 'pwd':
        $is_pwd = 'yes';
        break;
    case 'iskolar':
        $is_iscolar_ng_bayan = 'yes';
        break;
    case 'solo-parent':
        $is_children_of_solo_parent = 'yes';
        break;
    case 'lab-school':
        $is_batstateu_lab_graduate = 'yes';
        break;
    case 'none':
    default:
        // leave all as 'no'
        break;
}

// Check if this user already has a row in aap
$checkSql = "SELECT id FROM aap WHERE user_id = ? LIMIT 1";
$checkStmt = $conn->prepare($checkSql);
$checkStmt->bind_param("i", $user_id);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();

if ($checkResult && $checkResult->num_rows > 0) {
    // UPDATE existing row
    $row = $checkResult->fetch_assoc();
    $aapId = (int)$row['id'];

    $sql = "UPDATE aap
            SET is_indigent_student = ?,
                is_als_graduate = ?,
                is_indigenous_people = ?,
                is_pwd = ?,
                is_iscolar_ng_bayan = ?,
                is_children_of_solo_parent = ?,
                is_batstateu_lab_graduate = ?
            WHERE id = ? AND user_id = ?";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        header("Location: ../college-admission-portal/aap.html?error=Unable+to+save+AAP+selection");
        exit();
    }

    $stmt->bind_param(
        "sssssssii",
        $is_indigent_student,
        $is_als_graduate,
        $is_indigenous_people,
        $is_pwd,
        $is_iscolar_ng_bayan,
        $is_children_of_solo_parent,
        $is_batstateu_lab_graduate,
        $aapId,
        $user_id
    );
} else {
    // INSERT new row
    $sql = "INSERT INTO aap
        (user_id, is_indigent_student, is_als_graduate, is_indigenous_people,
         is_pwd, is_iscolar_ng_bayan, is_children_of_solo_parent, is_batstateu_lab_graduate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        header("Location: ../college-admission-portal/aap.html?error=Unable+to+save+AAP+selection");
        exit();
    }

    $stmt->bind_param(
        "isssssss",
        $user_id,
        $is_indigent_student,
        $is_als_graduate,
        $is_indigenous_people,
        $is_pwd,
        $is_iscolar_ng_bayan,
        $is_children_of_solo_parent,
        $is_batstateu_lab_graduate
    );
}

if ($stmt->execute()) {
    // Go to next step
    header("Location: ../college-admission-portal/personal.html");
    exit();
} else {
    header("Location: ../college-admission-portal/aap.html?error=Failed+to+save+AAP+selection");
    exit();
}

?>


