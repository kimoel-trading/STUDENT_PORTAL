<?php
session_start();
require_once 'db_connection.php';

// You MUST add a user_id column to the aap table in MySQL (run once in phpMyAdmin):
// ALTER TABLE aap ADD COLUMN user_id INT NULL AFTER id;

// Require application to be started
if (!isset($_SESSION['application_started'])) {
    header("Location: ../college-admission-portal/landing.php?error=Please+start+the+application+first");
    exit();
}

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

// Store AAP data temporarily in session
$aapData = [
    'aap_choice' => $aapChoice,
    'is_indigent_student' => $is_indigent_student,
    'is_als_graduate' => $is_als_graduate,
    'is_indigenous_people' => $is_indigenous_people,
    'is_pwd' => $is_pwd,
    'is_iscolar_ng_bayan' => $is_iscolar_ng_bayan,
    'is_children_of_solo_parent' => $is_children_of_solo_parent,
    'is_batstateu_lab_graduate' => $is_batstateu_lab_graduate
];

$_SESSION['application_progress']['aap'] = $aapData;

    // Go to next step
    header("Location: ../college-admission-portal/personal.html");
    exit();

?>


